import { loadAdversarialCases } from './dataset/adversarial'
import { loadHistoricalCases } from './dataset/historical'
import { loadInvestigatorCases } from './dataset/investigator'
import {
	ensureLabelEntry,
	judgeHumanAgreement,
	loadHumanLabels,
	persistHumanLabels,
	recordModelProposal
} from './judge-validation/validate'
import {
	type VerdictProductionResult,
	produceLLMVerdict,
	produceMockVerdict
} from './produce-verdict'
import { renderReport } from './report'
import { scoreBalance } from './scorers/investigator/balance'
import { scoreCitations } from './scorers/investigator/citations'
import { scoreCompleteness } from './scorers/investigator/completeness'
import { scoreInvestigatorSchema } from './scorers/investigator/schema'
import { scoreSourceTrust } from './scorers/investigator/source-trust'
import {
	type CalibrationDatum,
	buildCalibrationDatum,
	computeCalibration
} from './scorers/judge/calibration'
import { scoreDeterminism } from './scorers/judge/determinism'
import { scoreGrounding } from './scorers/judge/grounding'
import { invokeHarnessOracle } from './scorers/judge/oracle'
import { scoreReasoning } from './scorers/judge/reasoning'
import { scoreRules } from './scorers/judge/rules'
import { scoreSchema } from './scorers/judge/schema'
import { createJsonFileSink } from './trace-replay/sink-json'
import { tryCreateLangfuseSinkFromEnv } from './trace-replay/sink-langfuse'
import { synthesizeTrace } from './trace-replay/synthetic'
import type { TraceSink } from './trace-replay/types'
import type { EvalCase, ParsedVerdict, RunReport, ScorerResult } from './types'
import {
	buildSnapshot,
	computeVersionDiff,
	loadPreviousSnapshot,
	persistSnapshot
} from './version-diff'
import 'dotenv/config'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// --- Types & state ---

interface CliArgs {
	suite: 'judge' | 'investigator' | 'adversarial' | 'all'
	provider: 'mock' | 'llm' | 'ritual-l1'
	determinismRuns: number
	reportPath?: string
	trace: 'off' | 'json' | 'langfuse'
}

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_REPORT_PATH = resolve(
	PACKAGE_ROOT,
	'..',
	'..',
	'..',
	'interpretive-markets',
	'docs',
	'EVAL_REPORT.md'
)

// --- Core functions ---

async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2))
	const startedAt = new Date()
	const runId = `run-${startedAt.getTime()}`
	const results: ScorerResult[] = []
	const verdicts: Record<string, ParsedVerdict> = {}
	const calibrationData: CalibrationDatum[] = []
	const labels = loadHumanLabels()
	let labelsTouched = false
	let caseCount = 0
	const sink = await openTraceSink(args.trace)

	async function emitTraceFor(
		c: EvalCase,
		verdict: ParsedVerdict | null,
		caseResults: ScorerResult[]
	): Promise<void> {
		if (!sink) return
		const trace = await synthesizeTrace({
			runId,
			provider: args.provider === 'llm' ? 'mock' : args.provider,
			case: c,
			verdict,
			scorerResults: caseResults
		})
		await sink.push(trace)
	}

	if (args.suite === 'judge' || args.suite === 'all') {
		for (const c of loadHistoricalCases()) {
			caseCount += 1
			const { result, verdict, production } = await runJudgeSuite(c, args)
			results.push(...result)
			if (verdict) verdicts[c.id] = verdict
			if (production.provider === 'llm' && verdict) {
				ensureLabelEntry(labels, c.id)
				recordModelProposal({
					labels,
					caseId: c.id,
					verdict,
					rationale: production.rationale ?? null,
					model: production.model ?? 'llm'
				})
				labelsTouched = true
			}
			if (verdict && c.expectedFinalOutcome !== undefined) {
				const oracle = invokeHarnessOracle(verdict, c.manifest)
				calibrationData.push(
					buildCalibrationDatum({
						caseId: c.id,
						modelVerdict: verdict,
						enforcedOutcome: oracle.enforcedOutcome as 0 | 1 | 2,
						groundTruthOutcome: c.expectedFinalOutcome
					})
				)
			}
			await emitTraceFor(c, verdict, result)
		}
	}

	if (args.suite === 'investigator' || args.suite === 'all') {
		for (const c of loadInvestigatorCases()) {
			caseCount += 1
			const result = runInvestigatorSuite(c)
			results.push(...result)
			await emitTraceFor(c, null, result)
		}
	}

	if (args.suite === 'adversarial' || args.suite === 'all') {
		for (const c of loadAdversarialCases()) {
			caseCount += 1
			const { result, verdict, production } = await runJudgeSuite(c, args)
			results.push(...result)
			if (verdict) verdicts[c.id] = verdict
			if (production.provider === 'llm' && verdict) {
				ensureLabelEntry(labels, c.id)
				recordModelProposal({
					labels,
					caseId: c.id,
					verdict,
					rationale: production.rationale ?? null,
					model: production.model ?? 'llm'
				})
				labelsTouched = true
			}
			await emitTraceFor(c, verdict, result)
		}
	}

	if (labelsTouched) persistHumanLabels(labels)

	if (sink) {
		await sink.flush()
		console.log(`[eval] traces → ${sink.name} sink`)
	}

	const finishedAt = new Date()
	const report: RunReport = {
		meta: {
			suite: args.suite,
			provider: args.provider === 'llm' ? 'mock' : args.provider,
			startedAt: startedAt.toISOString(),
			finishedAt: finishedAt.toISOString(),
			durationMs: finishedAt.getTime() - startedAt.getTime()
		},
		caseCount,
		results
	}

	const agreement = judgeHumanAgreement(verdicts)
	const calibration = computeCalibration(calibrationData)
	const baselineFailures = results
		.filter((r) => r.outcome === 'fail')
		.map((r) => ({ caseId: r.caseId, scorer: r.scorer, detail: r.detail ?? '(no detail)' }))

	const previous = loadPreviousSnapshot()
	const currentSnapshot = buildSnapshot({
		report,
		humanAgreement: Number.isNaN(agreement.outcomeAgreement)
			? null
			: {
					outcome: agreement.outcomeAgreement,
					tier: agreement.tierAgreement,
					subject: agreement.subjectAgreement,
					meanConfidenceDeltaBps: agreement.meanConfidenceDeltaBps
				},
		calibration: Number.isNaN(calibration.ece) ? null : calibration,
		baselineFailures
	})
	const versionDiff = computeVersionDiff(previous, currentSnapshot)
	persistSnapshot(currentSnapshot)

	const rendered = renderReport({
		report,
		agreement,
		calibration,
		versionDiff,
		baselineFailures,
		providerRequested: args.provider
	})

	const outPath = args.reportPath ?? DEFAULT_REPORT_PATH
	mkdirSync(dirname(outPath), { recursive: true })
	writeFileSync(outPath, rendered)

	const passCount = results.filter((r) => r.outcome === 'pass').length
	const failCount = results.filter((r) => r.outcome === 'fail').length
	const skipCount = results.filter((r) => r.outcome === 'skipped').length
	console.log(
		`[eval] suite=${args.suite} provider=${args.provider} cases=${caseCount} pass=${passCount} fail=${failCount} skipped=${skipCount}`
	)
	if (calibration.casesWithGroundTruth > 0) {
		console.log(
			`[eval] ECE=${calibration.ece.toFixed(4)} maxBucketGap=${calibration.maxCalibrationError.toFixed(4)} (over ${calibration.casesWithGroundTruth} cases)`
		)
	}
	if (agreement.totalLabelledCases > 0) {
		console.log(
			`[eval] judge-vs-human outcome agreement=${(agreement.outcomeAgreement * 100).toFixed(1)}% (${agreement.totalLabelledCases} labelled)`
		)
	} else {
		console.log(
			`[eval] judge-vs-human: no humanVerdict slots populated yet — ${agreement.totalProposedCases} model proposals stored awaiting review`
		)
	}
	console.log(`[eval] report → ${outPath}`)
	process.exit(failCount === 0 ? 0 : 1)
}

// --- Helper functions ---

function parseArgs(argv: string[]): CliArgs {
	const out: CliArgs = { suite: 'all', provider: 'mock', determinismRuns: 3, trace: 'off' }
	const flat: { key: string; value: string }[] = []
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i]
		if (a.startsWith('--')) {
			const eq = a.indexOf('=')
			if (eq !== -1) {
				flat.push({ key: a.slice(0, eq), value: a.slice(eq + 1) })
			} else {
				flat.push({ key: a, value: argv[++i] ?? '' })
			}
		}
	}
	for (const { key, value } of flat) {
		if (key === '--suite') out.suite = value as CliArgs['suite']
		else if (key === '--provider') out.provider = value as CliArgs['provider']
		else if (key === '--runs') out.determinismRuns = Number(value)
		else if (key === '--report') out.reportPath = value
		else if (key === '--trace') out.trace = value as CliArgs['trace']
	}
	return out
}

async function openTraceSink(mode: CliArgs['trace']): Promise<TraceSink | null> {
	if (mode === 'off') return null
	if (mode === 'json') return createJsonFileSink()
	if (mode === 'langfuse') {
		const langfuse = tryCreateLangfuseSinkFromEnv()
		if (!langfuse) {
			console.warn(
				'[eval] --trace=langfuse requested but LANGFUSE_PUBLIC_KEY/SECRET_KEY not set; falling back to json sink'
			)
			return createJsonFileSink()
		}
		return langfuse
	}
	return null
}

async function runJudgeSuite(
	c: EvalCase,
	args: CliArgs
): Promise<{
	result: ScorerResult[]
	verdict: ParsedVerdict | null
	production: VerdictProductionResult
}> {
	const result: ScorerResult[] = []
	const production = args.provider === 'llm' ? await produceLLMVerdict(c) : produceMockVerdict(c)
	const verdict = production.verdict

	if (!verdict) {
		result.push({
			scorer: 'judge/produce-verdict',
			caseId: c.id,
			outcome: 'fail',
			detail: `verdict production failed (${production.provider}): ${production.error ?? 'unknown'}`,
			measured: { provider: production.provider }
		})
		return { result, verdict: null, production }
	}

	const verdictBytes = JSON.stringify(verdict)

	result.push(scoreSchema(c.id, verdict))
	result.push(scoreRules(c, verdict))
	result.push(
		scoreDeterminism(c, args.provider === 'llm' ? 'mock' : args.provider, {
			runs: Array.from({ length: args.determinismRuns }, () => ({
				bytes: verdictBytes,
				verifiability: args.provider === 'mock' ? 'deterministic' : 'attestation'
			}))
		})
	)
	result.push(await scoreGrounding(c, verdict))
	result.push(await scoreReasoning(c, verdict))
	return { result, verdict, production }
}

function runInvestigatorSuite(c: EvalCase): ScorerResult[] {
	return [
		scoreInvestigatorSchema(c, c.dossier),
		scoreCompleteness(c, c.dossier),
		scoreCitations(c, c.dossier),
		scoreBalance(c, c.dossier),
		scoreSourceTrust(c, c.dossier)
	]
}

main().catch((err) => {
	console.error('[eval] runner failed:', err)
	process.exit(1)
})

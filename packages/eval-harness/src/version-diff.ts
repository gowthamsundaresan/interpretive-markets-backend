import type { DefenseFlag } from './defenses'
import type { AttackClassAggregate } from './scorers/adversarial/attack-success'
import type {
	CrossModelClassAggregate,
	TransferableAttackEntry
} from './scorers/adversarial/cross-model-probe'
import type { CalibrationReport } from './scorers/judge/calibration'
import type { RunReport } from './types'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// --- Types & state ---

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SNAPSHOT_DIR = resolve(PACKAGE_ROOT, 'reports')
const PREVIOUS_SNAPSHOT_PATH = resolve(SNAPSHOT_DIR, 'eval-report.previous.json')
const CURRENT_SNAPSHOT_PATH = resolve(SNAPSHOT_DIR, 'eval-report.json')

export interface RunSnapshot {
	generatedAt: string
	provider: string
	caseCount: number
	pass: number
	fail: number
	skipped: number
	scorerCounts: Record<string, { pass: number; fail: number; skipped: number }>
	reviewerAgreement: {
		outcome: number
		tier: number
		subject: number
		meanConfidenceDeltaBps: number
	} | null
	calibration: { ece: number; maxCalibrationError: number; casesWithGroundTruth: number } | null
	baselineFailures: { caseId: string; scorer: string; detail: string }[]
	attackResults: {
		defenseFlag: DefenseFlag
		classes: AttackClassAggregate[]
	} | null
	crossModelResults: {
		defenseFlag: DefenseFlag
		classes: CrossModelClassAggregate[]
		transferableAttacks: TransferableAttackEntry[]
	} | null
}

export interface VersionDiff {
	hasPrevious: boolean
	previousGeneratedAt?: string
	deltas: ScorerDelta[]
	headlineDeltas: HeadlineDelta[]
}

export interface ScorerDelta {
	scorer: string
	previous: { pass: number; fail: number; skipped: number }
	current: { pass: number; fail: number; skipped: number }
	passDelta: number
	failDelta: number
}

export interface HeadlineDelta {
	metric: string
	previous: string
	current: string
}

// --- Core functions ---

export function buildSnapshot(args: {
	report: RunReport
	reviewerAgreement: {
		outcome: number
		tier: number
		subject: number
		meanConfidenceDeltaBps: number
	} | null
	calibration: CalibrationReport | null
	baselineFailures: { caseId: string; scorer: string; detail: string }[]
	attackResults: { defenseFlag: DefenseFlag; classes: AttackClassAggregate[] } | null
	crossModelResults: {
		defenseFlag: DefenseFlag
		classes: CrossModelClassAggregate[]
		transferableAttacks: TransferableAttackEntry[]
	} | null
}): RunSnapshot {
	const scorerCounts: Record<string, { pass: number; fail: number; skipped: number }> = {}
	for (const r of args.report.results) {
		if (!scorerCounts[r.scorer]) scorerCounts[r.scorer] = { pass: 0, fail: 0, skipped: 0 }
		scorerCounts[r.scorer][r.outcome] += 1
	}
	return {
		generatedAt: args.report.meta.finishedAt,
		provider: args.report.meta.provider,
		caseCount: args.report.caseCount,
		pass: args.report.results.filter((r) => r.outcome === 'pass').length,
		fail: args.report.results.filter((r) => r.outcome === 'fail').length,
		skipped: args.report.results.filter((r) => r.outcome === 'skipped').length,
		scorerCounts,
		reviewerAgreement: args.reviewerAgreement,
		calibration: args.calibration
			? {
					ece: args.calibration.ece,
					maxCalibrationError: args.calibration.maxCalibrationError,
					casesWithGroundTruth: args.calibration.casesWithGroundTruth
				}
			: null,
		baselineFailures: args.baselineFailures,
		attackResults: args.attackResults,
		crossModelResults: args.crossModelResults
	}
}

export function loadPreviousSnapshot(): RunSnapshot | null {
	const path = existsSync(PREVIOUS_SNAPSHOT_PATH) ? PREVIOUS_SNAPSHOT_PATH : CURRENT_SNAPSHOT_PATH
	if (!existsSync(path)) return null
	try {
		return JSON.parse(readFileSync(path, 'utf-8')) as RunSnapshot
	} catch {
		return null
	}
}

export function persistSnapshot(snapshot: RunSnapshot): void {
	mkdirSync(SNAPSHOT_DIR, { recursive: true })
	// Rotate: current → previous, new → current.
	if (existsSync(CURRENT_SNAPSHOT_PATH)) {
		const current = readFileSync(CURRENT_SNAPSHOT_PATH, 'utf-8')
		writeFileSync(PREVIOUS_SNAPSHOT_PATH, current)
	}
	writeFileSync(CURRENT_SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2))
}

export function computeVersionDiff(
	previous: RunSnapshot | null,
	current: RunSnapshot
): VersionDiff {
	if (!previous) {
		return { hasPrevious: false, deltas: [], headlineDeltas: [] }
	}
	const deltas: ScorerDelta[] = []
	const allScorers = new Set([
		...Object.keys(previous.scorerCounts),
		...Object.keys(current.scorerCounts)
	])
	for (const scorer of Array.from(allScorers).sort()) {
		const prev = previous.scorerCounts[scorer] ?? { pass: 0, fail: 0, skipped: 0 }
		const cur = current.scorerCounts[scorer] ?? { pass: 0, fail: 0, skipped: 0 }
		deltas.push({
			scorer,
			previous: prev,
			current: cur,
			passDelta: cur.pass - prev.pass,
			failDelta: cur.fail - prev.fail
		})
	}

	const headlineDeltas: HeadlineDelta[] = [
		{ metric: 'cases', previous: String(previous.caseCount), current: String(current.caseCount) },
		{
			metric: 'pass / fail / skipped',
			previous: `${previous.pass} / ${previous.fail} / ${previous.skipped}`,
			current: `${current.pass} / ${current.fail} / ${current.skipped}`
		},
		{
			metric: 'ECE',
			previous: previous.calibration ? previous.calibration.ece.toFixed(4) : '—',
			current: current.calibration ? current.calibration.ece.toFixed(4) : '—'
		},
		{
			metric: 'judge-vs-reviewer outcome',
			previous: previous.reviewerAgreement ? formatPct(previous.reviewerAgreement.outcome) : '—',
			current: current.reviewerAgreement ? formatPct(current.reviewerAgreement.outcome) : '—'
		},
		{
			metric: 'overall ASR',
			previous: formatOverallAsr(previous.attackResults),
			current: formatOverallAsr(current.attackResults)
		},
		{
			metric: 'defense config',
			previous: previous.attackResults?.defenseFlag ?? '—',
			current: current.attackResults?.defenseFlag ?? '—'
		},
		{
			metric: 'transferable attacks',
			previous: String(previous.crossModelResults?.transferableAttacks.length ?? 0),
			current: String(current.crossModelResults?.transferableAttacks.length ?? 0)
		}
	]

	return { hasPrevious: true, previousGeneratedAt: previous.generatedAt, deltas, headlineDeltas }
}

// --- Helper functions ---

function formatPct(n: number): string {
	if (Number.isNaN(n)) return '—'
	return `${(n * 100).toFixed(1)}%`
}

function formatOverallAsr(ar: RunSnapshot['attackResults']): string {
	if (!ar || ar.classes.length === 0) return '—'
	const runs = ar.classes.reduce((a, x) => a + x.totalRuns, 0)
	const successes = ar.classes.reduce((a, x) => a + x.totalSuccesses, 0)
	if (runs === 0) return '—'
	return `${((successes / runs) * 100).toFixed(1)}%`
}

import {
	type RunSnapshot,
	type VersionDiff,
	computeVersionDiff,
	loadPreviousSnapshot
} from '../version-diff'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

// --- Types & state ---

export interface RoundRecapInput {
	round: number
	roundLabel: string
	pinnedJudgeSha: string
	pinnedFrameworkCid: string
	currentSnapshotPath?: string
	previousSnapshotPath?: string
	submitterHandles: string[]
	addendumLabel?: string
	addendumPath?: string
	narrativeOpener?: string
	narrativeClosing?: string
}

interface SubmissionAttribution {
	handle: string
	cases: string[]
	transferableCases: string[]
}

// --- Core functions ---

// Render a per-round recap Markdown document. Auto layer: computeVersionDiff() over the round's
// pre/post RunSnapshots, plus per-class + per-handle aggregation. Prose layer: the
// narrativeOpener / narrativeClosing inputs are handcrafted by the curator and woven around the
// auto layer. Output is meant for docs/rounds/ROUND_N_RECAP.md in the canonical challenges repo.
export function renderRoundRecap(input: RoundRecapInput): string {
	const current = readSnapshot(input.currentSnapshotPath)
	if (!current) {
		throw new Error(
			`[round-recap] could not read current snapshot at ${input.currentSnapshotPath ?? '(unset)'}`
		)
	}
	const previous = readSnapshot(input.previousSnapshotPath) ?? loadPreviousSnapshot()
	const diff: VersionDiff = previous
		? computeVersionDiff(previous, current)
		: { hasPrevious: false, deltas: [], headlineDeltas: [] }

	const submitters = aggregateSubmitters(current, input.submitterHandles)

	return [
		renderHeader(input),
		renderHeadline(diff, current),
		renderPerClassTable(previous, current),
		renderCrossModelTable(current),
		renderTransferableHighlights(current, submitters),
		renderSubmitterLeaderboard(submitters),
		renderAddendumSection(input),
		renderNarrativeClosing(input)
	]
		.filter((s) => s.trim().length > 0)
		.join('\n\n')
}

// --- Helper functions ---

function readSnapshot(path?: string): RunSnapshot | null {
	if (!path) return null
	try {
		return JSON.parse(readFileSync(resolve(path), 'utf-8')) as RunSnapshot
	} catch {
		return null
	}
}

function renderHeader(input: RoundRecapInput): string {
	return [
		`# Round ${input.round} — ${input.roundLabel}`,
		'',
		`**Pinned framework:** \`${input.pinnedFrameworkCid}\``,
		`**Pinned judge.md SHA256:** \`${input.pinnedJudgeSha}\``,
		input.narrativeOpener ? '\n' + input.narrativeOpener : ''
	].join('\n')
}

function renderHeadline(diff: VersionDiff, current: RunSnapshot): string {
	if (!diff.hasPrevious) {
		return '## Headline\n\nFirst round under v2. No previous snapshot to diff against; numbers below are the absolute baseline.'
	}
	const rows = diff.headlineDeltas.map((d) => `| ${d.metric} | ${d.previous} | ${d.current} |`)
	return [
		'## Headline',
		'',
		'| Metric | Previous | Current |',
		'|---|---|---|',
		...rows,
		'',
		`Run completed at ${current.generatedAt}.`
	].join('\n')
}

function renderPerClassTable(previous: RunSnapshot | null, current: RunSnapshot): string {
	const cur = current.crossModelResults?.classes ?? []
	const prev = previous?.crossModelResults?.classes ?? []
	if (cur.length === 0) {
		return '## Per-class ASR\n\nNo cross-model attack results in this snapshot.'
	}
	const prevByClass = new Map(prev.map((c) => [c.attackClass, c]))
	const rows = cur.map((c) => {
		const p = prevByClass.get(c.attackClass)
		const curAsr = pctSum(c)
		const prevAsr = p ? pctSum(p) : '—'
		const arrow =
			p && curAsr !== prevAsr ? (parseFloat(curAsr) < parseFloat(prevAsr) ? '↓' : '↑') : ''
		return `| ${c.attackClass} | ${c.cases} | ${prevAsr} | ${curAsr} ${arrow} | ${c.transferableCount} |`
	})
	return [
		'## Per-class ASR',
		'',
		'| Class | Cases | Previous ASR | Current ASR | Transferable |',
		'|---|---|---|---|---|',
		...rows
	].join('\n')
}

function renderCrossModelTable(current: RunSnapshot): string {
	const classes = current.crossModelResults?.classes ?? []
	if (classes.length === 0) return ''
	const modelIds = uniqueModelIds(classes)
	const rows = classes.map((c) => {
		const cells = modelIds.map((id) => {
			const m = c.perModel[id]
			return m ? `${(m.asr * 100).toFixed(1)}%` : '—'
		})
		return `| ${c.attackClass} | ${cells.join(' | ')} |`
	})
	return [
		'## Per-model ASR',
		'',
		`| Class | ${modelIds.join(' | ')} |`,
		`|---|${modelIds.map(() => '---').join('|')}|`,
		...rows
	].join('\n')
}

function renderTransferableHighlights(
	current: RunSnapshot,
	submitters: SubmissionAttribution[]
): string {
	const entries = current.crossModelResults?.transferableAttacks ?? []
	if (entries.length === 0) {
		return '## Transferable attacks\n\nNo attacks succeeded on ≥2 models this round. The judge held.'
	}
	const lookupHandle = new Map<string, string>()
	for (const s of submitters) for (const c of s.cases) lookupHandle.set(c, s.handle)
	const rows = entries
		.slice(0, 10)
		.map(
			(e) =>
				`- **${e.caseId}** (class ${e.attackClass}) by **${lookupHandle.get(e.caseId) ?? '?'}** — succeeded on ${e.succeededOn.join(', ')} (peak ASR ${(e.highestAsr * 100).toFixed(1)}%)`
		)
	return ['## Transferable attacks', '', ...rows].join('\n')
}

function renderSubmitterLeaderboard(submitters: SubmissionAttribution[]): string {
	if (submitters.length === 0) return ''
	const rows = submitters
		.sort((a, b) => b.transferableCases.length - a.transferableCases.length)
		.map((s) => `| ${s.handle} | ${s.cases.length} | ${s.transferableCases.length} |`)
	return [
		'## Submitter leaderboard',
		'',
		'| Handle | Submissions | Transferable hits |',
		'|---|---|---|',
		...rows
	].join('\n')
}

function renderAddendumSection(input: RoundRecapInput): string {
	if (!input.addendumLabel) return ''
	const body = input.addendumPath ? '\n\n```diff\n' + safeRead(input.addendumPath) + '\n```' : ''
	return [`## Judge addendum (${input.addendumLabel})`, body].join('\n')
}

function renderNarrativeClosing(input: RoundRecapInput): string {
	if (!input.narrativeClosing) return ''
	return ['## Next round', '', input.narrativeClosing].join('\n')
}

function aggregateSubmitters(current: RunSnapshot, handles: string[]): SubmissionAttribution[] {
	const transferable = new Set(
		(current.crossModelResults?.transferableAttacks ?? []).map((t) => t.caseId)
	)
	const allCases = new Set<string>()
	for (const c of current.crossModelResults?.classes ?? []) {
		// CrossModelClassAggregate doesn't carry per-case ids; we rely on the curator-supplied
		// handles list + best-effort caseId pattern matching (rN-<handle>-<slug>) for v2 rounds.
		for (const id of Object.keys(c.perModel)) allCases.add(id)
	}
	return handles.map((handle) => {
		const cases: string[] = []
		const transferableCases: string[] = []
		for (const id of allCases) {
			if (id.includes(`-${handle}-`)) {
				cases.push(id)
				if (transferable.has(id)) transferableCases.push(id)
			}
		}
		return { handle, cases, transferableCases }
	})
}

function pctSum(c: {
	perModel: Record<string, { runs: number; successes: number; asr: number }>
}): string {
	const totalRuns = Object.values(c.perModel).reduce((s, m) => s + m.runs, 0)
	const totalSucc = Object.values(c.perModel).reduce((s, m) => s + m.successes, 0)
	const asr = totalRuns === 0 ? 0 : totalSucc / totalRuns
	return `${(asr * 100).toFixed(1)}%`
}

function uniqueModelIds(classes: { perModel: Record<string, unknown> }[]): string[] {
	const set = new Set<string>()
	for (const c of classes) for (const id of Object.keys(c.perModel)) set.add(id)
	return Array.from(set).sort()
}

function safeRead(path: string): string {
	try {
		return readFileSync(resolve(path), 'utf-8')
	} catch {
		return '(addendum file not found)'
	}
}

// CLI: render a recap from a JSON spec file, write Markdown to disk.
async function main(): Promise<void> {
	const specPath = process.argv[2]
	const outPath = process.argv[3]
	if (!specPath || !outPath) {
		console.error('usage: tsx src/report/round-recap.ts <spec.json> <out.md>')
		process.exit(2)
	}
	const spec = JSON.parse(readFileSync(resolve(specPath), 'utf-8')) as RoundRecapInput
	const md = renderRoundRecap(spec)
	mkdirSync(dirname(resolve(outPath)), { recursive: true })
	writeFileSync(resolve(outPath), md + '\n')
	console.log(`[round-recap] wrote ${outPath}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => {
		console.error('[round-recap] failed:', err)
		process.exit(1)
	})
}

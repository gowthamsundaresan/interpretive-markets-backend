import { enforceRules } from '../scorers/judge/rules'
import type { EvalCase, ParsedVerdict, ScorerResult } from '../types'
import { assembleTrace } from './assembler'
import type { ChainEvent, TracedEventName } from './fromChain'
import type { Trace, TraceSource, TraceSpan } from './types'

// --- Types & state ---

export interface SyntheticTraceInput {
	runId: string
	provider: 'mock' | 'ritual-l1'
	case: EvalCase
	verdict: ParsedVerdict | null
	scorerResults: ScorerResult[]
}

// --- Core functions ---

// Build a Trace as if the case had been resolved on-chain. Emits the same span hierarchy the
// chain-event assembler would produce, then layers the eval-harness scorer outcomes as
// additional `event` spans so the trace tells the full story of one case.
export async function synthesizeTrace(input: SyntheticTraceInput): Promise<Trace> {
	const events = synthesizeEvents(input)
	const source: TraceSource = { kind: 'live', runId: input.runId, provider: input.provider }
	const trace = await assembleTrace(events, {
		source,
		marketContext: {
			question: input.case.question,
			frameworkId: input.case.id
		}
	})

	// Namespace the trace + its spans by caseId so multiple cases in one run don't collide on
	// the synthetic marketId (=1n for every case).
	const oldTraceId = trace.id
	const namespacedId = `${oldTraceId}-${input.case.id}`
	trace.id = namespacedId
	trace.name = input.case.id
	for (const span of trace.spans) {
		if (span.id.startsWith(oldTraceId)) {
			span.id = span.id.replace(oldTraceId, namespacedId)
		}
	}

	// Layer the eval scorers as child observations so the trace also documents the eval pass.
	const scorerSpans = scorerSpansFor(trace.id, input.scorerResults, input.case.id)
	trace.spans.push(...scorerSpans)
	trace.metadata = {
		...trace.metadata,
		caseId: input.case.id,
		caseKind: input.case.kind,
		scorerPassCount: input.scorerResults.filter((s) => s.outcome === 'pass').length,
		scorerFailCount: input.scorerResults.filter((s) => s.outcome === 'fail').length,
		scorerSkippedCount: input.scorerResults.filter((s) => s.outcome === 'skipped').length
	}

	if (input.verdict) {
		trace.output = {
			...(trace.output as Record<string, unknown>),
			verdict: input.verdict
		}
	}

	return trace
}

// --- Helper functions ---

// Build a ChainEvent[] that walks the canonical lifecycle. Synthetic block numbers go
// 100, 101, ... 109; block times step by 12 seconds (one Ritual block ≈ 350ms but the
// observable lifecycle is paced by the agent + LLM call which take longer).
function synthesizeEvents(input: SyntheticTraceInput): ChainEvent[] {
	const baseBlock = 100n
	const baseTime = new Date('2026-06-05T18:00:00.000Z').getTime()
	const stepMs = 12_000
	const txHash = `0x${input.runId.padStart(64, '0').slice(0, 64)}` as `0x${string}`
	const jobId = `0x${'a'.repeat(64)}` as `0x${string}`
	const marketId = 1n

	const enforced = input.verdict ? enforceRules(input.verdict, input.case.manifest) : null

	const events: { name: TracedEventName; args: Record<string, unknown>; offset: number }[] = []

	events.push({
		name: 'MarketCreated',
		args: {
			marketId,
			frameworkId: `0x${'0'.repeat(64)}`,
			creator: '0x0000000000000000000000000000000000000000'
		},
		offset: 0
	})
	events.push({
		name: 'InvestigationStarted',
		args: { marketId, jobId, requestBinding: `0x${'1'.repeat(64)}` },
		offset: 1
	})
	events.push({
		name: 'InvestigationDelivered',
		args: { marketId, jobId, dossierCid: `ipfs-${input.case.id}` },
		offset: 9
	})
	events.push({
		name: 'JudgmentStarted',
		args: { marketId, promptHash: `0x${'2'.repeat(64)}` },
		offset: 10
	})
	events.push({
		name: 'JudgmentDelivered',
		args: { marketId, verdictHash: `0x${'3'.repeat(64)}` },
		offset: 11
	})

	if (enforced?.floorFired) {
		events.push({ name: 'HarnessRuleFired', args: { marketId, ruleId: 1 }, offset: 12 })
	}
	if (enforced?.tierCapFired) {
		events.push({ name: 'HarnessRuleFired', args: { marketId, ruleId: 2 }, offset: 12 })
	}

	if (enforced) {
		events.push({
			name: 'VerdictFinalized',
			args: { marketId, outcome: enforced.outcome, confidenceBps: enforced.confidenceBps },
			offset: 13
		})
	}

	return events.map((e) => ({
		name: e.name,
		args: e.args,
		blockNumber: baseBlock + BigInt(e.offset),
		blockTime: new Date(baseTime + e.offset * stepMs),
		transactionHash: txHash
	}))
}

function scorerSpansFor(traceId: string, results: ScorerResult[], caseId: string): TraceSpan[] {
	const baseTime = new Date('2026-06-05T18:01:00.000Z').toISOString()
	return results
		.filter((r) => r.caseId === caseId)
		.map((r, i) => ({
			id: `${traceId}-scorer-${i}`,
			name: r.scorer,
			type: 'event' as const,
			startTime: baseTime,
			endTime: baseTime,
			output: {
				outcome: r.outcome,
				detail: r.detail,
				measured: r.measured
			}
		}))
}

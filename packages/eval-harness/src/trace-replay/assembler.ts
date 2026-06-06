import type { ChainEvent } from './fromChain'
import type { Trace, TraceSource, TraceSpan } from './types'

// --- Types & state ---

// Optional content resolver — if provided, fetches IPFS content (dossier, audit bundle) to attach
// to spans as input/output. Returns null when the content isn't reachable so the assembler
// degrades gracefully (spans still emit, just without their text content).
export type ContentResolver = (cid: string) => Promise<unknown>

export interface AssembleOptions {
	source: TraceSource
	resolveContent?: ContentResolver
	marketContext?: {
		question?: string
		frameworkId?: string
		creator?: string
	}
}

// --- Core functions ---

// Convert a canonical-ordered ChainEvent[] into a Trace. The trace structure is:
//   trace: market-<id>
//     ├── span: investigation (InvestigationStarted → InvestigationDelivered)
//     ├── generation: judgment (JudgmentStarted → JudgmentDelivered)
//     ├── span: harness-rule-<id> (per HarnessRuleFired)
//     ├── event: malformed-verdict (if MalformedVerdict fired)
//     ├── event: verdict-finalized (terminal)
//     └── event: verdict-disputed (terminal, optional)
export async function assembleTrace(
	events: ChainEvent[],
	options: AssembleOptions
): Promise<Trace> {
	const marketIdEvent = events.find((e) => 'marketId' in e.args && e.args.marketId !== undefined)
	const marketId = marketIdEvent ? String(marketIdEvent.args.marketId) : 'unknown'

	const traceId = traceIdFromSource(options.source, marketId)
	const trace: Trace = {
		id: traceId,
		name: `market-${marketId}`,
		input: {
			question: options.marketContext?.question,
			frameworkId: options.marketContext?.frameworkId
		},
		metadata: traceMetadata(options.source, events),
		spans: []
	}

	const spans: TraceSpan[] = []

	const investigationStart = events.find((e) => e.name === 'InvestigationStarted')
	const investigationEnd = events.find((e) => e.name === 'InvestigationDelivered')
	if (investigationStart && investigationEnd) {
		const dossierCid = String(investigationEnd.args.dossierCid ?? '')
		const dossier =
			options.resolveContent && dossierCid
				? await options.resolveContent(dossierCid).catch(() => null)
				: null
		spans.push({
			id: `${traceId}-investigation`,
			name: 'investigation',
			type: 'span',
			startTime: investigationStart.blockTime.toISOString(),
			endTime: investigationEnd.blockTime.toISOString(),
			input: {
				jobId: String(investigationStart.args.jobId ?? ''),
				requestBinding: String(investigationStart.args.requestBinding ?? '')
			},
			output: {
				dossierCid,
				dossier
			},
			metadata: {
				blockSpan: {
					start: investigationStart.blockNumber.toString(),
					end: investigationEnd.blockNumber.toString()
				}
			}
		})
	}

	const judgmentStart = events.find((e) => e.name === 'JudgmentStarted')
	const judgmentEnd = events.find((e) => e.name === 'JudgmentDelivered')
	if (judgmentStart && judgmentEnd) {
		spans.push({
			id: `${traceId}-judgment`,
			name: 'judgment',
			type: 'generation',
			startTime: judgmentStart.blockTime.toISOString(),
			endTime: judgmentEnd.blockTime.toISOString(),
			input: {
				promptHash: String(judgmentStart.args.promptHash ?? '')
			},
			output: {
				verdictHash: String(judgmentEnd.args.verdictHash ?? '')
			},
			model: 'zai-org/GLM-4.7-FP8',
			modelParameters: {
				temperature: 0,
				topP: 1.0,
				reasoningEffort: 'medium'
			}
		})
	}

	const ruleEvents = events.filter((e) => e.name === 'HarnessRuleFired')
	for (const rule of ruleEvents) {
		const ruleId = Number(rule.args.ruleId ?? 0)
		spans.push({
			id: `${traceId}-rule-${ruleId}`,
			name: `harness-rule-${ruleNameFor(ruleId)}`,
			type: 'event',
			startTime: rule.blockTime.toISOString(),
			endTime: rule.blockTime.toISOString(),
			output: { ruleId },
			metadata: { fired: true }
		})
	}

	const malformed = events.find((e) => e.name === 'MalformedVerdict')
	if (malformed) {
		spans.push({
			id: `${traceId}-malformed`,
			name: 'malformed-verdict',
			type: 'event',
			startTime: malformed.blockTime.toISOString(),
			endTime: malformed.blockTime.toISOString(),
			output: { reason: String(malformed.args.reason ?? '') }
		})
	}

	const finalized = events.find((e) => e.name === 'VerdictFinalized')
	if (finalized) {
		const outcome = Number(finalized.args.outcome ?? 0)
		const confidenceBps = Number(finalized.args.confidenceBps ?? 0)
		spans.push({
			id: `${traceId}-finalize`,
			name: 'verdict-finalized',
			type: 'event',
			startTime: finalized.blockTime.toISOString(),
			endTime: finalized.blockTime.toISOString(),
			output: { outcome, confidenceBps }
		})
		trace.output = { outcome, confidenceBps, finalized: true }
	}

	const disputed = events.find((e) => e.name === 'VerdictDisputed')
	if (disputed) {
		spans.push({
			id: `${traceId}-disputed`,
			name: 'verdict-disputed',
			type: 'event',
			startTime: disputed.blockTime.toISOString(),
			endTime: disputed.blockTime.toISOString(),
			output: {
				disputer: String(disputed.args.disputer ?? ''),
				evidence: String(disputed.args.evidence ?? '')
			}
		})
	}

	trace.spans = spans
	return trace
}

// --- Helper functions ---

function traceIdFromSource(source: TraceSource, marketId: string): string {
	if (source.kind === 'live') {
		return `live-${source.runId}-${marketId}`
	}
	return `chain-${source.chainId}-${source.marketAddress}-${marketId}`
}

function traceMetadata(source: TraceSource, events: ChainEvent[]): Record<string, unknown> {
	const base: Record<string, unknown> = {
		source: source.kind,
		eventCount: events.length
	}
	if (source.kind === 'live') {
		base.provider = source.provider
		base.runId = source.runId
	} else {
		base.chainId = source.chainId
		base.marketAddress = source.marketAddress
		base.marketId = source.marketId.toString()
	}
	return base
}

function ruleNameFor(ruleId: number): string {
	if (ruleId === 1) return 'confidence-floor'
	if (ruleId === 2) return 'tier-3-cap'
	return `unknown-${ruleId}`
}

// --- Types & state ---

// A span (or "observation" in Langfuse terms) — one step inside a market resolution.
export interface TraceSpan {
	id: string
	parentId?: string
	name: string
	type: 'span' | 'generation' | 'event'
	startTime: string
	endTime: string
	input?: unknown
	output?: unknown
	metadata?: Record<string, unknown>
	// generation-only fields
	model?: string
	modelParameters?: Record<string, unknown>
	usage?: { input?: number; output?: number; total?: number }
}

// A trace = one market resolution (or one eval-harness case run).
export interface Trace {
	id: string
	name: string
	userId?: string
	sessionId?: string
	input?: unknown
	output?: unknown
	metadata?: Record<string, unknown>
	spans: TraceSpan[]
}

export type TraceSource =
	| { kind: 'live'; runId: string; provider: 'mock' | 'ritual-l1' }
	| { kind: 'reconstructed'; chainId: number; marketAddress: `0x${string}`; marketId: bigint }

// Sink interface — anything that can take a finished trace and stash it for later viewing.
export interface TraceSink {
	readonly name: 'json' | 'langfuse'
	push(trace: Trace): Promise<void>
	flush(): Promise<void>
}

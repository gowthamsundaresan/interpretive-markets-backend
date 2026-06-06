import type { Trace, TraceSink, TraceSpan } from './types'

// --- Types & state ---

export interface LangfuseSinkConfig {
	publicKey: string
	secretKey: string
	baseUrl?: string
	release?: string
}

interface LangfuseEvent {
	id: string
	type: 'trace-create' | 'span-create' | 'generation-create' | 'event-create'
	timestamp: string
	body: Record<string, unknown>
}

// --- Core functions ---

// Skip-when-no-key. Returns null when LANGFUSE_PUBLIC_KEY/LANGFUSE_SECRET_KEY aren't set so
// `runner.ts` can fall back to the JSON sink without crashing the eval.
export function tryCreateLangfuseSinkFromEnv(): TraceSink | null {
	const publicKey = process.env.LANGFUSE_PUBLIC_KEY
	const secretKey = process.env.LANGFUSE_SECRET_KEY
	if (!publicKey || !secretKey) return null
	return createLangfuseSink({
		publicKey,
		secretKey,
		baseUrl: process.env.LANGFUSE_BASE_URL,
		release: process.env.LANGFUSE_RELEASE
	})
}

export function createLangfuseSink(config: LangfuseSinkConfig): TraceSink {
	const baseUrl = (config.baseUrl ?? 'https://cloud.langfuse.com').replace(/\/$/, '')
	const auth = `Basic ${Buffer.from(`${config.publicKey}:${config.secretKey}`).toString('base64')}`
	const buffer: LangfuseEvent[] = []
	const batchSize = 50

	async function send(events: LangfuseEvent[]): Promise<void> {
		if (events.length === 0) return
		const response = await fetch(`${baseUrl}/api/public/ingestion`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: auth
			},
			body: JSON.stringify({ batch: events })
		})
		if (!response.ok) {
			const text = await response.text()
			throw new Error(`langfuse ingest failed: ${response.status} ${text}`)
		}
	}

	return {
		name: 'langfuse',
		async push(trace: Trace): Promise<void> {
			const events: LangfuseEvent[] = []
			const now = new Date().toISOString()

			events.push({
				id: `${trace.id}-trace`,
				type: 'trace-create',
				timestamp: now,
				body: {
					id: trace.id,
					name: trace.name,
					userId: trace.userId,
					sessionId: trace.sessionId,
					input: trace.input,
					output: trace.output,
					metadata: trace.metadata,
					release: config.release
				}
			})

			for (const span of trace.spans) {
				events.push(spanEvent(trace.id, span, now))
			}

			buffer.push(...events)
			if (buffer.length >= batchSize) {
				const drain = buffer.splice(0, buffer.length)
				await send(drain)
			}
		},
		async flush(): Promise<void> {
			if (buffer.length === 0) return
			const drain = buffer.splice(0, buffer.length)
			await send(drain)
		}
	}
}

// --- Helper functions ---

function spanEvent(traceId: string, span: TraceSpan, eventTimestamp: string): LangfuseEvent {
	const eventType: LangfuseEvent['type'] =
		span.type === 'generation'
			? 'generation-create'
			: span.type === 'event'
				? 'event-create'
				: 'span-create'
	const body: Record<string, unknown> = {
		id: span.id,
		traceId,
		parentObservationId: span.parentId,
		name: span.name,
		startTime: span.startTime,
		endTime: span.endTime,
		input: span.input,
		output: span.output,
		metadata: span.metadata
	}
	if (span.type === 'generation') {
		body.model = span.model
		body.modelParameters = span.modelParameters
		body.usage = span.usage
	}
	return {
		id: `${span.id}-create`,
		type: eventType,
		timestamp: eventTimestamp,
		body
	}
}

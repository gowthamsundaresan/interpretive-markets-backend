// --- Types & state ---

export interface SpanInput {
	[key: string]: unknown
}

interface LangfuseLike {
	trace(args: { id?: string; name: string; input?: unknown }): {
		span(args: { name: string; input?: unknown }): {
			end(args?: { output?: unknown }): void
		}
		update(args: { output?: unknown }): void
	}
	flushAsync(): Promise<void>
}

let cachedClient: LangfuseLike | null | undefined = undefined

// --- Core functions ---

export async function traceSpan<T>(
	name: string,
	input: SpanInput,
	fn: () => Promise<T>
): Promise<T> {
	const client = getClient()
	if (!client) return fn()
	const trace = client.trace({ name: 'council-graph' })
	const span = trace.span({ name, input })
	try {
		const out = await fn()
		span.end({ output: out as unknown })
		return out
	} catch (err) {
		span.end({ output: { error: (err as Error).message } })
		throw err
	}
}

export async function flushTraces(): Promise<void> {
	const client = getClient()
	if (client) await client.flushAsync()
}

// --- Helper functions ---

function getClient(): LangfuseLike | null {
	if (cachedClient !== undefined) return cachedClient
	const pk = process.env.LANGFUSE_PUBLIC_KEY
	const sk = process.env.LANGFUSE_SECRET_KEY
	if (!pk || !sk) {
		cachedClient = null
		return null
	}
	try {
		const { Langfuse } = require('langfuse') as {
			Langfuse: new (opts: {
				publicKey: string
				secretKey: string
				baseUrl?: string
			}) => LangfuseLike
		}
		cachedClient = new Langfuse({
			publicKey: pk,
			secretKey: sk,
			baseUrl: process.env.LANGFUSE_BASE_URL
		})
		return cachedClient
	} catch {
		cachedClient = null
		return null
	}
}

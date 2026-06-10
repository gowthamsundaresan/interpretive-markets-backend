import { extractJson } from '../scorers/judge/llm-judge'
import type { FetchLogEntry, SourceFixture } from './fetch-tool'
import { makeFetchTool } from './fetch-tool'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// --- Types & state ---

const FRAMEWORKS_ROOT = resolve(
	dirname(fileURLToPath(import.meta.url)),
	'..',
	'..',
	'..',
	'..',
	'..',
	'interpretive-markets',
	'frameworks'
)

export type InvestigatorProvider = 'anthropic' | 'openrouter'

export interface JudgeMessage {
	role: string
	content: string
}

export interface InvestigatorRunOptions {
	question: string
	sourceAllowlist: string[]
	fixtures: SourceFixture[]
	frameworkSlug: string
	model?: string
	provider?: InvestigatorProvider
	apiKey?: string
	maxTurns?: number
	maxTokens?: number
}

export interface InvestigatorResult {
	dossier: unknown | null
	messagesJson: JudgeMessage[] | null
	fetchLog: FetchLogEntry[]
	turns: number
	model: string
	rawFinal: string | null
	error?: string
}

interface ToolCall {
	id: string
	url: string
}

interface Transport {
	call(
		system: string,
		messages: unknown[],
		maxTokens: number,
		withTools?: boolean
	): Promise<unknown>
	assistantMessage(resp: unknown): unknown
	toolCalls(resp: unknown): ToolCall[]
	finalText(resp: unknown): string
	toolResults(results: { id: string; content: string }[]): unknown[]
}

// --- Core functions ---

export async function runInvestigator(opts: InvestigatorRunOptions): Promise<InvestigatorResult> {
	const model = opts.model ?? process.env.LLM_MODEL_INVESTIGATOR ?? 'z-ai/glm-4.7'
	const provider: InvestigatorProvider =
		opts.provider ?? (model.includes('/') ? 'openrouter' : 'anthropic')
	const apiKey =
		opts.apiKey ??
		(provider === 'openrouter' ? process.env.OPENROUTER_API_KEY : process.env.ANTHROPIC_API_KEY)

	const fetchLog: FetchLogEntry[] = []
	if (!apiKey) {
		return {
			dossier: null,
			messagesJson: null,
			fetchLog,
			turns: 0,
			model,
			rawFinal: null,
			error: `no API key for provider ${provider}`
		}
	}

	const maxTurns = opts.maxTurns ?? 9
	const maxFetches = 7
	const maxTokens = opts.maxTokens ?? 6000

	const investigatorMd = readFrameworkFile(opts.frameworkSlug, 'investigator.md')
	const judgeMd = readFrameworkFile(opts.frameworkSlug, 'judge.md')
	const system = investigatorMd + evalModeAddendum()

	const fetchTool = makeFetchTool(opts.sourceAllowlist, opts.fixtures, fetchLog)
	const transport: Transport =
		provider === 'openrouter'
			? openRouterTransport(apiKey, model)
			: anthropicTransport(apiKey, model)

	const messages: unknown[] = [
		{ role: 'user', content: buildKickoff(opts.question, opts.sourceAllowlist) }
	]

	let turns = 0
	let totalFetches = 0
	let rawFinal: string | null = null
	while (turns < maxTurns) {
		turns += 1
		const allowTools = totalFetches < maxFetches
		let resp: unknown
		try {
			resp = await transport.call(system, messages, maxTokens, allowTools)
		} catch (err) {
			return {
				dossier: null,
				messagesJson: null,
				fetchLog,
				turns,
				model,
				rawFinal,
				error: (err as Error).message
			}
		}
		messages.push(transport.assistantMessage(resp))
		const calls = allowTools ? transport.toolCalls(resp) : []
		if (calls.length === 0) {
			rawFinal = transport.finalText(resp)
			break
		}
		totalFetches += calls.length
		const results = calls.map((c) => ({ id: c.id, content: fetchTool(c.url).body }))
		for (const m of transport.toolResults(results)) messages.push(m)
	}

	let parsed = parseDossier(rawFinal)
	if (!parsed.dossier) {
		messages.push({
			role: 'user',
			content:
				'Stop fetching. Based on the evidence you have gathered, emit ONLY the final JSON now: { "dossier": { ... } }. No tools, no prose, start with "{".'
		})
		try {
			const resp = await transport.call(system, messages, maxTokens, false)
			const retried = transport.finalText(resp)
			if (retried) {
				rawFinal = retried
				parsed = parseDossier(rawFinal)
			}
		} catch {
			/* keep the original parse result */
		}
	}
	const messagesJson = parsed.dossier
		? buildJudgeMessages(judgeMd, opts.question, parsed.dossier)
		: null
	return {
		dossier: parsed.dossier,
		messagesJson,
		fetchLog,
		turns,
		model,
		rawFinal,
		error: parsed.error
	}
}

// --- Helper functions ---

const FETCH_TOOL_DESC =
	'Fetch an allowlisted URL and return its response body. Refuses URLs outside the allowlist.'

function anthropicTransport(apiKey: string, model: string): Transport {
	const tools = [
		{
			name: 'fetch_http',
			description: FETCH_TOOL_DESC,
			input_schema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] }
		}
	]
	return {
		async call(system, messages, maxTokens, withTools = true) {
			const body: Record<string, unknown> = {
				model,
				max_tokens: maxTokens,
				temperature: 0,
				system,
				messages
			}
			if (withTools) body.tools = tools
			const r = await fetch('https://api.anthropic.com/v1/messages', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': apiKey,
					'anthropic-version': '2023-06-01'
				},
				body: JSON.stringify(body)
			})
			if (!r.ok) throw new Error(`anthropic ${r.status}: ${(await r.text()).slice(0, 300)}`)
			return r.json()
		},
		assistantMessage(resp) {
			return { role: 'assistant', content: (resp as { content: unknown }).content }
		},
		toolCalls(resp) {
			const blocks =
				(resp as { content: { type: string; id?: string; input?: { url?: string } }[] }).content ??
				[]
			return blocks
				.filter((b) => b.type === 'tool_use')
				.map((b) => ({ id: b.id ?? '', url: typeof b.input?.url === 'string' ? b.input.url : '' }))
		},
		finalText(resp) {
			const blocks = (resp as { content: { type: string; text?: string }[] }).content ?? []
			return blocks
				.filter((b) => b.type === 'text')
				.map((b) => b.text ?? '')
				.join('\n')
		},
		toolResults(results) {
			return [
				{
					role: 'user',
					content: results.map((r) => ({
						type: 'tool_result',
						tool_use_id: r.id,
						content: r.content
					}))
				}
			]
		}
	}
}

function openRouterTransport(apiKey: string, model: string): Transport {
	const tools = [
		{
			type: 'function',
			function: {
				name: 'fetch_http',
				description: FETCH_TOOL_DESC,
				parameters: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] }
			}
		}
	]
	return {
		async call(system, messages, maxTokens, withTools = true) {
			const body: Record<string, unknown> = {
				model,
				temperature: 0,
				max_tokens: maxTokens,
				messages: [{ role: 'system', content: system }, ...messages]
			}
			if (withTools) {
				body.tools = tools
				body.tool_choice = 'auto'
			}
			const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
				body: JSON.stringify(body)
			})
			if (!r.ok) throw new Error(`openrouter ${r.status}: ${(await r.text()).slice(0, 300)}`)
			return r.json()
		},
		assistantMessage(resp) {
			return (
				(resp as { choices: { message: unknown }[] }).choices?.[0]?.message ?? {
					role: 'assistant',
					content: ''
				}
			)
		},
		toolCalls(resp) {
			const msg = (
				resp as {
					choices: { message: { tool_calls?: { id: string; function: { arguments: string } }[] } }[]
				}
			).choices?.[0]?.message
			return (msg?.tool_calls ?? []).map((tc) => {
				let url = ''
				try {
					url = (JSON.parse(tc.function.arguments) as { url?: string }).url ?? ''
				} catch {
					url = ''
				}
				return { id: tc.id, url }
			})
		},
		finalText(resp) {
			const msg = (resp as { choices: { message: { content?: string } }[] }).choices?.[0]?.message
			return msg?.content ?? ''
		},
		toolResults(results) {
			return results.map((r) => ({ role: 'tool', tool_call_id: r.id, content: r.content }))
		}
	}
}

function parseDossier(rawFinal: string | null): { dossier: unknown | null; error?: string } {
	if (!rawFinal)
		return { dossier: null, error: 'agent never emitted a final message (maxTurns hit?)' }
	let parsed: Record<string, unknown>
	try {
		parsed = extractJson(rawFinal) as Record<string, unknown>
	} catch (err) {
		return { dossier: null, error: `final JSON parse failed: ${(err as Error).message}` }
	}
	if (parsed.dossier && typeof parsed.dossier === 'object') return { dossier: parsed.dossier }
	if (parsed.subjects || parsed.claims) return { dossier: parsed }
	return { dossier: null, error: 'final JSON had no dossier' }
}

function buildJudgeMessages(judgeMd: string, question: string, dossier: unknown): JudgeMessage[] {
	return [
		{ role: 'system', content: judgeMd },
		{
			role: 'user',
			content: `Question: ${question}\n\nDossier:\n${JSON.stringify(dossier, null, 2)}`
		}
	]
}

function buildKickoff(question: string, allowlist: string[]): string {
	return [
		`Question: ${question}`,
		'',
		'Source allowlist (you may only fetch URLs starting with these prefixes):',
		...allowlist.map((a) => `  - ${a}`),
		'',
		'Investigate: fetch the sources you need via fetch_http, build the dossier, then emit your final JSON object.'
	].join('\n')
}

function evalModeAddendum(): string {
	return [
		'',
		'',
		'## Eval output mode (overrides "Final output assembly" / "Termination")',
		'',
		'Do NOT pin to IPFS and do NOT return a StorageRef. You have a LIMITED TURN BUDGET — once you',
		'have gathered enough evidence (you do NOT need many fetches), STOP fetching and respond with a',
		'SINGLE JSON object and NOTHING else. Your entire response must START with "{" — no preamble,',
		'no explanation, no markdown fences before or after:',
		'',
		'{ "dossier": { ...the dossier you built, validating against schemas/dossier.json... } }',
		'',
		'The judge runs on exactly the dossier you emit here. Emit the final JSON as soon as you have',
		'sufficient evidence; do not keep fetching, and do not write any prose around the JSON.',
		''
	].join('\n')
}

function readFrameworkFile(slug: string, file: string): string {
	return readFileSync(resolve(FRAMEWORKS_ROOT, slug, file), 'utf-8')
}

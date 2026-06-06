// --- Types & state ---

export type LLMProvider = 'anthropic' | 'openai' | 'gemini' | 'openrouter'

export interface LLMJudgeConfig {
	provider: LLMProvider | null
	apiKey: string | null
	model: string
	enabled: boolean
}

export interface LLMCallResult {
	rawText: string
	model: string
	usage?: { inputTokens: number; outputTokens: number }
}

// --- Core functions ---

// Auto-detect provider + key from env. Provider preference order: ANTHROPIC > OPENAI > GEMINI >
// OPENROUTER. The first one with a key set wins. Returns enabled=false when none are set so the
// runner can skip cleanly.
export function loadLLMJudgeConfig(): LLMJudgeConfig {
	const overrideModel = process.env.LLM_JUDGE_MODEL

	if (process.env.ANTHROPIC_API_KEY) {
		return {
			provider: 'anthropic',
			apiKey: process.env.ANTHROPIC_API_KEY,
			model: overrideModel ?? 'claude-sonnet-4-6',
			enabled: true
		}
	}
	if (process.env.OPENAI_API_KEY) {
		return {
			provider: 'openai',
			apiKey: process.env.OPENAI_API_KEY,
			model: overrideModel ?? 'gpt-4o-mini',
			enabled: true
		}
	}
	if (process.env.GEMINI_API_KEY) {
		return {
			provider: 'gemini',
			apiKey: process.env.GEMINI_API_KEY,
			model: overrideModel ?? 'gemini-2.5-flash',
			enabled: true
		}
	}
	if (process.env.OPENROUTER_API_KEY) {
		return {
			provider: 'openrouter',
			apiKey: process.env.OPENROUTER_API_KEY,
			model: overrideModel ?? 'anthropic/claude-sonnet-4.6',
			enabled: true
		}
	}
	return { provider: null, apiKey: null, model: overrideModel ?? '', enabled: false }
}

// Make a real LLM call. Returns raw text; callers parse JSON from it. Throws on HTTP error.
// Used by both the verdict-production path (judge model under test) AND the LLM-as-judge scorers
// (grounding/reasoning meta-judge).
export async function callLLMJudgeRaw(args: {
	config: LLMJudgeConfig
	systemPrompt: string
	userPrompt: string
	maxTokens?: number
}): Promise<LLMCallResult> {
	const maxTokens = args.maxTokens ?? 2000
	if (!args.config.enabled || !args.config.apiKey) {
		throw new Error('LLM judge not enabled — set ANTHROPIC_API_KEY (or OPENAI/GEMINI/OPENROUTER)')
	}

	if (args.config.provider === 'anthropic') {
		return callAnthropic(args.config, args.systemPrompt, args.userPrompt, maxTokens)
	}
	if (args.config.provider === 'openai') {
		return callOpenAI(args.config, args.systemPrompt, args.userPrompt, maxTokens)
	}
	if (args.config.provider === 'gemini') {
		return callGemini(args.config, args.systemPrompt, args.userPrompt, maxTokens)
	}
	if (args.config.provider === 'openrouter') {
		return callOpenRouter(args.config, args.systemPrompt, args.userPrompt, maxTokens)
	}
	throw new Error(`unknown provider: ${args.config.provider}`)
}

// LLM-as-judge meta-judge call: ask the model to render a binary pass/fail on some claim about
// a verdict (grounding, reasoning). Returns a structured judgment.
export async function callLLMJudge(args: {
	config: LLMJudgeConfig
	instruction: string
	context: string
}): Promise<{ verdict: 'pass' | 'fail' | 'skipped'; reasoning: string }> {
	if (!args.config.enabled) {
		return { verdict: 'skipped', reasoning: 'LLM judge not enabled — no API key set' }
	}
	const systemPrompt =
		'You are a strict meta-evaluator. Output exactly one JSON object with two keys: "verdict" (either "pass" or "fail") and "reasoning" (2-4 sentences explaining why). No prose outside the JSON.'
	const userPrompt = `${args.instruction}\n\nCONTEXT:\n${args.context}\n\nReturn JSON now.`

	try {
		const result = await callLLMJudgeRaw({
			config: args.config,
			systemPrompt,
			userPrompt,
			maxTokens: 500
		})
		const parsed = extractJson(result.rawText) as { verdict?: string; reasoning?: string }
		const verdict =
			parsed.verdict === 'pass' || parsed.verdict === 'fail' ? parsed.verdict : 'skipped'
		return {
			verdict,
			reasoning:
				parsed.reasoning ??
				(verdict === 'skipped'
					? `unparseable LLM-judge response: ${result.rawText.slice(0, 200)}`
					: '')
		}
	} catch (err) {
		return { verdict: 'skipped', reasoning: `LLM-judge call failed: ${(err as Error).message}` }
	}
}

// --- Provider implementations ---

async function callAnthropic(
	config: LLMJudgeConfig,
	system: string,
	user: string,
	maxTokens: number
): Promise<LLMCallResult> {
	const response = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': config.apiKey ?? '',
			'anthropic-version': '2023-06-01'
		},
		body: JSON.stringify({
			model: config.model,
			max_tokens: maxTokens,
			temperature: 0,
			system,
			messages: [{ role: 'user', content: user }]
		})
	})
	if (!response.ok) {
		throw new Error(`anthropic ${response.status}: ${await response.text()}`)
	}
	const body = (await response.json()) as {
		content: { type: string; text: string }[]
		usage?: { input_tokens: number; output_tokens: number }
	}
	const text = body.content
		.filter((b) => b.type === 'text')
		.map((b) => b.text)
		.join('\n')
	return {
		rawText: text,
		model: config.model,
		usage: body.usage
			? { inputTokens: body.usage.input_tokens, outputTokens: body.usage.output_tokens }
			: undefined
	}
}

async function callOpenAI(
	config: LLMJudgeConfig,
	system: string,
	user: string,
	maxTokens: number
): Promise<LLMCallResult> {
	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${config.apiKey ?? ''}`
		},
		body: JSON.stringify({
			model: config.model,
			temperature: 0,
			max_tokens: maxTokens,
			messages: [
				{ role: 'system', content: system },
				{ role: 'user', content: user }
			],
			response_format: { type: 'json_object' }
		})
	})
	if (!response.ok) {
		throw new Error(`openai ${response.status}: ${await response.text()}`)
	}
	const body = (await response.json()) as {
		choices: { message: { content: string } }[]
		usage?: { prompt_tokens: number; completion_tokens: number }
	}
	return {
		rawText: body.choices[0]?.message?.content ?? '',
		model: config.model,
		usage: body.usage
			? { inputTokens: body.usage.prompt_tokens, outputTokens: body.usage.completion_tokens }
			: undefined
	}
}

async function callGemini(
	config: LLMJudgeConfig,
	system: string,
	user: string,
	maxTokens: number
): Promise<LLMCallResult> {
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey ?? ''}`
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			systemInstruction: { parts: [{ text: system }] },
			contents: [{ role: 'user', parts: [{ text: user }] }],
			generationConfig: {
				temperature: 0,
				maxOutputTokens: maxTokens,
				responseMimeType: 'application/json'
			}
		})
	})
	if (!response.ok) {
		throw new Error(`gemini ${response.status}: ${await response.text()}`)
	}
	const body = (await response.json()) as {
		candidates: { content: { parts: { text: string }[] } }[]
		usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number }
	}
	const text = body.candidates[0]?.content?.parts?.map((p) => p.text).join('\n') ?? ''
	return {
		rawText: text,
		model: config.model,
		usage: body.usageMetadata
			? {
					inputTokens: body.usageMetadata.promptTokenCount,
					outputTokens: body.usageMetadata.candidatesTokenCount
				}
			: undefined
	}
}

async function callOpenRouter(
	config: LLMJudgeConfig,
	system: string,
	user: string,
	maxTokens: number
): Promise<LLMCallResult> {
	const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${config.apiKey ?? ''}`
		},
		body: JSON.stringify({
			model: config.model,
			temperature: 0,
			max_tokens: maxTokens,
			messages: [
				{ role: 'system', content: system },
				{ role: 'user', content: user }
			]
		})
	})
	if (!response.ok) {
		throw new Error(`openrouter ${response.status}: ${await response.text()}`)
	}
	const body = (await response.json()) as { choices: { message: { content: string } }[] }
	return { rawText: body.choices[0]?.message?.content ?? '', model: config.model }
}

// --- Helper functions ---

// Extract a JSON object from an LLM response. Tries direct parse first; falls back to extracting
// the first {...} block (handles models that wrap output in markdown fences or commentary).
export function extractJson(text: string): unknown {
	const trimmed = text.trim()
	try {
		return JSON.parse(trimmed)
	} catch {
		// fall through
	}
	const fenced = trimmed.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
	if (fenced) {
		try {
			return JSON.parse(fenced[1])
		} catch {
			// fall through
		}
	}
	const firstBrace = trimmed.indexOf('{')
	const lastBrace = trimmed.lastIndexOf('}')
	if (firstBrace !== -1 && lastBrace > firstBrace) {
		try {
			return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1))
		} catch {
			// fall through
		}
	}
	throw new Error(`no parseable JSON in LLM response: ${text.slice(0, 200)}`)
}

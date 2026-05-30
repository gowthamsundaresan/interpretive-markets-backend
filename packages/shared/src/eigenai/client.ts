import OpenAI from 'openai'

import type { FrameworkModel } from '../types/framework'
import type { VerdictPayload } from '../types/verdict'
import type { AssembledPrompt } from './prompt'

// --- Types ---

export interface EigenAIConfig {
	apiKey: string
	baseURL?: string
}

export interface InferenceResult {
	verdict: VerdictPayload
	rawResponse: string
	responseId: string
}

// --- Core functions ---

const DEFAULT_BASE_URL = 'https://eigenai.eigencloud.xyz/v1'

export function createEigenAIClient(config: EigenAIConfig): OpenAI {
	return new OpenAI({
		apiKey: config.apiKey,
		baseURL: config.baseURL ?? DEFAULT_BASE_URL
	})
}

export async function runJudge(args: {
	client: OpenAI
	model: FrameworkModel
	prompt: AssembledPrompt
}): Promise<InferenceResult> {
	const { client, model, prompt } = args

	const completion = await client.chat.completions.create({
		model: model.id,
		messages: [
			{ role: 'system', content: prompt.system },
			{ role: 'user', content: prompt.user }
		],
		temperature: model.sampling.temperature,
		top_p: model.sampling.topP,
		seed: model.sampling.seed,
		max_tokens: model.sampling.maxTokens,
		response_format: { type: 'json_object' }
	})

	const choice = completion.choices[0]
	if (!choice?.message?.content) {
		throw new Error('eigenai returned no content')
	}

	const verdict = parseVerdict(choice.message.content)
	return {
		verdict,
		rawResponse: choice.message.content,
		responseId: completion.id
	}
}

// --- Helper functions ---

function parseVerdict(raw: string): VerdictPayload {
	let parsed: unknown
	try {
		parsed = JSON.parse(raw)
	} catch {
		throw new Error(`eigenai response is not valid JSON: ${raw.slice(0, 200)}`)
	}

	if (!parsed || typeof parsed !== 'object') {
		throw new Error(`eigenai response is not an object`)
	}
	const v = parsed as Record<string, unknown>
	const outcome = v.outcome
	const confidence = v.confidence
	const reasoning = v.reasoning

	if (outcome !== 0 && outcome !== 1 && outcome !== 2) {
		throw new Error(`invalid outcome in verdict: ${String(outcome)}`)
	}
	if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
		throw new Error(`invalid confidence in verdict: ${String(confidence)}`)
	}
	if (typeof reasoning !== 'string') {
		throw new Error(`invalid reasoning in verdict`)
	}

	const scorecard =
		v.scorecard && typeof v.scorecard === 'object'
			? (v.scorecard as Record<string, Record<string, number>>)
			: undefined

	return { outcome, confidence, reasoning, scorecard }
}

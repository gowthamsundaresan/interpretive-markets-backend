import type { FrameworkModel } from '../types/framework'
import type { InferenceResult } from './client'
import type { AssembledPrompt } from './prompt'
import { parseVerdict } from './verdict'
import OpenAI from 'openai'

// --- Types ---

export interface EigenAIDirectConfig {
	apiKey: string
	baseURL?: string
}

const DEFAULT_BASE_URL = 'https://eigenai-sepolia.eigencloud.xyz/v1'

// --- Core functions ---

export function createEigenAIDirectClient(config: EigenAIDirectConfig): OpenAI {
	// EigenAI authenticates via X-API-Key, not Authorization: Bearer. We pass a
	// placeholder apiKey to satisfy the OpenAI SDK constructor and override the
	// real auth via defaultHeaders.
	return new OpenAI({
		apiKey: 'eigenai',
		baseURL: config.baseURL ?? DEFAULT_BASE_URL,
		defaultHeaders: { 'x-api-key': config.apiKey }
	})
}

export async function runEigenAIDirect(args: {
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

	return {
		verdict: parseVerdict(choice.message.content),
		rawResponse: choice.message.content,
		responseId: completion.id
	}
}

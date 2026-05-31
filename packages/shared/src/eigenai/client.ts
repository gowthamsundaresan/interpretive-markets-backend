import type { FrameworkModel } from '../types/framework'
import type { VerdictPayload } from '../types/verdict'
import {
	type EigenAIDirectConfig,
	createEigenAIDirectClient,
	runEigenAIDirect
} from './eigenaiDirect'
import { runGateway } from './gateway'
import type { AssembledPrompt } from './prompt'
import type OpenAI from 'openai'

// --- Types ---

export type InferencePath = 'gateway' | 'eigenai'

export interface InferenceResult {
	verdict: VerdictPayload
	rawResponse: string
	responseId: string
}

export type InferenceClient = { path: 'gateway' } | { path: 'eigenai'; openai: OpenAI }

export interface InferenceClientConfig {
	path: InferencePath
	eigenai?: EigenAIDirectConfig
}

// Backwards-compat alias for existing call sites.
export type EigenAIConfig = EigenAIDirectConfig

// --- Core functions ---

export function createInferenceClient(config: InferenceClientConfig): InferenceClient {
	if (config.path === 'eigenai') {
		if (!config.eigenai) {
			throw new Error('inference path "eigenai" requires eigenai config')
		}
		return { path: 'eigenai', openai: createEigenAIDirectClient(config.eigenai) }
	}
	return { path: 'gateway' }
}

export async function runJudge(args: {
	client: InferenceClient
	model: FrameworkModel
	prompt: AssembledPrompt
}): Promise<InferenceResult> {
	if (args.client.path === 'gateway') {
		return runGateway({ model: args.model, prompt: args.prompt })
	}
	return runEigenAIDirect({
		client: args.client.openai,
		model: args.model,
		prompt: args.prompt
	})
}

// Backwards-compat: keep the old factory name so existing call sites keep working.
export function createEigenAIClient(config: EigenAIDirectConfig): OpenAI {
	return createEigenAIDirectClient(config)
}

import type { FrameworkModel } from '../types/framework'
import type { InferenceResult } from './client'
import type { AssembledPrompt } from './prompt'
import { parseVerdict } from './verdict'
import { eigen } from '@layr-labs/ai-gateway-provider'
import { generateText } from 'ai'

// --- Core functions ---

// Auth is implicit — @layr-labs/ai-gateway-provider auto-issues a JWT via TEE
// attestation when KMS_SERVER_URL + KMS_PUBLIC_KEY are injected by EigenCompute.
// Outside the TEE this won't work.
export async function runGateway(args: {
	model: FrameworkModel
	prompt: AssembledPrompt
}): Promise<InferenceResult> {
	const { model, prompt } = args

	const result = await generateText({
		model: eigen(model.id),
		system: prompt.system,
		prompt: prompt.user,
		temperature: model.sampling.temperature,
		topP: model.sampling.topP,
		seed: model.sampling.seed,
		maxOutputTokens: model.sampling.maxTokens
	})

	return {
		verdict: parseVerdict(result.text),
		rawResponse: result.text,
		responseId: result.response.id ?? ''
	}
}

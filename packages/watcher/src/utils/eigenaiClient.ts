import { loadEnv } from './env'
import { eigenai } from '@interpretive/shared'
import type { InferenceClient } from '@interpretive/shared'

// --- Core functions ---

export function getInferenceClient(): InferenceClient {
	const env = loadEnv()
	if (env.INFERENCE_PATH === 'eigenai') {
		if (!env.EIGENAI_API_KEY) {
			throw new Error('INFERENCE_PATH=eigenai requires EIGENAI_API_KEY')
		}
		return eigenai.createInferenceClient({
			path: 'eigenai',
			eigenai: { apiKey: env.EIGENAI_API_KEY, baseURL: env.EIGENAI_BASE_URL }
		})
	}
	return eigenai.createInferenceClient({ path: 'gateway' })
}

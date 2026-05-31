import { loadEnv } from './env'
import { eigenai } from '@interpretive/shared'

// --- Core functions ---

export function getEigenAIClient() {
	const env = loadEnv()
	return eigenai.createEigenAIClient({
		apiKey: env.EIGENAI_API_KEY,
		baseURL: env.EIGENAI_BASE_URL
	})
}

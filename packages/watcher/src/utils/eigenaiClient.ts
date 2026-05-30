import { eigenai } from '@interpretive/shared'

import { loadEnv } from './env'

// --- Core functions ---

export function getEigenAIClient() {
	const env = loadEnv()
	return eigenai.createEigenAIClient({
		apiKey: env.EIGENAI_API_KEY,
		baseURL: env.EIGENAI_BASE_URL
	})
}

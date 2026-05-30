import 'dotenv/config'

import type { SupportedNetwork } from '@interpretive/shared'

// --- Types ---

export interface Env {
	NETWORK: SupportedNetwork
	SEPOLIA_RPC_URL?: string
	MAINNET_RPC_URL?: string
	DEPLOYMENT_FILE: string
	WATCHER_PRIVATE_KEY: `0x${string}`
	EIGENAI_API_KEY: string
	EIGENAI_BASE_URL: string
	CRON_INTERVAL: string
	LOG_LEVEL: string
}

let cached: Env | null = null

// --- Core functions ---

export function loadEnv(): Env {
	if (cached) return cached
	cached = {
		NETWORK: (process.env.NETWORK ?? 'sepolia') as SupportedNetwork,
		SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL,
		MAINNET_RPC_URL: process.env.MAINNET_RPC_URL,
		DEPLOYMENT_FILE: required('DEPLOYMENT_FILE'),
		WATCHER_PRIVATE_KEY: required('WATCHER_PRIVATE_KEY') as `0x${string}`,
		EIGENAI_API_KEY: required('EIGENAI_API_KEY'),
		EIGENAI_BASE_URL: process.env.EIGENAI_BASE_URL ?? 'https://eigenai.eigencloud.xyz/v1',
		CRON_INTERVAL: process.env.CRON_INTERVAL ?? '*/60 * * * * *',
		LOG_LEVEL: process.env.LOG_LEVEL ?? 'info'
	}
	return cached
}

// --- Helper functions ---

function required(key: string): string {
	const v = process.env[key]
	if (!v) throw new Error(`missing required env var: ${key}`)
	return v
}

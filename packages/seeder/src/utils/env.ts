import type { SupportedNetwork } from '@interpretive/shared'
import 'dotenv/config'

// --- Types ---

export interface Env {
	NETWORK: SupportedNetwork
	SEPOLIA_RPC_URL?: string
	MAINNET_RPC_URL?: string
	DEPLOYMENT_FILE: string
	START_BLOCK: bigint
	CRON_INTERVAL: string
	LOG_LEVEL: string
}

// --- Core functions ---

let cached: Env | null = null

export function loadEnv(): Env {
	if (cached) return cached
	const network = (process.env.NETWORK ?? 'sepolia') as SupportedNetwork
	cached = {
		NETWORK: network,
		SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL,
		MAINNET_RPC_URL: process.env.MAINNET_RPC_URL,
		DEPLOYMENT_FILE: required('DEPLOYMENT_FILE'),
		START_BLOCK: BigInt(process.env.START_BLOCK ?? '0'),
		CRON_INTERVAL: process.env.CRON_INTERVAL ?? '*/30 * * * * *',
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

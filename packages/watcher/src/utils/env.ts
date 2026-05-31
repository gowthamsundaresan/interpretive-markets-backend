import type { InferencePath, SupportedNetwork } from '@interpretive/shared'
import 'dotenv/config'

// --- Types ---

export interface Env {
	NETWORK: SupportedNetwork
	SEPOLIA_RPC_URL?: string
	MAINNET_RPC_URL?: string
	DEPLOYMENT_FILE: string
	WATCHER_PRIVATE_KEY: `0x${string}`
	INFERENCE_PATH: InferencePath
	EIGENAI_API_KEY?: string
	EIGENAI_BASE_URL: string
}

let cached: Env | null = null

// --- Core functions ---

export function loadEnv(): Env {
	if (cached) return cached
	cached = {
		NETWORK: (process.env.NETWORK ?? 'sepolia') as SupportedNetwork,
		SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL,
		MAINNET_RPC_URL: process.env.MAINNET_RPC_URL,
		// Optional when FRAMEWORK_REGISTRY/JUDGE_REGISTRY/MARKET env vars are set.
		DEPLOYMENT_FILE: process.env.DEPLOYMENT_FILE ?? '',
		WATCHER_PRIVATE_KEY: required('WATCHER_PRIVATE_KEY') as `0x${string}`,
		INFERENCE_PATH: (process.env.INFERENCE_PATH ?? 'gateway') as InferencePath,
		EIGENAI_API_KEY: process.env.EIGENAI_API_KEY,
		EIGENAI_BASE_URL: process.env.EIGENAI_BASE_URL ?? 'https://eigenai-sepolia.eigencloud.xyz/v1'
	}
	return cached
}

// --- Helper functions ---

function required(key: string): string {
	const v = process.env[key]
	if (!v) throw new Error(`missing required env var: ${key}`)
	return v
}

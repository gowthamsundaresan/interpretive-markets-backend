import type { SupportedNetwork } from '@interpretive/shared'
import 'dotenv/config'

// --- Types & state ---

export interface Env {
	NETWORK: SupportedNetwork
	SEPOLIA_RPC_URL?: string
	MAINNET_RPC_URL?: string
	RITUAL_RPC_URL?: string
	DEPLOYMENT_FILE: string
	WATCHER_PRIVATE_KEY: `0x${string}`
}

let cached: Env | null = null

// --- Core functions ---

export function loadEnv(): Env {
	if (cached) return cached
	cached = {
		NETWORK: (process.env.NETWORK ?? 'ritual') as SupportedNetwork,
		SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL,
		MAINNET_RPC_URL: process.env.MAINNET_RPC_URL,
		RITUAL_RPC_URL: process.env.RITUAL_RPC_URL ?? 'https://rpc.ritualfoundation.org',
		DEPLOYMENT_FILE: process.env.DEPLOYMENT_FILE ?? '',
		WATCHER_PRIVATE_KEY: required('WATCHER_PRIVATE_KEY') as `0x${string}`
	}
	return cached
}

// --- Helper functions ---

function required(key: string): string {
	const v = process.env[key]
	if (!v) throw new Error(`missing required env var: ${key}`)
	return v
}

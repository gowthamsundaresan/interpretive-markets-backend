import { loadEnv } from './env'
import { viem } from '@interpretive/shared'
import type { PublicClient } from 'viem'

let cached: PublicClient | null = null

// --- Core functions ---

export function getPublicClient(): PublicClient {
	if (cached) return cached
	const env = loadEnv()
	const rpcUrl = env.NETWORK === 'mainnet' ? env.MAINNET_RPC_URL : env.SEPOLIA_RPC_URL
	if (!rpcUrl) throw new Error(`missing rpc url for ${env.NETWORK}`)
	cached = viem.publicOnly(env.NETWORK, rpcUrl)
	return cached
}

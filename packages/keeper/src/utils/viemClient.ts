import { loadEnv } from './env'
import { viem } from '@interpretive/shared'
import type { ChainClients } from '@interpretive/shared'

let cached: ChainClients | null = null

// --- Core functions ---

export function getClients(): ChainClients {
	if (cached) return cached
	const env = loadEnv()
	const rpcUrl = env.NETWORK === 'mainnet' ? env.MAINNET_RPC_URL : env.SEPOLIA_RPC_URL
	if (!rpcUrl) throw new Error(`missing rpc url for ${env.NETWORK}`)
	cached = viem.fromPrivateKey(env.NETWORK, rpcUrl, env.WATCHER_PRIVATE_KEY)
	return cached
}

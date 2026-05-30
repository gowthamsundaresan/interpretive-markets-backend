import { getPublicClient } from '../utils/viemClient'

// --- Core functions ---

export async function getChainHead(): Promise<bigint> {
	const client = getPublicClient()
	return client.getBlockNumber()
}

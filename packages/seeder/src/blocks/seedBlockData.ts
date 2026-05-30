import { loadEnv } from '../utils/env'
import { prisma } from '../utils/prismaClient'
import {
	bulkUpdateDbTransactions,
	fetchLastSyncBlock,
	loopThroughBlocks,
	saveLastSyncBlockTransaction,
	type DbTransaction
} from '../utils/seeder'
import { getPublicClient } from '../utils/viemClient'

const SYNC_KEY = 'lastSyncedBlock_block_data'
const BLOCK_BATCH = 50n // small batches keep RPC calls bounded per chunk

// --- Core functions ---

export async function seedBlockData(toBlock?: bigint, fromBlock?: bigint): Promise<void> {
	const env = loadEnv()
	const publicClient = getPublicClient()

	const firstBlock = fromBlock ?? (await fetchLastSyncBlock(SYNC_KEY, env.START_BLOCK))
	const lastBlock = toBlock ?? (await publicClient.getBlockNumber())

	if (lastBlock <= firstBlock) {
		console.log(`[In Sync] [Blocks] from: ${firstBlock} to: ${lastBlock}`)
		return
	}

	await loopThroughBlocks(
		firstBlock,
		lastBlock,
		async (windowFrom, windowTo) => {
			const dbTransactions: DbTransaction[] = []
			const numbers: bigint[] = []
			for (let n = windowFrom + 1n; n <= windowTo; n++) numbers.push(n)

			const blocks = await Promise.all(
				numbers.map((n) =>
					publicClient.getBlock({ blockNumber: n }).then((b) => ({
						number: n,
						timestamp: new Date(Number(b.timestamp) * 1000)
					}))
				)
			)

			dbTransactions.push(
				prisma.evm_BlockData.createMany({
					data: blocks,
					skipDuplicates: true
				})
			)

			dbTransactions.push(saveLastSyncBlockTransaction(SYNC_KEY, windowTo))

			await bulkUpdateDbTransactions(
				dbTransactions,
				`[Blocks] ${windowFrom}-${windowTo} size: ${blocks.length}`
			)
		},
		BLOCK_BATCH
	)
}

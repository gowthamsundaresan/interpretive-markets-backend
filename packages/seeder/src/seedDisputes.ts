import { loadEnv } from './utils/env'
import { prisma } from './utils/prismaClient'
import {
	bulkUpdateDbTransactions,
	fetchLastSyncBlock,
	loopThroughBlocks,
	saveLastSyncBlock,
	type DbTransaction
} from './utils/seeder'

const SYNC_KEY = 'lastSyncedBlock_data_disputes'
const LOGS_SYNC_KEY = 'lastSyncedBlock_logs_verdict_disputed'

// --- Core functions ---

// Reads EventLogs_VerdictDisputed → flips Verdict.disputed
export async function seedDisputes(toBlock?: bigint, fromBlock?: bigint): Promise<void> {
	const env = loadEnv()

	const firstBlock = fromBlock ?? (await fetchLastSyncBlock(SYNC_KEY, env.START_BLOCK))
	const lastBlock = toBlock ?? (await fetchLastSyncBlock(LOGS_SYNC_KEY, env.START_BLOCK))

	if (lastBlock <= firstBlock) {
		console.log(`[In Sync] [Data] Disputes from: ${firstBlock} to: ${lastBlock}`)
		return
	}

	await loopThroughBlocks(firstBlock, lastBlock, async (windowFrom, windowTo) => {
		const logs = await prisma.eventLogs_VerdictDisputed.findMany({
			where: { blockNumber: { gt: windowFrom, lte: windowTo } }
		})

		const dbTransactions: DbTransaction[] = []

		for (const log of logs) {
			dbTransactions.push(
				prisma.verdict.update({
					where: { marketId: BigInt(log.marketId) },
					data: {
						disputed: true,
						disputedAt: log.blockTime,
						disputedAtBlock: log.blockNumber
					}
				})
			)
		}

		await bulkUpdateDbTransactions(
			dbTransactions,
			`[Data] Disputes from: ${windowFrom} to: ${windowTo} size: ${logs.length}`
		)
	})

	await saveLastSyncBlock(SYNC_KEY, lastBlock)
}

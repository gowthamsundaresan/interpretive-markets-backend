import { loadEnv } from './utils/env'
import { prisma } from './utils/prismaClient'
import {
	type DbTransaction,
	bulkUpdateDbTransactions,
	fetchLastSyncBlock,
	loopThroughBlocks,
	saveLastSyncBlock
} from './utils/seeder'

const SYNC_KEY = 'lastSyncedBlock_data_frameworks'
const LOGS_SYNC_KEY = 'lastSyncedBlock_logs_framework_registered'

// --- Core functions ---

export async function seedFrameworks(toBlock?: bigint, fromBlock?: bigint): Promise<void> {
	const env = loadEnv()

	const firstBlock = fromBlock ?? (await fetchLastSyncBlock(SYNC_KEY, env.START_BLOCK))
	const lastBlock = toBlock ?? (await fetchLastSyncBlock(LOGS_SYNC_KEY, env.START_BLOCK))

	if (lastBlock <= firstBlock) {
		console.log(`[In Sync] [Data] Frameworks from: ${firstBlock} to: ${lastBlock}`)
		return
	}

	await loopThroughBlocks(firstBlock, lastBlock, async (windowFrom, windowTo) => {
		const logs = await prisma.eventLogs_FrameworkRegistered.findMany({
			where: { blockNumber: { gt: windowFrom, lte: windowTo } }
		})

		const dbTransactions: DbTransaction[] = []

		for (const log of logs) {
			dbTransactions.push(
				prisma.framework.upsert({
					where: { id: log.frameworkId },
					create: {
						id: log.frameworkId,
						uri: log.uri,
						author: log.author,
						metadata: Buffer.from(log.metadata.slice(2), 'hex'),
						registeredAt: log.blockTime,
						registeredAtBlock: log.blockNumber
					},
					update: {}
				})
			)
		}

		await bulkUpdateDbTransactions(
			dbTransactions,
			`[Data] Frameworks from: ${windowFrom} to: ${windowTo} size: ${logs.length}`
		)
	})

	await saveLastSyncBlock(SYNC_KEY, lastBlock)
}

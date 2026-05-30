import { loadEnv } from './utils/env'
import { prisma } from './utils/prismaClient'
import {
	bulkUpdateDbTransactions,
	fetchLastSyncBlock,
	loopThroughBlocks,
	saveLastSyncBlock,
	type DbTransaction
} from './utils/seeder'

const SYNC_KEY = 'lastSyncedBlock_data_judges'
const REGISTERED_LOGS_KEY = 'lastSyncedBlock_logs_judge_registered'
const ENABLED_LOGS_KEY = 'lastSyncedBlock_logs_judge_enabled_set'

// --- Core functions ---

// Reads EventLogs_JudgeRegistered + EventLogs_JudgeEnabledSet → Judge table
export async function seedJudges(toBlock?: bigint, fromBlock?: bigint): Promise<void> {
	const env = loadEnv()

	const firstBlock = fromBlock ?? (await fetchLastSyncBlock(SYNC_KEY, env.START_BLOCK))
	const registeredCursor = await fetchLastSyncBlock(REGISTERED_LOGS_KEY, env.START_BLOCK)
	const enabledCursor = await fetchLastSyncBlock(ENABLED_LOGS_KEY, env.START_BLOCK)
	const lastBlock = toBlock ?? min(registeredCursor, enabledCursor)

	if (lastBlock <= firstBlock) {
		console.log(`[In Sync] [Data] Judges from: ${firstBlock} to: ${lastBlock}`)
		return
	}

	await loopThroughBlocks(firstBlock, lastBlock, async (windowFrom, windowTo) => {
		const registered = await prisma.eventLogs_JudgeRegistered.findMany({
			where: { blockNumber: { gt: windowFrom, lte: windowTo } }
		})
		const enabledSet = await prisma.eventLogs_JudgeEnabledSet.findMany({
			where: { blockNumber: { gt: windowFrom, lte: windowTo } },
			orderBy: [{ blockNumber: 'asc' }, { transactionIndex: 'asc' }]
		})

		const dbTransactions: DbTransaction[] = []

		for (const log of registered) {
			dbTransactions.push(
				prisma.judge.upsert({
					where: { imageDigest: log.imageDigest },
					create: {
						imageDigest: log.imageDigest,
						signer: log.signer,
						enabled: true,
						registeredAt: log.blockTime,
						registeredAtBlock: log.blockNumber
					},
					update: {}
				})
			)
		}

		for (const log of enabledSet) {
			dbTransactions.push(
				prisma.judge.update({
					where: { imageDigest: log.imageDigest },
					data: { enabled: log.enabled }
				})
			)
		}

		await bulkUpdateDbTransactions(
			dbTransactions,
			`[Data] Judges from: ${windowFrom} to: ${windowTo} size: ${registered.length + enabledSet.length}`
		)
	})

	await saveLastSyncBlock(SYNC_KEY, lastBlock)
}

// --- Helper functions ---

function min(a: bigint, b: bigint): bigint {
	return a < b ? a : b
}

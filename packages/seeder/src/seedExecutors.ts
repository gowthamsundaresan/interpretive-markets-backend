import { loadEnv } from './utils/env'
import { prisma } from './utils/prismaClient'
import {
	type DbTransaction,
	bulkUpdateDbTransactions,
	fetchLastSyncBlock,
	loopThroughBlocks,
	saveLastSyncBlock
} from './utils/seeder'

// --- Types & state ---

const SYNC_KEY = 'lastSyncedBlock_data_executors'
const REGISTERED_LOGS_KEY = 'lastSyncedBlock_logs_executor_registered'
const ENABLED_LOGS_KEY = 'lastSyncedBlock_logs_executor_enabled_set'

// --- Core functions ---

// Synthesizes AttestedExecutor rows from the two event-log archives. Owner-curated allowlist
// (`AttestedExecutorRegistry`); the protocol attestation gate lives in `TEEServiceRegistry`
// (read by the watcher Phase-7 audit, not by the seeder).
export async function seedExecutors(toBlock?: bigint, fromBlock?: bigint): Promise<void> {
	const env = loadEnv()

	const firstBlock = fromBlock ?? (await fetchLastSyncBlock(SYNC_KEY, env.START_BLOCK))
	const registeredCursor = await fetchLastSyncBlock(REGISTERED_LOGS_KEY, env.START_BLOCK)
	const enabledCursor = await fetchLastSyncBlock(ENABLED_LOGS_KEY, env.START_BLOCK)
	const lastBlock = toBlock ?? min(registeredCursor, enabledCursor)

	if (lastBlock <= firstBlock) {
		console.log(`[In Sync] [Data] Executors from: ${firstBlock} to: ${lastBlock}`)
		return
	}

	await loopThroughBlocks(firstBlock, lastBlock, async (windowFrom, windowTo) => {
		const registered = await prisma.eventLogs_ExecutorRegistered.findMany({
			where: { blockNumber: { gt: windowFrom, lte: windowTo } }
		})
		const enabledSet = await prisma.eventLogs_ExecutorEnabledSet.findMany({
			where: { blockNumber: { gt: windowFrom, lte: windowTo } },
			orderBy: [{ blockNumber: 'asc' }, { transactionIndex: 'asc' }]
		})

		const dbTransactions: DbTransaction[] = []

		for (const log of registered) {
			dbTransactions.push(
				prisma.attestedExecutor.upsert({
					where: { executor: log.executor },
					create: {
						executor: log.executor,
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
				prisma.attestedExecutor.update({
					where: { executor: log.executor },
					data: { enabled: log.enabled }
				})
			)
		}

		await bulkUpdateDbTransactions(
			dbTransactions,
			`[Data] Executors from: ${windowFrom} to: ${windowTo} size: ${registered.length + enabledSet.length}`
		)
	})

	await saveLastSyncBlock(SYNC_KEY, lastBlock)
}

// --- Helper functions ---

function min(a: bigint, b: bigint): bigint {
	return a < b ? a : b
}

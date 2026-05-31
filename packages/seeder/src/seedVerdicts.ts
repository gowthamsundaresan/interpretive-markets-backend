import { loadDeployment } from './data/address'
import { loadEnv } from './utils/env'
import { prisma } from './utils/prismaClient'
import {
	type DbTransaction,
	bulkUpdateDbTransactions,
	fetchLastSyncBlock,
	loopThroughBlocks,
	saveLastSyncBlock
} from './utils/seeder'
import { getPublicClient } from './utils/viemClient'
import { marketAbi } from '@interpretive/shared'

const SYNC_KEY = 'lastSyncedBlock_data_verdicts'
const LOGS_SYNC_KEY = 'lastSyncedBlock_logs_verdict_posted'

// --- Core functions ---

export async function seedVerdicts(toBlock?: bigint, fromBlock?: bigint): Promise<void> {
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const publicClient = getPublicClient()

	const firstBlock = fromBlock ?? (await fetchLastSyncBlock(SYNC_KEY, env.START_BLOCK))
	const lastBlock = toBlock ?? (await fetchLastSyncBlock(LOGS_SYNC_KEY, env.START_BLOCK))

	if (lastBlock <= firstBlock) {
		console.log(`[In Sync] [Data] Verdicts from: ${firstBlock} to: ${lastBlock}`)
		return
	}

	await loopThroughBlocks(firstBlock, lastBlock, async (windowFrom, windowTo) => {
		const logs = await prisma.eventLogs_VerdictPosted.findMany({
			where: { blockNumber: { gt: windowFrom, lte: windowTo } }
		})

		const dbTransactions: DbTransaction[] = []

		for (const log of logs) {
			const marketId = BigInt(log.marketId)
			const m = (await publicClient.readContract({
				address: deployment.market,
				abi: marketAbi,
				functionName: 'get',
				args: [marketId]
			})) as {
				verdict: { outcome: number; confidence: bigint; verdictHash: `0x${string}` }
				resolvedAt: bigint
			}

			dbTransactions.push(
				prisma.verdict.upsert({
					where: { marketId },
					create: {
						marketId,
						outcome: m.verdict.outcome,
						confidence: m.verdict.confidence.toString(),
						verdictHash: m.verdict.verdictHash,
						bundleRef: log.bundleRef,
						signer: log.signer,
						postedAt: log.blockTime,
						postedAtBlock: log.blockNumber
					},
					update: {
						outcome: m.verdict.outcome,
						confidence: m.verdict.confidence.toString(),
						verdictHash: m.verdict.verdictHash,
						bundleRef: log.bundleRef,
						signer: log.signer,
						postedAt: log.blockTime,
						postedAtBlock: log.blockNumber
					}
				})
			)
		}

		await bulkUpdateDbTransactions(
			dbTransactions,
			`[Data] Verdicts from: ${windowFrom} to: ${windowTo} size: ${logs.length}`
		)
	})

	await saveLastSyncBlock(SYNC_KEY, lastBlock)
}

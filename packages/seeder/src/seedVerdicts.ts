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

// --- Types & state ---

const SYNC_KEY = 'lastSyncedBlock_data_verdicts'
const LOGS_SYNC_KEY = 'lastSyncedBlock_logs_verdict_finalized'

interface OnChainVerdict {
	outcome: number
	confidenceBps: number
	drivingTier: number
	subjectRef: string
	rationaleHash: `0x${string}`
	verdictHash: `0x${string}`
	dossierCid: string
	executor: `0x${string}`
	attestedAtBlock: bigint
}

interface OnChainMarketForVerdict {
	verdict: OnChainVerdict
	dossierCid: string
}

// --- Core functions ---

// Verdict rows are populated from the VerdictFinalized event-log archive. The headline outcome
// + confidenceBps come from the event; the full Verdict struct (subjectRef, rationaleHash,
// drivingTier, etc.) is read fresh from `Market.get(marketId).verdict`.
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
		const logs = await prisma.eventLogs_VerdictFinalized.findMany({
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
			})) as OnChainMarketForVerdict

			dbTransactions.push(
				prisma.verdict.upsert({
					where: { marketId },
					create: {
						marketId,
						outcome: m.verdict.outcome,
						confidenceBps: m.verdict.confidenceBps,
						drivingTier: m.verdict.drivingTier,
						subjectRef: m.verdict.subjectRef,
						rationaleHash: m.verdict.rationaleHash,
						verdictHash: m.verdict.verdictHash,
						dossierCid: m.dossierCid,
						finalizedAt: log.blockTime,
						finalizedAtBlock: log.blockNumber
					},
					update: {
						outcome: m.verdict.outcome,
						confidenceBps: m.verdict.confidenceBps,
						drivingTier: m.verdict.drivingTier,
						subjectRef: m.verdict.subjectRef,
						rationaleHash: m.verdict.rationaleHash,
						verdictHash: m.verdict.verdictHash,
						dossierCid: m.dossierCid,
						finalizedAt: log.blockTime,
						finalizedAtBlock: log.blockNumber
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

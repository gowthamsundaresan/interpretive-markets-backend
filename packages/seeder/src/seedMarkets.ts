import { marketAbi } from '@interpretive/shared'

import { loadDeployment } from './data/address'
import { loadEnv } from './utils/env'
import { prisma } from './utils/prismaClient'
import {
	bulkUpdateDbTransactions,
	fetchLastSyncBlock,
	loopThroughBlocks,
	saveLastSyncBlock,
	type DbTransaction
} from './utils/seeder'
import { getPublicClient } from './utils/viemClient'

const SYNC_KEY = 'lastSyncedBlock_data_markets'
const LOGS_SYNC_KEY = 'lastSyncedBlock_logs_market_created'

// --- Core functions ---

// Reads EventLogs_MarketCreated → Market table (with readContract for full params)
export async function seedMarkets(toBlock?: bigint, fromBlock?: bigint): Promise<void> {
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const publicClient = getPublicClient()

	const firstBlock = fromBlock ?? (await fetchLastSyncBlock(SYNC_KEY, env.START_BLOCK))
	const lastBlock = toBlock ?? (await fetchLastSyncBlock(LOGS_SYNC_KEY, env.START_BLOCK))

	if (lastBlock <= firstBlock) {
		console.log(`[In Sync] [Data] Markets from: ${firstBlock} to: ${lastBlock}`)
		return
	}

	await loopThroughBlocks(firstBlock, lastBlock, async (windowFrom, windowTo) => {
		const logs = await prisma.eventLogs_MarketCreated.findMany({
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
				init: {
					question: string
					frameworkId: `0x${string}`
					dataSourceSpec: `0x${string}`
					modelId: `0x${string}`
					promptTemplateHash: `0x${string}`
					resolutionTime: bigint
					judgeImageDigest: `0x${string}`
				}
				creator: `0x${string}`
				createdAt: bigint
			}

			dbTransactions.push(
				prisma.market.upsert({
					where: { id: marketId },
					create: {
						id: marketId,
						question: m.init.question,
						frameworkId: m.init.frameworkId,
						judgeDigest: m.init.judgeImageDigest,
						modelId: m.init.modelId,
						promptTemplateHash: m.init.promptTemplateHash,
						dataSourceSpec: Buffer.from(m.init.dataSourceSpec.slice(2), 'hex'),
						resolutionTime: new Date(Number(m.init.resolutionTime) * 1000),
						creator: m.creator,
						createdAt: log.blockTime,
						createdAtBlock: log.blockNumber
					},
					update: {}
				})
			)
		}

		await bulkUpdateDbTransactions(
			dbTransactions,
			`[Data] Markets from: ${windowFrom} to: ${windowTo} size: ${logs.length}`
		)
	})

	await saveLastSyncBlock(SYNC_KEY, lastBlock)
}

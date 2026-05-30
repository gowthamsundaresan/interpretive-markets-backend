import { marketAbi } from '@interpretive/shared'
import { getAbiItem, type AbiEvent } from 'viem'

import { loadDeployment } from '../data/address'
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

const SYNC_KEY = 'lastSyncedBlock_logs_market_created'

// --- Core functions ---

export async function seedLogsMarketCreated(
	toBlock?: bigint,
	fromBlock?: bigint
): Promise<void> {
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const publicClient = getPublicClient()

	const firstBlock = fromBlock ?? (await fetchLastSyncBlock(SYNC_KEY, env.START_BLOCK))
	const lastBlock = toBlock ?? (await publicClient.getBlockNumber())

	const event = getAbiItem({ abi: marketAbi, name: 'MarketCreated' }) as AbiEvent

	await loopThroughBlocks(firstBlock, lastBlock, async (windowFrom, windowTo) => {
		const logs = await publicClient.getLogs({
			address: deployment.market,
			event,
			fromBlock: windowFrom,
			toBlock: windowTo
		})

		const dbTransactions: DbTransaction[] = []

		for (const log of logs) {
			const args = (
				log as unknown as {
					args: { marketId: bigint }
				}
			).args
			const blockNumber = log.blockNumber ?? 0n

			const m = (await publicClient.readContract({
				address: deployment.market,
				abi: marketAbi,
				functionName: 'get',
				args: [args.marketId]
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
					where: { id: args.marketId },
					create: {
						id: args.marketId,
						question: m.init.question,
						frameworkId: m.init.frameworkId,
						judgeDigest: m.init.judgeImageDigest,
						modelId: m.init.modelId,
						promptTemplateHash: m.init.promptTemplateHash,
						dataSourceSpec: Buffer.from(m.init.dataSourceSpec.slice(2), 'hex'),
						resolutionTime: new Date(Number(m.init.resolutionTime) * 1000),
						creator: m.creator,
						createdAt: new Date(Number(m.createdAt) * 1000),
						createdAtBlock: blockNumber
					},
					update: { createdAtBlock: blockNumber }
				})
			)
		}

		dbTransactions.push(saveLastSyncBlockTransaction(SYNC_KEY, windowTo))

		await bulkUpdateDbTransactions(
			dbTransactions,
			`[Logs] MarketCreated ${windowFrom}-${windowTo} size: ${logs.length}`
		)
	})
}

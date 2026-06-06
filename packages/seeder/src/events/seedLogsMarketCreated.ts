import { loadDeployment } from '../data/address'
import { loadEnv } from '../utils/env'
import { prisma } from '../utils/prismaClient'
import {
	type DbTransaction,
	bulkUpdateDbTransactions,
	fetchLastSyncBlock,
	getBlockTimestamps,
	loopThroughBlocks,
	saveLastSyncBlockTransaction
} from '../utils/seeder'
import { getPublicClient } from '../utils/viemClient'
import { marketAbi } from '@interpretive/shared'
import { type AbiEvent, getAbiItem } from 'viem'

const SYNC_KEY = 'lastSyncedBlock_logs_market_created'

// --- Core functions ---

export async function seedLogsMarketCreated(toBlock?: bigint, fromBlock?: bigint): Promise<void> {
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

		const blockData = await getBlockTimestamps(
			publicClient,
			logs.map((l) => l.blockNumber ?? 0n)
		)
		const rows: {
			address: string
			transactionHash: string
			transactionIndex: number
			blockNumber: bigint
			blockHash: string
			blockTime: Date
			marketId: string
			frameworkId: string
			creator: string
		}[] = []

		for (const log of logs) {
			const args = (
				log as unknown as {
					args: { marketId: bigint; frameworkId: `0x${string}`; creator: `0x${string}` }
				}
			).args
			const blockNumber = log.blockNumber ?? 0n
			rows.push({
				address: log.address,
				transactionHash: log.transactionHash ?? '',
				transactionIndex: log.logIndex ?? 0,
				blockNumber,
				blockHash: log.blockHash ?? '',
				blockTime: blockData.get(blockNumber) ?? new Date(0),
				marketId: args.marketId.toString(),
				frameworkId: args.frameworkId,
				creator: args.creator
			})
		}

		const dbTransactions: DbTransaction[] = []
		if (rows.length > 0) {
			dbTransactions.push(
				prisma.eventLogs_MarketCreated.createMany({ data: rows, skipDuplicates: true })
			)
		}
		dbTransactions.push(saveLastSyncBlockTransaction(SYNC_KEY, windowTo))

		await bulkUpdateDbTransactions(
			dbTransactions,
			`[Logs] MarketCreated ${windowFrom}-${windowTo} size: ${rows.length}`
		)
	})
}

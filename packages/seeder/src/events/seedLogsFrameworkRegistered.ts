import { loadDeployment } from '../data/address'
import { loadEnv } from '../utils/env'
import { prisma } from '../utils/prismaClient'
import {
	type DbTransaction,
	bulkUpdateDbTransactions,
	fetchLastSyncBlock,
	getBlockDataFromDb,
	loopThroughBlocks,
	saveLastSyncBlockTransaction
} from '../utils/seeder'
import { getPublicClient } from '../utils/viemClient'
import { frameworkRegistryAbi } from '@interpretive/shared'
import { type AbiEvent, getAbiItem } from 'viem'

const SYNC_KEY = 'lastSyncedBlock_logs_framework_registered'

// --- Core functions ---

export async function seedLogsFrameworkRegistered(
	toBlock?: bigint,
	fromBlock?: bigint
): Promise<void> {
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const publicClient = getPublicClient()

	const firstBlock = fromBlock ?? (await fetchLastSyncBlock(SYNC_KEY, env.START_BLOCK))
	const lastBlock = toBlock ?? (await publicClient.getBlockNumber())

	const event = getAbiItem({
		abi: frameworkRegistryAbi,
		name: 'FrameworkRegistered'
	}) as AbiEvent

	await loopThroughBlocks(firstBlock, lastBlock, async (windowFrom, windowTo) => {
		const logs = await publicClient.getLogs({
			address: deployment.frameworkRegistry,
			event,
			fromBlock: windowFrom,
			toBlock: windowTo
		})

		const blockData = await getBlockDataFromDb(windowFrom, windowTo)
		const rows: {
			address: string
			transactionHash: string
			transactionIndex: number
			blockNumber: bigint
			blockHash: string
			blockTime: Date
			frameworkId: string
			uri: string
			author: string
			metadata: string
		}[] = []

		for (const log of logs) {
			const args = (
				log as unknown as {
					args: {
						id: `0x${string}`
						uri: string
						author: `0x${string}`
						metadata: `0x${string}`
					}
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
				frameworkId: args.id,
				uri: args.uri,
				author: args.author,
				metadata: args.metadata
			})
		}

		const dbTransactions: DbTransaction[] = []
		if (rows.length > 0) {
			dbTransactions.push(
				prisma.eventLogs_FrameworkRegistered.createMany({
					data: rows,
					skipDuplicates: true
				})
			)
		}
		dbTransactions.push(saveLastSyncBlockTransaction(SYNC_KEY, windowTo))

		await bulkUpdateDbTransactions(
			dbTransactions,
			`[Logs] FrameworkRegistered ${windowFrom}-${windowTo} size: ${rows.length}`
		)
	})
}

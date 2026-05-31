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
import { judgeRegistryAbi } from '@interpretive/shared'
import { type AbiEvent, getAbiItem } from 'viem'

const SYNC_KEY = 'lastSyncedBlock_logs_judge_enabled_set'

// --- Core functions ---

export async function seedLogsJudgeEnabledSet(toBlock?: bigint, fromBlock?: bigint): Promise<void> {
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const publicClient = getPublicClient()

	const firstBlock = fromBlock ?? (await fetchLastSyncBlock(SYNC_KEY, env.START_BLOCK))
	const lastBlock = toBlock ?? (await publicClient.getBlockNumber())

	const event = getAbiItem({ abi: judgeRegistryAbi, name: 'JudgeEnabledSet' }) as AbiEvent

	await loopThroughBlocks(firstBlock, lastBlock, async (windowFrom, windowTo) => {
		const logs = await publicClient.getLogs({
			address: deployment.judgeRegistry,
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
			imageDigest: string
			enabled: boolean
		}[] = []

		for (const log of logs) {
			const args = (log as unknown as { args: { imageDigest: `0x${string}`; enabled: boolean } })
				.args
			const blockNumber = log.blockNumber ?? 0n
			rows.push({
				address: log.address,
				transactionHash: log.transactionHash ?? '',
				transactionIndex: log.logIndex ?? 0,
				blockNumber,
				blockHash: log.blockHash ?? '',
				blockTime: blockData.get(blockNumber) ?? new Date(0),
				imageDigest: args.imageDigest,
				enabled: args.enabled
			})
		}

		const dbTransactions: DbTransaction[] = []
		if (rows.length > 0) {
			dbTransactions.push(
				prisma.eventLogs_JudgeEnabledSet.createMany({
					data: rows,
					skipDuplicates: true
				})
			)
		}
		dbTransactions.push(saveLastSyncBlockTransaction(SYNC_KEY, windowTo))

		await bulkUpdateDbTransactions(
			dbTransactions,
			`[Logs] JudgeEnabledSet ${windowFrom}-${windowTo} size: ${rows.length}`
		)
	})
}

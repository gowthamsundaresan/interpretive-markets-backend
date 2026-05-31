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
import { type AbiEvent, getAbiItem, toHex } from 'viem'

const SYNC_KEY = 'lastSyncedBlock_logs_verdict_disputed'

// --- Core functions ---

export async function seedLogsVerdictDisputed(toBlock?: bigint, fromBlock?: bigint): Promise<void> {
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const publicClient = getPublicClient()

	const firstBlock = fromBlock ?? (await fetchLastSyncBlock(SYNC_KEY, env.START_BLOCK))
	const lastBlock = toBlock ?? (await publicClient.getBlockNumber())

	const event = getAbiItem({ abi: marketAbi, name: 'VerdictDisputed' }) as AbiEvent

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
			disputer: string
			evidence: string
		}[] = []

		for (const log of logs) {
			const args = (
				log as unknown as {
					args: { marketId: bigint; disputer: `0x${string}`; evidence: `0x${string}` }
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
				disputer: args.disputer,
				evidence: args.evidence
			})
		}

		const dbTransactions: DbTransaction[] = []
		if (rows.length > 0) {
			dbTransactions.push(
				prisma.eventLogs_VerdictDisputed.createMany({
					data: rows,
					skipDuplicates: true
				})
			)
		}
		dbTransactions.push(saveLastSyncBlockTransaction(SYNC_KEY, windowTo))

		await bulkUpdateDbTransactions(
			dbTransactions,
			`[Logs] VerdictDisputed ${windowFrom}-${windowTo} size: ${rows.length}`
		)

		void toHex
	})
}

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
import { marketAbi } from '@interpretive/shared'
import { type AbiEvent, getAbiItem } from 'viem'

const SYNC_KEY = 'lastSyncedBlock_logs_verdict_posted'

// --- Core functions ---

export async function seedLogsVerdictPosted(toBlock?: bigint, fromBlock?: bigint): Promise<void> {
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const publicClient = getPublicClient()

	const firstBlock = fromBlock ?? (await fetchLastSyncBlock(SYNC_KEY, env.START_BLOCK))
	const lastBlock = toBlock ?? (await publicClient.getBlockNumber())

	const event = getAbiItem({ abi: marketAbi, name: 'VerdictPosted' }) as AbiEvent

	await loopThroughBlocks(firstBlock, lastBlock, async (windowFrom, windowTo) => {
		const logs = await publicClient.getLogs({
			address: deployment.market,
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
			marketId: string
			signer: string
			bundleRef: string
		}[] = []

		for (const log of logs) {
			const args = (
				log as unknown as {
					args: { marketId: bigint; signer: `0x${string}`; bundleRef: string }
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
				signer: args.signer,
				bundleRef: args.bundleRef
			})
		}

		const dbTransactions: DbTransaction[] = []
		if (rows.length > 0) {
			dbTransactions.push(
				prisma.eventLogs_VerdictPosted.createMany({
					data: rows,
					skipDuplicates: true
				})
			)
		}
		dbTransactions.push(saveLastSyncBlockTransaction(SYNC_KEY, windowTo))

		await bulkUpdateDbTransactions(
			dbTransactions,
			`[Logs] VerdictPosted ${windowFrom}-${windowTo} size: ${rows.length}`
		)
	})
}

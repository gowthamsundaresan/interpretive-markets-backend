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

const SYNC_KEY = 'lastSyncedBlock_logs_verdict_disputed'

// --- Core functions ---

export async function seedLogsVerdictDisputed(
	toBlock?: bigint,
	fromBlock?: bigint
): Promise<void> {
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

		const dbTransactions: DbTransaction[] = []

		for (const log of logs) {
			const args = (log as unknown as { args: { marketId: bigint } }).args
			const blockNumber = log.blockNumber ?? 0n

			dbTransactions.push(
				prisma.verdict.update({
					where: { marketId: args.marketId },
					data: {
						disputed: true,
						disputedAt: new Date(),
						disputedAtBlock: blockNumber
					}
				})
			)
		}

		dbTransactions.push(saveLastSyncBlockTransaction(SYNC_KEY, windowTo))

		await bulkUpdateDbTransactions(
			dbTransactions,
			`[Logs] VerdictDisputed ${windowFrom}-${windowTo} size: ${logs.length}`
		)
	})
}

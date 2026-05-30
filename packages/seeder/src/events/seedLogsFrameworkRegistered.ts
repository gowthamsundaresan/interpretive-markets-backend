import { frameworkRegistryAbi } from '@interpretive/shared'
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

		const dbTransactions: DbTransaction[] = []

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

			dbTransactions.push(
				prisma.framework.upsert({
					where: { id: args.id },
					create: {
						id: args.id,
						uri: args.uri,
						author: args.author,
						metadata: Buffer.from(args.metadata.slice(2), 'hex'),
						registeredAt: new Date(),
						registeredAtBlock: blockNumber
					},
					update: {
						uri: args.uri,
						author: args.author,
						metadata: Buffer.from(args.metadata.slice(2), 'hex'),
						registeredAtBlock: blockNumber
					}
				})
			)
		}

		dbTransactions.push(saveLastSyncBlockTransaction(SYNC_KEY, windowTo))

		await bulkUpdateDbTransactions(
			dbTransactions,
			`[Logs] FrameworkRegistered ${windowFrom}-${windowTo} size: ${logs.length}`
		)
	})
}

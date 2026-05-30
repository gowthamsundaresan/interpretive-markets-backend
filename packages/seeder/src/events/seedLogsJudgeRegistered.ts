import { judgeRegistryAbi } from '@interpretive/shared'
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

const SYNC_KEY = 'lastSyncedBlock_logs_judge_registered'

// --- Core functions ---

export async function seedLogsJudgeRegistered(
	toBlock?: bigint,
	fromBlock?: bigint
): Promise<void> {
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const publicClient = getPublicClient()

	const firstBlock = fromBlock ?? (await fetchLastSyncBlock(SYNC_KEY, env.START_BLOCK))
	const lastBlock = toBlock ?? (await publicClient.getBlockNumber())

	const event = getAbiItem({ abi: judgeRegistryAbi, name: 'JudgeRegistered' }) as AbiEvent

	await loopThroughBlocks(firstBlock, lastBlock, async (windowFrom, windowTo) => {
		const logs = await publicClient.getLogs({
			address: deployment.judgeRegistry,
			event,
			fromBlock: windowFrom,
			toBlock: windowTo
		})

		const dbTransactions: DbTransaction[] = []

		for (const log of logs) {
			const args = (
				log as unknown as {
					args: { imageDigest: `0x${string}`; signer: `0x${string}` }
				}
			).args
			const blockNumber = log.blockNumber ?? 0n

			dbTransactions.push(
				prisma.judge.upsert({
					where: { imageDigest: args.imageDigest },
					create: {
						imageDigest: args.imageDigest,
						signer: args.signer,
						enabled: true,
						registeredAt: new Date(),
						registeredAtBlock: blockNumber
					},
					update: {
						signer: args.signer,
						registeredAtBlock: blockNumber
					}
				})
			)
		}

		dbTransactions.push(saveLastSyncBlockTransaction(SYNC_KEY, windowTo))

		await bulkUpdateDbTransactions(
			dbTransactions,
			`[Logs] JudgeRegistered ${windowFrom}-${windowTo} size: ${logs.length}`
		)
	})
}

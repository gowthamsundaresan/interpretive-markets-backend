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

const SYNC_KEY = 'lastSyncedBlock_logs_judge_enabled_set'

// --- Core functions ---

export async function seedLogsJudgeEnabledSet(
	toBlock?: bigint,
	fromBlock?: bigint
): Promise<void> {
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

		const dbTransactions: DbTransaction[] = []

		for (const log of logs) {
			const { imageDigest, enabled } = (
				log as unknown as { args: { imageDigest: `0x${string}`; enabled: boolean } }
			).args
			dbTransactions.push(
				prisma.judge.update({
					where: { imageDigest },
					data: { enabled }
				})
			)
		}

		dbTransactions.push(saveLastSyncBlockTransaction(SYNC_KEY, windowTo))

		await bulkUpdateDbTransactions(
			dbTransactions,
			`[Logs] JudgeEnabledSet ${windowFrom}-${windowTo} size: ${logs.length}`
		)
	})
}

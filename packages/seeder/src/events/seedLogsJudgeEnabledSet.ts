import { judgeRegistryAbi } from '@interpretive/shared'
import { getAbiItem, type AbiEvent } from 'viem'

import { loadDeployment } from '../data/address/index.js'
import { loadEnv } from '../utils/env.js'
import { logger } from '../utils/logger.js'
import { prisma } from '../utils/prismaClient.js'
import { getPublicClient } from '../utils/viemClient.js'
import { openCursorWindow, withRetry } from '../utils/seeder.js'

// --- Core functions ---

export async function seedLogsJudgeEnabledSet(chainHead: bigint): Promise<void> {
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const publicClient = getPublicClient()

	const window = await openCursorWindow({
		key: 'JudgeRegistry.JudgeEnabledSet',
		fallbackFromBlock: env.START_BLOCK,
		chainHead
	})
	if (!window) return

	const event = getAbiItem({ abi: judgeRegistryAbi, name: 'JudgeEnabledSet' }) as AbiEvent

	const logs = await withRetry('getLogs JudgeEnabledSet', () =>
		publicClient.getLogs({
			address: deployment.judgeRegistry,
			event,
			fromBlock: window.fromBlock,
			toBlock: window.toBlock
		})
	)

	for (const log of logs) {
		const { imageDigest, enabled } = (
			log as unknown as { args: { imageDigest: `0x${string}`; enabled: boolean } }
		).args
		await prisma.judge.update({
			where: { imageDigest },
			data: { enabled }
		})
		logger.info({ imageDigest, enabled }, 'indexing JudgeEnabledSet')
	}

	await window.advance(window.toBlock)
}

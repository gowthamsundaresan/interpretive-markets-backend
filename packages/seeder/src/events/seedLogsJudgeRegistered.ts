import { judgeRegistryAbi } from '@interpretive/shared'
import { getAbiItem, type AbiEvent } from 'viem'

import { loadDeployment } from '../data/address/index.js'
import { seedJudges } from '../seedJudges.js'
import { loadEnv } from '../utils/env.js'
import { logger } from '../utils/logger.js'
import { getPublicClient } from '../utils/viemClient.js'
import { openCursorWindow, withRetry } from '../utils/seeder.js'

// --- Core functions ---

export async function seedLogsJudgeRegistered(chainHead: bigint): Promise<void> {
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const publicClient = getPublicClient()

	const window = await openCursorWindow({
		key: 'JudgeRegistry.JudgeRegistered',
		fallbackFromBlock: env.START_BLOCK,
		chainHead
	})
	if (!window) return

	const event = getAbiItem({ abi: judgeRegistryAbi, name: 'JudgeRegistered' }) as AbiEvent

	const logs = await withRetry('getLogs JudgeRegistered', () =>
		publicClient.getLogs({
			address: deployment.judgeRegistry,
			event,
			fromBlock: window.fromBlock,
			toBlock: window.toBlock
		})
	)

	const digests = logs
		.map((l) => (l as unknown as { args: { imageDigest: `0x${string}` } }).args.imageDigest)
		.filter((d): d is `0x${string}` => Boolean(d))

	if (digests.length > 0) {
		logger.info({ count: digests.length }, 'indexing JudgeRegistered')
		await seedJudges(digests)
	}

	await window.advance(window.toBlock)
}

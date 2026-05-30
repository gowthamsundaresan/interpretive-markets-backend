import { marketAbi } from '@interpretive/shared'
import { getAbiItem, type AbiEvent } from 'viem'

import { loadDeployment } from '../data/address/index.js'
import { loadEnv } from '../utils/env.js'
import { logger } from '../utils/logger.js'
import { prisma } from '../utils/prismaClient.js'
import { getPublicClient } from '../utils/viemClient.js'
import { openCursorWindow, withRetry } from '../utils/seeder.js'

// --- Core functions ---

export async function seedLogsVerdictDisputed(chainHead: bigint): Promise<void> {
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const publicClient = getPublicClient()

	const window = await openCursorWindow({
		key: 'Market.VerdictDisputed',
		fallbackFromBlock: env.START_BLOCK,
		chainHead
	})
	if (!window) return

	const event = getAbiItem({ abi: marketAbi, name: 'VerdictDisputed' }) as AbiEvent

	const logs = await withRetry('getLogs VerdictDisputed', () =>
		publicClient.getLogs({
			address: deployment.market,
			event,
			fromBlock: window.fromBlock,
			toBlock: window.toBlock
		})
	)

	for (const log of logs) {
		const { marketId } = (log as unknown as { args: { marketId: bigint } }).args
		await prisma.verdict.update({
			where: { marketId },
			data: {
				disputed: true,
				disputedAt: new Date(),
				disputedAtBlock: log.blockNumber ?? 0n
			}
		})
		logger.info({ marketId: marketId.toString() }, 'indexing VerdictDisputed')
	}

	await window.advance(window.toBlock)
}

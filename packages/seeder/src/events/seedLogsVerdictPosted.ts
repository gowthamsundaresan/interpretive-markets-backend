import { marketAbi } from '@interpretive/shared'
import { getAbiItem, type AbiEvent } from 'viem'

import { loadDeployment } from '../data/address/index.js'
import { loadEnv } from '../utils/env.js'
import { logger } from '../utils/logger.js'
import { prisma } from '../utils/prismaClient.js'
import { getPublicClient } from '../utils/viemClient.js'
import { openCursorWindow, withRetry } from '../utils/seeder.js'

// --- Core functions ---

export async function seedLogsVerdictPosted(chainHead: bigint): Promise<void> {
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const publicClient = getPublicClient()

	const window = await openCursorWindow({
		key: 'Market.VerdictPosted',
		fallbackFromBlock: env.START_BLOCK,
		chainHead
	})
	if (!window) return

	const event = getAbiItem({ abi: marketAbi, name: 'VerdictPosted' }) as AbiEvent

	const logs = await withRetry('getLogs VerdictPosted', () =>
		publicClient.getLogs({
			address: deployment.market,
			event,
			fromBlock: window.fromBlock,
			toBlock: window.toBlock
		})
	)

	for (const log of logs) {
		const { marketId, signer, bundleRef } = (
			log as unknown as {
				args: { marketId: bigint; signer: `0x${string}`; bundleRef: string }
			}
		).args
		const blockNumber = log.blockNumber ?? 0n

		const market = (await withRetry(`readMarket ${marketId}`, () =>
			publicClient.readContract({
				address: deployment.market,
				abi: marketAbi,
				functionName: 'get',
				args: [marketId]
			})
		)) as {
			verdict: { outcome: number; confidence: bigint; verdictHash: `0x${string}` }
			resolvedAt: bigint
		}

		await prisma.verdict.upsert({
			where: { marketId },
			create: {
				marketId,
				outcome: market.verdict.outcome,
				confidence: market.verdict.confidence.toString(),
				verdictHash: market.verdict.verdictHash,
				bundleRef,
				signer,
				postedAt: new Date(Number(market.resolvedAt) * 1000),
				postedAtBlock: blockNumber
			},
			update: {
				outcome: market.verdict.outcome,
				confidence: market.verdict.confidence.toString(),
				verdictHash: market.verdict.verdictHash,
				bundleRef,
				signer,
				postedAtBlock: blockNumber
			}
		})

		logger.info({ marketId: marketId.toString(), bundleRef }, 'indexing VerdictPosted')
	}

	await window.advance(window.toBlock)
}

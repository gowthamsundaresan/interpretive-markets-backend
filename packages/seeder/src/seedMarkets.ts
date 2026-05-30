import { marketAbi } from '@interpretive/shared'
import type { PublicClient } from 'viem'

import { loadDeployment } from './data/address/index.js'
import { loadEnv } from './utils/env.js'
import { logger } from './utils/logger.js'
import { prisma } from './utils/prismaClient.js'
import { getPublicClient } from './utils/viemClient.js'
import { withRetry } from './utils/seeder.js'

// --- Core functions ---

export async function seedMarkets(marketIds: bigint[]): Promise<void> {
	if (marketIds.length === 0) return
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const publicClient = getPublicClient()

	for (const id of marketIds) {
		await upsertMarket({ publicClient, market: deployment.market, id })
	}
}

async function upsertMarket(args: {
	publicClient: PublicClient
	market: `0x${string}`
	id: bigint
}): Promise<void> {
	const record = await withRetry(`readMarket ${args.id}`, () =>
		args.publicClient.readContract({
			address: args.market,
			abi: marketAbi,
			functionName: 'get',
			args: [args.id]
		})
	)

	const m = record as {
		init: {
			question: string
			frameworkId: `0x${string}`
			dataSourceSpec: `0x${string}`
			modelId: `0x${string}`
			promptTemplateHash: `0x${string}`
			resolutionTime: bigint
			judgeImageDigest: `0x${string}`
		}
		creator: `0x${string}`
		createdAt: bigint
		resolvedAt: bigint
		bundleRef: string
		verdict: { outcome: number; confidence: bigint; verdictHash: `0x${string}` }
		disputed: boolean
	}

	await prisma.market.upsert({
		where: { id: args.id },
		create: {
			id: args.id,
			question: m.init.question,
			frameworkId: m.init.frameworkId,
			judgeDigest: m.init.judgeImageDigest,
			modelId: m.init.modelId,
			promptTemplateHash: m.init.promptTemplateHash,
			dataSourceSpec: Buffer.from(m.init.dataSourceSpec.slice(2), 'hex'),
			resolutionTime: new Date(Number(m.init.resolutionTime) * 1000),
			creator: m.creator,
			createdAt: new Date(Number(m.createdAt) * 1000)
		},
		update: { question: m.init.question }
	})

	if (m.resolvedAt > 0n) {
		await prisma.verdict.upsert({
			where: { marketId: args.id },
			create: {
				marketId: args.id,
				outcome: m.verdict.outcome,
				confidence: m.verdict.confidence.toString(),
				verdictHash: m.verdict.verdictHash,
				bundleRef: m.bundleRef,
				signer: '0x0000000000000000000000000000000000000000', // backfilled by event seeder
				postedAt: new Date(Number(m.resolvedAt) * 1000),
				disputed: m.disputed
			},
			update: { disputed: m.disputed }
		})
	}

	logger.info({ marketId: args.id.toString() }, 'seeded market')
}

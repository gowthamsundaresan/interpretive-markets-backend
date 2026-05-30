import { judgeRegistryAbi } from '@interpretive/shared'
import type { PublicClient } from 'viem'

import { loadDeployment } from './data/address/index.js'
import { loadEnv } from './utils/env.js'
import { logger } from './utils/logger.js'
import { prisma } from './utils/prismaClient.js'
import { getPublicClient } from './utils/viemClient.js'
import { withRetry } from './utils/seeder.js'

// --- Core functions ---

export async function seedJudges(imageDigests: `0x${string}`[]): Promise<void> {
	if (imageDigests.length === 0) return
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const publicClient = getPublicClient()

	for (const digest of imageDigests) {
		await upsertJudge({ publicClient, registry: deployment.judgeRegistry, digest })
	}
}

async function upsertJudge(args: {
	publicClient: PublicClient
	registry: `0x${string}`
	digest: `0x${string}`
}): Promise<void> {
	const record = await withRetry(`readJudge ${args.digest}`, () =>
		args.publicClient.readContract({
			address: args.registry,
			abi: judgeRegistryAbi,
			functionName: 'get',
			args: [args.digest]
		})
	)
	const j = record as { signer: `0x${string}`; enabled: boolean; registeredAt: bigint }

	await prisma.judge.upsert({
		where: { imageDigest: args.digest },
		create: {
			imageDigest: args.digest,
			signer: j.signer,
			enabled: j.enabled,
			registeredAt: new Date(Number(j.registeredAt) * 1000)
		},
		update: { signer: j.signer, enabled: j.enabled }
	})

	logger.info({ imageDigest: args.digest }, 'seeded judge')
}

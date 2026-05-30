import { frameworkRegistryAbi } from '@interpretive/shared'
import type { PublicClient } from 'viem'

import { loadDeployment } from './data/address/index.js'
import { loadEnv } from './utils/env.js'
import { logger } from './utils/logger.js'
import { prisma } from './utils/prismaClient.js'
import { getPublicClient } from './utils/viemClient.js'
import { withRetry } from './utils/seeder.js'

// --- Core functions ---

export async function seedFrameworks(ids: `0x${string}`[]): Promise<void> {
	if (ids.length === 0) return
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const publicClient = getPublicClient()

	for (const id of ids) {
		await upsertFramework({ publicClient, registry: deployment.frameworkRegistry, id })
	}
}

async function upsertFramework(args: {
	publicClient: PublicClient
	registry: `0x${string}`
	id: `0x${string}`
}): Promise<void> {
	const record = await withRetry(`readFramework ${args.id}`, () =>
		args.publicClient.readContract({
			address: args.registry,
			abi: frameworkRegistryAbi,
			functionName: 'get',
			args: [args.id]
		})
	)
	const f = record as { uri: string; metadata: `0x${string}`; author: `0x${string}`; registeredAt: bigint }

	await prisma.framework.upsert({
		where: { id: args.id },
		create: {
			id: args.id,
			uri: f.uri,
			author: f.author,
			metadata: Buffer.from(f.metadata.slice(2), 'hex'),
			registeredAt: new Date(Number(f.registeredAt) * 1000)
		},
		update: {
			uri: f.uri,
			author: f.author,
			metadata: Buffer.from(f.metadata.slice(2), 'hex')
		}
	})

	logger.info({ frameworkId: args.id }, 'seeded framework')
}

import { frameworkRegistryAbi } from '@interpretive/shared'
import { getAbiItem, type AbiEvent } from 'viem'

import { loadDeployment } from '../data/address/index.js'
import { seedFrameworks } from '../seedFrameworks.js'
import { loadEnv } from '../utils/env.js'
import { logger } from '../utils/logger.js'
import { getPublicClient } from '../utils/viemClient.js'
import { openCursorWindow, withRetry } from '../utils/seeder.js'

// --- Core functions ---

export async function seedLogsFrameworkRegistered(chainHead: bigint): Promise<void> {
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const publicClient = getPublicClient()

	const window = await openCursorWindow({
		key: 'FrameworkRegistry.FrameworkRegistered',
		fallbackFromBlock: env.START_BLOCK,
		chainHead
	})
	if (!window) return

	const event = getAbiItem({
		abi: frameworkRegistryAbi,
		name: 'FrameworkRegistered'
	}) as AbiEvent

	const logs = await withRetry('getLogs FrameworkRegistered', () =>
		publicClient.getLogs({
			address: deployment.frameworkRegistry,
			event,
			fromBlock: window.fromBlock,
			toBlock: window.toBlock
		})
	)

	const ids = logs
		.map((l) => (l as unknown as { args: { id: `0x${string}` } }).args.id)
		.filter((id): id is `0x${string}` => Boolean(id))

	if (ids.length > 0) {
		logger.info({ count: ids.length }, 'indexing FrameworkRegistered')
		await seedFrameworks(ids)
	}

	await window.advance(window.toBlock)
}

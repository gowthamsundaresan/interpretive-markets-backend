import { marketAbi } from '@interpretive/shared'
import { getAbiItem, type AbiEvent } from 'viem'

import { loadDeployment } from '../data/address/index.js'
import { seedMarkets } from '../seedMarkets.js'
import { loadEnv } from '../utils/env.js'
import { logger } from '../utils/logger.js'
import { getPublicClient } from '../utils/viemClient.js'
import { openCursorWindow, withRetry } from '../utils/seeder.js'

// --- Core functions ---

export async function seedLogsMarketCreated(chainHead: bigint): Promise<void> {
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const publicClient = getPublicClient()

	const window = await openCursorWindow({
		key: 'Market.MarketCreated',
		fallbackFromBlock: env.START_BLOCK,
		chainHead
	})
	if (!window) return

	const event = getAbiItem({ abi: marketAbi, name: 'MarketCreated' }) as AbiEvent

	const logs = await withRetry('getLogs MarketCreated', () =>
		publicClient.getLogs({
			address: deployment.market,
			event,
			fromBlock: window.fromBlock,
			toBlock: window.toBlock
		})
	)

	const ids = logs
		.map((l) => (l as unknown as { args: { marketId: bigint } }).args.marketId)
		.filter((id): id is bigint => typeof id === 'bigint')

	if (ids.length > 0) {
		logger.info({ count: ids.length }, 'indexing MarketCreated')
		await seedMarkets(ids)
	}

	await window.advance(window.toBlock)
}

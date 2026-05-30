import cron from 'node-cron'

import { getChainHead } from './blocks/seedBlockData.js'
import { seedLogsFrameworkRegistered } from './events/seedLogsFrameworkRegistered.js'
import { seedLogsJudgeEnabledSet } from './events/seedLogsJudgeEnabledSet.js'
import { seedLogsJudgeRegistered } from './events/seedLogsJudgeRegistered.js'
import { seedLogsMarketCreated } from './events/seedLogsMarketCreated.js'
import { seedLogsVerdictDisputed } from './events/seedLogsVerdictDisputed.js'
import { seedLogsVerdictPosted } from './events/seedLogsVerdictPosted.js'
import { loadEnv } from './utils/env.js'
import { logger } from './utils/logger.js'

// --- Core functions ---

let running = false

async function tick() {
	if (running) {
		logger.warn('previous tick still running, skipping')
		return
	}
	running = true
	const start = Date.now()
	try {
		const head = await getChainHead()
		logger.info({ head: head.toString() }, 'tick begin')

		await seedLogsFrameworkRegistered(head)
		await seedLogsJudgeRegistered(head)
		await seedLogsJudgeEnabledSet(head)
		await seedLogsMarketCreated(head)
		await seedLogsVerdictPosted(head)
		await seedLogsVerdictDisputed(head)

		logger.info({ ms: Date.now() - start }, 'tick done')
	} catch (err) {
		logger.error({ err }, 'tick failed')
	} finally {
		running = false
	}
}

async function main() {
	const env = loadEnv()
	const once = process.argv.includes('--once')

	if (once) {
		await tick()
		process.exit(0)
	}

	logger.info({ network: env.NETWORK, cron: env.CRON_INTERVAL }, 'seeder starting')
	cron.schedule(env.CRON_INTERVAL, () => {
		void tick()
	})
	await tick() // run once immediately
}

main().catch((err) => {
	logger.error({ err }, 'fatal')
	process.exit(1)
})

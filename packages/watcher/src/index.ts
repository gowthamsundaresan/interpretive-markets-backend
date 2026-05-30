import cron from 'node-cron'

import { checkPendingVerdicts } from './checkVerdicts'
import { loadEnv } from './utils/env'
import { logger } from './utils/logger'

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
		await checkPendingVerdicts()
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

	logger.info({ network: env.NETWORK, cron: env.CRON_INTERVAL }, 'watcher starting')
	cron.schedule(env.CRON_INTERVAL, () => {
		void tick()
	})
	await tick()
}

main().catch((err) => {
	logger.error({ err }, 'fatal')
	process.exit(1)
})

import 'dotenv/config'

import { checkPendingVerdicts } from './checkVerdicts'
import { loadEnv } from './utils/env'

console.log('Initializing Watcher ...')

// --- Core functions ---

const UPDATE_FREQUENCY = 60

function delay(seconds: number) {
	return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

async function watchAll() {
	while (true) {
		try {
			console.log(`\nChecking pending verdicts, every ${UPDATE_FREQUENCY} seconds:`)
			console.time('Watched verdicts in')

			await checkPendingVerdicts()

			console.timeEnd('Watched verdicts in')
		} catch (error) {
			console.log('Failed to check verdicts at:', Date.now())
			console.log(error)
		}

		await delay(UPDATE_FREQUENCY)
	}
}

loadEnv()
watchAll()

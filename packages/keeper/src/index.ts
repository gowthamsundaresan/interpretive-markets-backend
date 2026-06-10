import { checkPendingVerdicts } from './checkVerdicts'
import { kickReadyInvestigations } from './operator/kickInvestigation'
import { loadEnv } from './utils/env'
import 'dotenv/config'

const UPDATE_FREQUENCY = 60

// --- Core functions ---

function delay(seconds: number) {
	return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

async function watchVerdicts() {
	while (true) {
		try {
			console.time('Watched verdicts in')
			await checkPendingVerdicts()
			console.timeEnd('Watched verdicts in')
		} catch (error) {
			console.log('[Keeper] verdict check failed:', error)
		}
		await delay(UPDATE_FREQUENCY)
	}
}

async function kickInvestigations() {
	while (true) {
		try {
			await kickReadyInvestigations()
		} catch (error) {
			console.log('[Keeper] kick cycle failed:', error)
		}
		await delay(UPDATE_FREQUENCY)
	}
}

console.log('Initializing Keeper (verdict watcher + investigation kicker) ...')
loadEnv()
void Promise.all([watchVerdicts(), kickInvestigations()])

import { seedLogsExecutorEnabledSet } from './events/seedLogsExecutorEnabledSet'
import { seedLogsExecutorRegistered } from './events/seedLogsExecutorRegistered'
import { seedLogsFrameworkRegistered } from './events/seedLogsFrameworkRegistered'
import { seedLogsHarnessRuleFired } from './events/seedLogsHarnessRuleFired'
import { seedLogsInvestigationDelivered } from './events/seedLogsInvestigationDelivered'
import { seedLogsInvestigationStarted } from './events/seedLogsInvestigationStarted'
import { seedLogsJudgmentDelivered } from './events/seedLogsJudgmentDelivered'
import { seedLogsJudgmentStarted } from './events/seedLogsJudgmentStarted'
import { seedLogsMalformedVerdict } from './events/seedLogsMalformedVerdict'
import { seedLogsMarketCreated } from './events/seedLogsMarketCreated'
import { seedLogsVerdictDisputed } from './events/seedLogsVerdictDisputed'
import { seedLogsVerdictFinalized } from './events/seedLogsVerdictFinalized'
import { seedDisputes } from './seedDisputes'
import { seedExecutors } from './seedExecutors'
import { seedFrameworks } from './seedFrameworks'
import { seedMarkets } from './seedMarkets'
import { seedVerdicts } from './seedVerdicts'
import { loadEnv } from './utils/env'
import { getPublicClient } from './utils/viemClient'
import 'dotenv/config'

console.log('Initializing Seeder ...')

// --- Core functions ---

const UPDATE_FREQUENCY = 30

function delay(seconds: number) {
	return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

async function seedAll() {
	while (true) {
		const publicClient = getPublicClient()
		const targetBlock = await publicClient.getBlockNumber()
		console.log(`\nSeeding data, every ${UPDATE_FREQUENCY} seconds, till block ${targetBlock}:`)
		console.time('Seeded data in')

		try {
			await Promise.all([
				seedLogsFrameworkRegistered(targetBlock),
				seedLogsExecutorRegistered(targetBlock),
				seedLogsExecutorEnabledSet(targetBlock),
				seedLogsMarketCreated(targetBlock),
				seedLogsInvestigationStarted(targetBlock),
				seedLogsInvestigationDelivered(targetBlock),
				seedLogsJudgmentStarted(targetBlock),
				seedLogsJudgmentDelivered(targetBlock),
				seedLogsHarnessRuleFired(targetBlock),
				seedLogsMalformedVerdict(targetBlock),
				seedLogsVerdictFinalized(targetBlock),
				seedLogsVerdictDisputed(targetBlock)
			])

			await Promise.all([seedFrameworks(), seedExecutors()])
			await seedMarkets()
			await seedVerdicts()
			await seedDisputes()
		} catch (error) {
			console.log('Failed to seed data at:', Date.now())
			console.log(error)
		}

		console.timeEnd('Seeded data in')
		await delay(UPDATE_FREQUENCY)
	}
}

loadEnv()
seedAll()

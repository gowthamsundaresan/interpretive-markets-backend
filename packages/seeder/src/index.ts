import { seedLogsFrameworkRegistered } from './events/seedLogsFrameworkRegistered'
import { seedLogsJudgeEnabledSet } from './events/seedLogsJudgeEnabledSet'
import { seedLogsJudgeRegistered } from './events/seedLogsJudgeRegistered'
import { seedLogsMarketCreated } from './events/seedLogsMarketCreated'
import { seedLogsVerdictDisputed } from './events/seedLogsVerdictDisputed'
import { seedLogsVerdictPosted } from './events/seedLogsVerdictPosted'
import { seedDisputes } from './seedDisputes'
import { seedFrameworks } from './seedFrameworks'
import { seedJudges } from './seedJudges'
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
				seedLogsJudgeRegistered(targetBlock),
				seedLogsJudgeEnabledSet(targetBlock),
				seedLogsMarketCreated(targetBlock),
				seedLogsVerdictPosted(targetBlock),
				seedLogsVerdictDisputed(targetBlock)
			])

			await Promise.all([seedFrameworks(), seedJudges()])
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

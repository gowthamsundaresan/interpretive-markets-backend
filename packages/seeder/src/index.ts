import 'dotenv/config'

import { seedLogsFrameworkRegistered } from './events/seedLogsFrameworkRegistered'
import { seedLogsJudgeEnabledSet } from './events/seedLogsJudgeEnabledSet'
import { seedLogsJudgeRegistered } from './events/seedLogsJudgeRegistered'
import { seedLogsMarketCreated } from './events/seedLogsMarketCreated'
import { seedLogsVerdictDisputed } from './events/seedLogsVerdictDisputed'
import { seedLogsVerdictPosted } from './events/seedLogsVerdictPosted'
import { loadEnv } from './utils/env'
import { getPublicClient } from './utils/viemClient'

console.log('Initializing Seeder ...')

// --- Core functions ---

const UPDATE_FREQUENCY = 30

function delay(seconds: number) {
	return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

async function seedAll() {
	while (true) {
		try {
			const publicClient = getPublicClient()
			const targetBlock = await publicClient.getBlockNumber()
			console.log(
				`\nSeeding data, every ${UPDATE_FREQUENCY} seconds, till block ${targetBlock}:`
			)
			console.time('Seeded data in')

			// Registries first — markets depend on framework + judge rows
			await Promise.all([
				seedLogsFrameworkRegistered(targetBlock),
				seedLogsJudgeRegistered(targetBlock)
			])

			// Mutations on existing rows
			await seedLogsJudgeEnabledSet(targetBlock)

			// Market lifecycle: created → resolved → disputed
			await seedLogsMarketCreated(targetBlock)
			await seedLogsVerdictPosted(targetBlock)
			await seedLogsVerdictDisputed(targetBlock)

			console.timeEnd('Seeded data in')
		} catch (error) {
			console.log('Failed to seed data at:', Date.now())
			console.log(error)
		}

		await delay(UPDATE_FREQUENCY)
	}
}

loadEnv()
seedAll()

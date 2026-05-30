import 'dotenv/config'

import { seedBlockData } from './blocks/seedBlockData'
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

console.log('Initializing Seeder ...')

// --- Core functions ---

const UPDATE_FREQUENCY = 30

let isSeedingBlockData = false

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

			// Block timestamps first — every event seeder reads them
			isSeedingBlockData = true
			await seedBlockData(targetBlock)
			isSeedingBlockData = false

			// Phase 1: raw event log archives (independent, run in parallel)
			await Promise.all([
				seedLogsFrameworkRegistered(targetBlock),
				seedLogsJudgeRegistered(targetBlock),
				seedLogsJudgeEnabledSet(targetBlock),
				seedLogsMarketCreated(targetBlock),
				seedLogsVerdictPosted(targetBlock),
				seedLogsVerdictDisputed(targetBlock)
			])

			// Phase 2: transform logs into structured tables. Registries first,
			// then market lifecycle (Market → Verdict → Dispute).
			await Promise.all([seedFrameworks(), seedJudges()])
			await seedMarkets()
			await seedVerdicts()
			await seedDisputes()

			console.timeEnd('Seeded data in')
		} catch (error) {
			console.log('Failed to seed data at:', Date.now())
			console.log(error)
			isSeedingBlockData = false
		}

		await delay(UPDATE_FREQUENCY)
	}
}

loadEnv()
seedAll()

// suppress unused-var warning while the block-data lock is informational only
void isSeedingBlockData

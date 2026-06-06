import { prisma } from '../utils/prismaClient'
import { runEventLogsSeeder } from './_helpers'
import { marketAbi } from '@interpretive/shared'

// --- Core functions ---

export async function seedLogsHarnessRuleFired(
	toBlock?: bigint,
	fromBlock?: bigint
): Promise<void> {
	await runEventLogsSeeder({
		syncKey: 'lastSyncedBlock_logs_harness_rule_fired',
		contract: 'market',
		abi: marketAbi,
		eventName: 'HarnessRuleFired',
		label: 'HarnessRuleFired',
		toBlock,
		fromBlock,
		mapLog: (log, base) => {
			const args = (log as unknown as { args: { marketId: bigint; ruleId: number } }).args
			return { ...base, marketId: args.marketId.toString(), ruleId: Number(args.ruleId) }
		},
		insert: (rows) =>
			prisma.eventLogs_HarnessRuleFired.createMany({ data: rows, skipDuplicates: true })
	})
}

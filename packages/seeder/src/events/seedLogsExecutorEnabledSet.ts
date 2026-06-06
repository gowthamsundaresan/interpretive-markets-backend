import { prisma } from '../utils/prismaClient'
import { runEventLogsSeeder } from './_helpers'
import { attestedExecutorRegistryAbi } from '@interpretive/shared'

// --- Core functions ---

export async function seedLogsExecutorEnabledSet(
	toBlock?: bigint,
	fromBlock?: bigint
): Promise<void> {
	await runEventLogsSeeder({
		syncKey: 'lastSyncedBlock_logs_executor_enabled_set',
		contract: 'attestedExecutorRegistry',
		abi: attestedExecutorRegistryAbi,
		eventName: 'ExecutorEnabledSet',
		label: 'ExecutorEnabledSet',
		toBlock,
		fromBlock,
		mapLog: (log, base) => {
			const args = (log as unknown as { args: { executor: `0x${string}`; enabled: boolean } }).args
			return { ...base, executor: args.executor, enabled: args.enabled }
		},
		insert: (rows) =>
			prisma.eventLogs_ExecutorEnabledSet.createMany({ data: rows, skipDuplicates: true })
	})
}

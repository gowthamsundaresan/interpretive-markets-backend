import { prisma } from '../utils/prismaClient'
import { runEventLogsSeeder } from './_helpers'
import { attestedExecutorRegistryAbi } from '@interpretive/shared'

// --- Core functions ---

export async function seedLogsExecutorRegistered(
	toBlock?: bigint,
	fromBlock?: bigint
): Promise<void> {
	await runEventLogsSeeder({
		syncKey: 'lastSyncedBlock_logs_executor_registered',
		contract: 'attestedExecutorRegistry',
		abi: attestedExecutorRegistryAbi,
		eventName: 'ExecutorRegistered',
		label: 'ExecutorRegistered',
		toBlock,
		fromBlock,
		mapLog: (log, base) => {
			const args = (log as unknown as { args: { executor: `0x${string}` } }).args
			return { ...base, executor: args.executor }
		},
		insert: (rows) =>
			prisma.eventLogs_ExecutorRegistered.createMany({ data: rows, skipDuplicates: true })
	})
}

import { prisma } from '../utils/prismaClient'
import { runEventLogsSeeder } from './_helpers'
import { marketAbi } from '@interpretive/shared'

// --- Core functions ---

export async function seedLogsJudgmentStarted(toBlock?: bigint, fromBlock?: bigint): Promise<void> {
	await runEventLogsSeeder({
		syncKey: 'lastSyncedBlock_logs_judgment_started',
		contract: 'market',
		abi: marketAbi,
		eventName: 'JudgmentStarted',
		label: 'JudgmentStarted',
		toBlock,
		fromBlock,
		mapLog: (log, base) => {
			const args = (log as unknown as { args: { marketId: bigint; promptHash: `0x${string}` } })
				.args
			return { ...base, marketId: args.marketId.toString(), promptHash: args.promptHash }
		},
		insert: (rows) =>
			prisma.eventLogs_JudgmentStarted.createMany({ data: rows, skipDuplicates: true })
	})
}

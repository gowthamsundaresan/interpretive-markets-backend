import { prisma } from '../utils/prismaClient'
import { runEventLogsSeeder } from './_helpers'
import { marketAbi } from '@interpretive/shared'

// --- Core functions ---

export async function seedLogsJudgmentDelivered(
	toBlock?: bigint,
	fromBlock?: bigint
): Promise<void> {
	await runEventLogsSeeder({
		syncKey: 'lastSyncedBlock_logs_judgment_delivered',
		contract: 'market',
		abi: marketAbi,
		eventName: 'JudgmentDelivered',
		label: 'JudgmentDelivered',
		toBlock,
		fromBlock,
		mapLog: (log, base) => {
			const args = (log as unknown as { args: { marketId: bigint; verdictHash: `0x${string}` } })
				.args
			return { ...base, marketId: args.marketId.toString(), verdictHash: args.verdictHash }
		},
		insert: (rows) =>
			prisma.eventLogs_JudgmentDelivered.createMany({ data: rows, skipDuplicates: true })
	})
}

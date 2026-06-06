import { prisma } from '../utils/prismaClient'
import { runEventLogsSeeder } from './_helpers'
import { marketAbi } from '@interpretive/shared'

// --- Core functions ---

export async function seedLogsVerdictFinalized(
	toBlock?: bigint,
	fromBlock?: bigint
): Promise<void> {
	await runEventLogsSeeder({
		syncKey: 'lastSyncedBlock_logs_verdict_finalized',
		contract: 'market',
		abi: marketAbi,
		eventName: 'VerdictFinalized',
		label: 'VerdictFinalized',
		toBlock,
		fromBlock,
		mapLog: (log, base) => {
			const args = (
				log as unknown as { args: { marketId: bigint; outcome: number; confidenceBps: number } }
			).args
			return {
				...base,
				marketId: args.marketId.toString(),
				outcome: Number(args.outcome),
				confidenceBps: Number(args.confidenceBps)
			}
		},
		insert: (rows) =>
			prisma.eventLogs_VerdictFinalized.createMany({ data: rows, skipDuplicates: true })
	})
}

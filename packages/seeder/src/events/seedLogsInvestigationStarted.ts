import { prisma } from '../utils/prismaClient'
import { runEventLogsSeeder } from './_helpers'
import { marketAbi } from '@interpretive/shared'

// --- Core functions ---

export async function seedLogsInvestigationStarted(
	toBlock?: bigint,
	fromBlock?: bigint
): Promise<void> {
	await runEventLogsSeeder({
		syncKey: 'lastSyncedBlock_logs_investigation_started',
		contract: 'market',
		abi: marketAbi,
		eventName: 'InvestigationStarted',
		label: 'InvestigationStarted',
		toBlock,
		fromBlock,
		mapLog: (log, base) => {
			const args = (
				log as unknown as {
					args: { marketId: bigint; jobId: `0x${string}`; requestBinding: `0x${string}` }
				}
			).args
			return {
				...base,
				marketId: args.marketId.toString(),
				jobId: args.jobId,
				requestBinding: args.requestBinding
			}
		},
		insert: (rows) =>
			prisma.eventLogs_InvestigationStarted.createMany({ data: rows, skipDuplicates: true })
	})
}

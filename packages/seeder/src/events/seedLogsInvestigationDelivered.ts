import { prisma } from '../utils/prismaClient'
import { runEventLogsSeeder } from './_helpers'
import { marketAbi } from '@interpretive/shared'

// --- Core functions ---

export async function seedLogsInvestigationDelivered(
	toBlock?: bigint,
	fromBlock?: bigint
): Promise<void> {
	await runEventLogsSeeder({
		syncKey: 'lastSyncedBlock_logs_investigation_delivered',
		contract: 'market',
		abi: marketAbi,
		eventName: 'InvestigationDelivered',
		label: 'InvestigationDelivered',
		toBlock,
		fromBlock,
		mapLog: (log, base) => {
			const args = (
				log as unknown as { args: { marketId: bigint; jobId: `0x${string}`; dossierCid: string } }
			).args
			return {
				...base,
				marketId: args.marketId.toString(),
				jobId: args.jobId,
				dossierCid: args.dossierCid
			}
		},
		insert: (rows) =>
			prisma.eventLogs_InvestigationDelivered.createMany({ data: rows, skipDuplicates: true })
	})
}

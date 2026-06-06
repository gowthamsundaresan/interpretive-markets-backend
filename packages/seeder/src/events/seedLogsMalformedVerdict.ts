import { prisma } from '../utils/prismaClient'
import { runEventLogsSeeder } from './_helpers'
import { marketAbi } from '@interpretive/shared'

// --- Core functions ---

export async function seedLogsMalformedVerdict(
	toBlock?: bigint,
	fromBlock?: bigint
): Promise<void> {
	await runEventLogsSeeder({
		syncKey: 'lastSyncedBlock_logs_malformed_verdict',
		contract: 'market',
		abi: marketAbi,
		eventName: 'MalformedVerdict',
		label: 'MalformedVerdict',
		toBlock,
		fromBlock,
		mapLog: (log, base) => {
			const args = (log as unknown as { args: { marketId: bigint; reason: string } }).args
			return { ...base, marketId: args.marketId.toString(), reason: args.reason }
		},
		insert: (rows) =>
			prisma.eventLogs_MalformedVerdict.createMany({ data: rows, skipDuplicates: true })
	})
}

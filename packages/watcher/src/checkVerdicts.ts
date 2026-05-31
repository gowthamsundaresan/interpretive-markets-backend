import { reExecuteVerdict } from './reExecuteVerdict'
import { prisma } from './utils/prismaClient'
import { ReExecStatus } from '@interpretive/prisma'

const BATCH_SIZE = 10

// --- Core functions ---

export async function checkPendingVerdicts(): Promise<void> {
	const pending = await prisma.verdict.findMany({
		where: { reExecStatus: ReExecStatus.pending },
		take: BATCH_SIZE
	})

	if (pending.length === 0) {
		console.log('[In Sync] [Verdicts] no pending verdicts')
		return
	}

	console.time(`[Verdicts] re-execute size: ${pending.length}`)
	for (const verdict of pending) {
		try {
			await reExecuteVerdict(verdict)
		} catch (err) {
			console.log(`[Verdicts] re-exec failed for market ${verdict.marketId}`)
			console.log(err)
			await prisma.verdict.update({
				where: { marketId: verdict.marketId },
				data: { reExecCheckedAt: new Date() }
			})
		}
	}
	console.timeEnd(`[Verdicts] re-execute size: ${pending.length}`)
}

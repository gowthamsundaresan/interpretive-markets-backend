import { prisma } from './utils/prismaClient'
import { verifyAttestation } from './verifyAttestation'
import { ReExecStatus } from '@interpretive/prisma'

const BATCH_SIZE = 10

// --- Core functions ---

export async function checkPendingVerdicts(): Promise<void> {
	const pending = await prisma.verdict.findMany({
		where: { auditStatus: ReExecStatus.pending },
		take: BATCH_SIZE
	})

	if (pending.length === 0) {
		console.log('[In Sync] [Verdicts] no pending verdicts')
		return
	}

	console.time(`[Verdicts] consistency-audit size: ${pending.length}`)
	for (const verdict of pending) {
		try {
			await verifyAttestation(verdict)
		} catch (err) {
			console.log(`[Verdicts] audit failed for market ${verdict.marketId}`)
			console.log(err)
			await prisma.verdict.update({
				where: { marketId: verdict.marketId },
				data: { auditCheckedAt: new Date() }
			})
		}
	}
	console.timeEnd(`[Verdicts] consistency-audit size: ${pending.length}`)
}

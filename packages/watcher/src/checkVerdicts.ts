import { ReExecStatus } from '@interpretive/prisma'
import type { Verdict } from '@interpretive/prisma'

import { reExecuteVerdict } from './reExecuteVerdict'
import { logger } from './utils/logger'
import { prisma } from './utils/prismaClient'

// --- Core functions ---

export async function checkPendingVerdicts(): Promise<void> {
	const pending = await prisma.verdict.findMany({
		where: { reExecStatus: ReExecStatus.pending },
		take: 10
	})

	if (pending.length === 0) {
		logger.debug('no pending verdicts')
		return
	}

	logger.info({ count: pending.length }, 'processing pending verdicts')
	for (const verdict of pending) {
		await runOne(verdict)
	}
}

async function runOne(verdict: Verdict): Promise<void> {
	try {
		await reExecuteVerdict(verdict)
	} catch (err) {
		logger.error({ err, marketId: verdict.marketId.toString() }, 'reExecuteVerdict failed')
		await prisma.verdict.update({
			where: { marketId: verdict.marketId },
			data: {
				reExecCheckedAt: new Date()
			}
		})
	}
}

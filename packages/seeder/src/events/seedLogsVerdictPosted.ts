import { marketAbi } from '@interpretive/shared'
import { getAbiItem, type AbiEvent } from 'viem'

import { loadDeployment } from '../data/address'
import { loadEnv } from '../utils/env'
import { prisma } from '../utils/prismaClient'
import {
	bulkUpdateDbTransactions,
	fetchLastSyncBlock,
	loopThroughBlocks,
	saveLastSyncBlockTransaction,
	type DbTransaction
} from '../utils/seeder'
import { getPublicClient } from '../utils/viemClient'

const SYNC_KEY = 'lastSyncedBlock_logs_verdict_posted'

// --- Core functions ---

export async function seedLogsVerdictPosted(
	toBlock?: bigint,
	fromBlock?: bigint
): Promise<void> {
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const publicClient = getPublicClient()

	const firstBlock = fromBlock ?? (await fetchLastSyncBlock(SYNC_KEY, env.START_BLOCK))
	const lastBlock = toBlock ?? (await publicClient.getBlockNumber())

	const event = getAbiItem({ abi: marketAbi, name: 'VerdictPosted' }) as AbiEvent

	await loopThroughBlocks(firstBlock, lastBlock, async (windowFrom, windowTo) => {
		const logs = await publicClient.getLogs({
			address: deployment.market,
			event,
			fromBlock: windowFrom,
			toBlock: windowTo
		})

		const dbTransactions: DbTransaction[] = []

		for (const log of logs) {
			const args = (
				log as unknown as {
					args: { marketId: bigint; signer: `0x${string}`; bundleRef: string }
				}
			).args
			const blockNumber = log.blockNumber ?? 0n

			const market = (await publicClient.readContract({
				address: deployment.market,
				abi: marketAbi,
				functionName: 'get',
				args: [args.marketId]
			})) as {
				verdict: { outcome: number; confidence: bigint; verdictHash: `0x${string}` }
				resolvedAt: bigint
			}

			dbTransactions.push(
				prisma.verdict.upsert({
					where: { marketId: args.marketId },
					create: {
						marketId: args.marketId,
						outcome: market.verdict.outcome,
						confidence: market.verdict.confidence.toString(),
						verdictHash: market.verdict.verdictHash,
						bundleRef: args.bundleRef,
						signer: args.signer,
						postedAt: new Date(Number(market.resolvedAt) * 1000),
						postedAtBlock: blockNumber
					},
					update: {
						outcome: market.verdict.outcome,
						confidence: market.verdict.confidence.toString(),
						verdictHash: market.verdict.verdictHash,
						bundleRef: args.bundleRef,
						signer: args.signer,
						postedAtBlock: blockNumber
					}
				})
			)
		}

		dbTransactions.push(saveLastSyncBlockTransaction(SYNC_KEY, windowTo))

		await bulkUpdateDbTransactions(
			dbTransactions,
			`[Logs] VerdictPosted ${windowFrom}-${windowTo} size: ${logs.length}`
		)
	})
}

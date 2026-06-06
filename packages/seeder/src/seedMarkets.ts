import { loadDeployment } from './data/address'
import { loadEnv } from './utils/env'
import { prisma } from './utils/prismaClient'
import {
	type DbTransaction,
	bulkUpdateDbTransactions,
	fetchLastSyncBlock,
	loopThroughBlocks,
	saveLastSyncBlock
} from './utils/seeder'
import { getPublicClient } from './utils/viemClient'
import { marketAbi } from '@interpretive/shared'

// --- Types & state ---

const SYNC_KEY = 'lastSyncedBlock_data_markets'
const LOGS_SYNC_KEY = 'lastSyncedBlock_logs_market_created'

interface OnChainMarketInit {
	question: string
	frameworkId: `0x${string}`
	sourceAllowlist: readonly string[]
	dossierPathPrefix: string
	dossierSubjects: readonly string[]
	resolutionTime: bigint
	cliType: number
	model: string
	maxTurns: number
	maxTokens: number
	callbackGasLimit: bigint
	investigationTtl: bigint
}

interface OnChainMarket {
	init: OnChainMarketInit
	creator: `0x${string}`
	createdAt: bigint
	investigationJobId: `0x${string}`
	investigationStartedAt: bigint
	dossierCid: string
	finalized: boolean
	malformed: boolean
	disputed: boolean
}

// --- Core functions ---

export async function seedMarkets(toBlock?: bigint, fromBlock?: bigint): Promise<void> {
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const publicClient = getPublicClient()

	const firstBlock = fromBlock ?? (await fetchLastSyncBlock(SYNC_KEY, env.START_BLOCK))
	const lastBlock = toBlock ?? (await fetchLastSyncBlock(LOGS_SYNC_KEY, env.START_BLOCK))

	if (lastBlock <= firstBlock) {
		console.log(`[In Sync] [Data] Markets from: ${firstBlock} to: ${lastBlock}`)
		return
	}

	await loopThroughBlocks(firstBlock, lastBlock, async (windowFrom, windowTo) => {
		const logs = await prisma.eventLogs_MarketCreated.findMany({
			where: { blockNumber: { gt: windowFrom, lte: windowTo } }
		})

		const dbTransactions: DbTransaction[] = []

		for (const log of logs) {
			const marketId = BigInt(log.marketId)
			const m = (await publicClient.readContract({
				address: deployment.market,
				abi: marketAbi,
				functionName: 'get',
				args: [marketId]
			})) as OnChainMarket

			dbTransactions.push(
				prisma.market.upsert({
					where: { id: marketId },
					create: {
						id: marketId,
						question: m.init.question,
						frameworkId: m.init.frameworkId,
						creator: m.creator,
						createdAt: log.blockTime,
						createdAtBlock: log.blockNumber,
						sourceAllowlist: [...m.init.sourceAllowlist],
						dossierPathPrefix: m.init.dossierPathPrefix,
						dossierSubjects: [...m.init.dossierSubjects],
						resolutionTime: new Date(Number(m.init.resolutionTime) * 1000),
						cliType: m.init.cliType,
						model: m.init.model,
						maxTurns: m.init.maxTurns,
						maxTokens: m.init.maxTokens,
						callbackGasLimit: m.init.callbackGasLimit,
						investigationTtl: m.init.investigationTtl,
						investigationJobId:
							m.investigationJobId ===
							'0x0000000000000000000000000000000000000000000000000000000000000000'
								? null
								: m.investigationJobId,
						investigationStartedAt:
							m.investigationStartedAt === 0n ? null : m.investigationStartedAt,
						dossierCid: m.dossierCid || null,
						finalized: m.finalized,
						malformed: m.malformed,
						disputed: m.disputed
					},
					update: {
						investigationJobId:
							m.investigationJobId ===
							'0x0000000000000000000000000000000000000000000000000000000000000000'
								? null
								: m.investigationJobId,
						investigationStartedAt:
							m.investigationStartedAt === 0n ? null : m.investigationStartedAt,
						dossierCid: m.dossierCid || null,
						finalized: m.finalized,
						malformed: m.malformed,
						disputed: m.disputed
					}
				})
			)
		}

		await bulkUpdateDbTransactions(
			dbTransactions,
			`[Data] Markets from: ${windowFrom} to: ${windowTo} size: ${logs.length}`
		)
	})

	await saveLastSyncBlock(SYNC_KEY, lastBlock)
}

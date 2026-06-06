import { loadDeployment } from '../data/address'
import { loadEnv } from '../utils/env'
import {
	type DbTransaction,
	bulkUpdateDbTransactions,
	fetchLastSyncBlock,
	getBlockTimestamps,
	loopThroughBlocks,
	saveLastSyncBlockTransaction
} from '../utils/seeder'
import { getPublicClient } from '../utils/viemClient'
import type { Abi, AbiEvent, Log } from 'viem'
import { getAbiItem } from 'viem'

// --- Types & state ---

export interface RowBase {
	address: string
	transactionHash: string
	transactionIndex: number
	blockNumber: bigint
	blockHash: string
	blockTime: Date
}

export interface RunEventLogsArgs<TRow extends RowBase> {
	syncKey: string
	contract: 'market' | 'attestedExecutorRegistry' | 'frameworkRegistry'
	abi: Abi
	eventName: string
	mapLog: (log: Log, base: RowBase) => TRow
	insert: (rows: TRow[]) => DbTransaction
	label: string
	toBlock?: bigint
	fromBlock?: bigint
}

// --- Core functions ---

// Shared scaffolding for event-log archive seeders. Each event's handler supplies the abi item
// lookup, the per-row mapping, and the prisma insert; this function owns the polling cursor,
// block-time fetch, and bulk-update orchestration.
export async function runEventLogsSeeder<TRow extends RowBase>(
	args: RunEventLogsArgs<TRow>
): Promise<void> {
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const publicClient = getPublicClient()

	const contractAddress = deployment[args.contract]
	const firstBlock = args.fromBlock ?? (await fetchLastSyncBlock(args.syncKey, env.START_BLOCK))
	const lastBlock = args.toBlock ?? (await publicClient.getBlockNumber())

	const event = getAbiItem({ abi: args.abi, name: args.eventName }) as AbiEvent

	await loopThroughBlocks(firstBlock, lastBlock, async (windowFrom, windowTo) => {
		const logs = await publicClient.getLogs({
			address: contractAddress,
			event,
			fromBlock: windowFrom,
			toBlock: windowTo
		})

		const blockData = await getBlockTimestamps(
			publicClient,
			logs.map((l) => l.blockNumber ?? 0n)
		)

		const rows: TRow[] = []
		for (const log of logs) {
			const blockNumber = log.blockNumber ?? 0n
			const base: RowBase = {
				address: log.address,
				transactionHash: log.transactionHash ?? '',
				transactionIndex: log.logIndex ?? 0,
				blockNumber,
				blockHash: log.blockHash ?? '',
				blockTime: blockData.get(blockNumber) ?? new Date(0)
			}
			rows.push(args.mapLog(log, base))
		}

		const dbTransactions: DbTransaction[] = []
		if (rows.length > 0) dbTransactions.push(args.insert(rows))
		dbTransactions.push(saveLastSyncBlockTransaction(args.syncKey, windowTo))

		await bulkUpdateDbTransactions(
			dbTransactions,
			`[Logs] ${args.label} ${windowFrom}-${windowTo} size: ${rows.length}`
		)
	})
}

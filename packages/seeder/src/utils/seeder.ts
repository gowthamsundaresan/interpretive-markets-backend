import { chunkArray } from './array'
import { prisma } from './prismaClient'
import type { Prisma } from '@interpretive/prisma'

// --- Types ---

export type DbTransaction = Prisma.PrismaPromise<unknown>

const BLOCK_BATCH_SIZE = 4999n
const DB_BATCH_SIZE = 1000

// --- Core functions ---

export async function loopThroughBlocks(
	firstBlock: bigint,
	lastBlock: bigint,
	cb: (fromBlock: bigint, toBlock: bigint) => Promise<void>,
	batchSize: bigint = BLOCK_BATCH_SIZE
): Promise<bigint> {
	let currentBlock = firstBlock
	let nextBlock = firstBlock

	while (nextBlock < lastBlock) {
		nextBlock = currentBlock + batchSize
		if (nextBlock >= lastBlock) nextBlock = lastBlock

		await cb(currentBlock, nextBlock)

		currentBlock = nextBlock
	}

	return lastBlock
}

export async function bulkUpdateDbTransactions(
	dbTransactions: DbTransaction[],
	label?: string
): Promise<void> {
	if (dbTransactions.length === 0) return

	console.time(`[DB Write (${dbTransactions.length})] ${label || ''}`)

	for (const chunk of chunkArray(dbTransactions, DB_BATCH_SIZE)) {
		await prisma.$transaction(chunk)
	}

	console.timeEnd(`[DB Write (${dbTransactions.length})] ${label || ''}`)
}

export async function fetchLastSyncBlock(key: string, fallback: bigint): Promise<bigint> {
	const row = await prisma.setting.findUnique({ where: { key } })
	if (!row) return fallback
	const v = row.value as unknown
	if (typeof v === 'string') return BigInt(v)
	if (typeof v === 'number') return BigInt(v)
	return fallback
}

export async function saveLastSyncBlock(key: string, blockNumber: bigint): Promise<void> {
	await prisma.setting.upsert({
		where: { key },
		create: { key, value: blockNumber.toString() },
		update: { value: blockNumber.toString() }
	})
}

export function saveLastSyncBlockTransaction(key: string, blockNumber: bigint): DbTransaction {
	return prisma.setting.upsert({
		where: { key },
		create: { key, value: blockNumber.toString() },
		update: { value: blockNumber.toString() }
	})
}

export async function getBlockDataFromDb(
	fromBlock: bigint,
	toBlock: bigint
): Promise<Map<bigint, Date>> {
	const rows = await prisma.evm_BlockData.findMany({
		where: { number: { gte: fromBlock, lte: toBlock } },
		select: { number: true, timestamp: true },
		orderBy: { number: 'asc' }
	})
	return new Map(rows.map((r) => [r.number, r.timestamp]))
}

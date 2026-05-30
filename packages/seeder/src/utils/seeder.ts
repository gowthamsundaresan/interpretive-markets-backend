import { prisma } from './prismaClient.js'

// --- Types ---

export interface BlockRange {
	fromBlock: bigint
	toBlock: bigint
}

export interface CursorWindow {
	fromBlock: bigint
	toBlock: bigint
	advance: (newCursor: bigint) => Promise<void>
}

const CHUNK_SIZE = 4_000n // safe for free RPC providers (often capped at 5k logs / 10k blocks)

// --- Core functions ---

export async function openCursorWindow(args: {
	key: string
	fallbackFromBlock: bigint
	chainHead: bigint
}): Promise<CursorWindow | null> {
	const cursor = await prisma.blockCursor.upsert({
		where: { key: args.key },
		create: { key: args.key, lastBlock: args.fallbackFromBlock },
		update: {}
	})

	const fromBlock = cursor.lastBlock > args.fallbackFromBlock ? cursor.lastBlock + 1n : args.fallbackFromBlock
	if (fromBlock > args.chainHead) return null

	const toBlock = fromBlock + CHUNK_SIZE > args.chainHead ? args.chainHead : fromBlock + CHUNK_SIZE - 1n
	return {
		fromBlock,
		toBlock,
		advance: async (newCursor) => {
			await prisma.blockCursor.update({
				where: { key: args.key },
				data: { lastBlock: newCursor }
			})
		}
	}
}

export async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
	let lastErr: unknown
	for (let i = 0; i < attempts; i++) {
		try {
			return await fn()
		} catch (err) {
			lastErr = err
			await sleep(500 * Math.pow(2, i))
		}
	}
	throw new Error(`${label} failed after ${attempts} attempts: ${String(lastErr)}`)
}

// --- Helper functions ---

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms))
}

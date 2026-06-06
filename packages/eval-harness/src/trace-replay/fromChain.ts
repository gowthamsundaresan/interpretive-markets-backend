import { marketAbi } from '@interpretive/shared'
import type { AbiEvent, PublicClient } from 'viem'
import { createPublicClient, getAbiItem, http } from 'viem'

// --- Types & state ---

// Event names we trace through. Order is canonical (matches Market.sol's lifecycle); the
// assembler relies on this ordering to attribute parent spans.
export const TRACED_EVENTS = [
	'MarketCreated',
	'InvestigationStarted',
	'InvestigationDelivered',
	'JudgmentStarted',
	'JudgmentDelivered',
	'HarnessRuleFired',
	'MalformedVerdict',
	'VerdictFinalized',
	'VerdictDisputed'
] as const

export type TracedEventName = (typeof TRACED_EVENTS)[number]

export interface ChainEvent {
	name: TracedEventName
	args: Record<string, unknown>
	blockNumber: bigint
	blockTime: Date
	transactionHash: `0x${string}`
}

// --- Core functions ---

export function publicClientFromRpcUrl(rpcUrl: string): PublicClient {
	return createPublicClient({ transport: http(rpcUrl) })
}

// Read Market.sol events for a specific marketId from a deployed contract. The function fetches
// per-event topic and filters by the marketId indexed argument so we only get this market's
// events. Returns events in canonical lifecycle order, not block order (block order is
// equivalent in the happy path but the canonical order is what the assembler needs).
export async function readMarketEvents(args: {
	publicClient: PublicClient
	marketAddress: `0x${string}`
	marketId: bigint
	fromBlock?: bigint
	toBlock?: bigint
}): Promise<ChainEvent[]> {
	const collected: ChainEvent[] = []
	const blockTimeCache = new Map<bigint, Date>()

	for (const eventName of TRACED_EVENTS) {
		const event = getAbiItem({ abi: marketAbi, name: eventName }) as AbiEvent
		const logs = await args.publicClient.getLogs({
			address: args.marketAddress,
			event,
			args: { marketId: args.marketId },
			fromBlock: args.fromBlock ?? 0n,
			toBlock: args.toBlock ?? 'latest'
		})
		for (const log of logs) {
			const blockNumber = log.blockNumber ?? 0n
			let blockTime = blockTimeCache.get(blockNumber)
			if (!blockTime) {
				const block = await args.publicClient.getBlock({ blockNumber })
				blockTime = new Date(Number(block.timestamp) * 1000)
				blockTimeCache.set(blockNumber, blockTime)
			}
			collected.push({
				name: eventName,
				args: (log as unknown as { args: Record<string, unknown> }).args ?? {},
				blockNumber,
				blockTime,
				transactionHash: log.transactionHash ?? '0x'
			})
		}
	}

	return collected.sort(canonicalOrderCompare)
}

// --- Helper functions ---

function canonicalOrderCompare(a: ChainEvent, b: ChainEvent): number {
	const indexA = TRACED_EVENTS.indexOf(a.name)
	const indexB = TRACED_EVENTS.indexOf(b.name)
	if (a.blockNumber !== b.blockNumber) {
		return a.blockNumber < b.blockNumber ? -1 : 1
	}
	return indexA - indexB
}

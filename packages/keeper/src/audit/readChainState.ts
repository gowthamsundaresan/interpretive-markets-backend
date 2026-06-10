import { marketAbi } from '@interpretive/shared'
import type { AbiEvent, PublicClient } from 'viem'
import { getAbiItem } from 'viem'

// --- Types & state ---

// What the chain reports about a resolved market — everything the audit engine needs to make a
// dispute decision without re-running the LLM.
export interface OnChainMarketState {
	marketId: bigint
	market: {
		init: {
			question: string
			frameworkId: `0x${string}`
			sourceAllowlist: readonly string[]
			dossierPathPrefix: string
			dossierSubjects: readonly string[]
			resolutionTime: bigint
			cliType: number
			model: string
		}
		investigationJobId: `0x${string}`
		dossierCid: string
		finalized: boolean
		malformed: boolean
		disputed: boolean
	}
	investigationStarted: {
		jobId: `0x${string}`
		requestBinding: `0x${string}`
	} | null
	judgmentStarted: {
		promptHash: `0x${string}`
	} | null
	investigationDelivered: {
		dossierCid: string
	} | null
	verdictFinalized: {
		outcome: number
		confidenceBps: number
	} | null
}

// --- Core functions ---

export async function readMarketChainState(args: {
	publicClient: PublicClient
	marketAddress: `0x${string}`
	marketId: bigint
	fromBlock?: bigint
	toBlock?: bigint
}): Promise<OnChainMarketState> {
	const { publicClient, marketAddress, marketId } = args
	const fromBlock = args.fromBlock ?? 0n
	const toBlock = args.toBlock ?? 'latest'

	const market = (await publicClient.readContract({
		address: marketAddress,
		abi: marketAbi,
		functionName: 'get',
		args: [marketId]
	})) as OnChainMarketState['market']

	const investigationStarted = await readSingleEvent({
		publicClient,
		marketAddress,
		marketId,
		eventName: 'InvestigationStarted',
		fromBlock,
		toBlock
	})

	const investigationDelivered = await readSingleEvent({
		publicClient,
		marketAddress,
		marketId,
		eventName: 'InvestigationDelivered',
		fromBlock,
		toBlock
	})

	const judgmentStarted = await readSingleEvent({
		publicClient,
		marketAddress,
		marketId,
		eventName: 'JudgmentStarted',
		fromBlock,
		toBlock
	})

	const verdictFinalized = await readSingleEvent({
		publicClient,
		marketAddress,
		marketId,
		eventName: 'VerdictFinalized',
		fromBlock,
		toBlock
	})

	return {
		marketId,
		market,
		investigationStarted: investigationStarted
			? {
					jobId: investigationStarted.jobId as `0x${string}`,
					requestBinding: investigationStarted.requestBinding as `0x${string}`
				}
			: null,
		investigationDelivered: investigationDelivered
			? { dossierCid: investigationDelivered.dossierCid as string }
			: null,
		judgmentStarted: judgmentStarted
			? { promptHash: judgmentStarted.promptHash as `0x${string}` }
			: null,
		verdictFinalized: verdictFinalized
			? {
					outcome: Number(verdictFinalized.outcome),
					confidenceBps: Number(verdictFinalized.confidenceBps)
				}
			: null
	}
}

// --- Helper functions ---

async function readSingleEvent(args: {
	publicClient: PublicClient
	marketAddress: `0x${string}`
	marketId: bigint
	eventName: string
	fromBlock: bigint
	toBlock: bigint | 'latest'
}): Promise<Record<string, unknown> | null> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const event = getAbiItem({ abi: marketAbi as any, name: args.eventName }) as unknown as AbiEvent
	const logs = await args.publicClient.getLogs({
		address: args.marketAddress,
		event,
		args: { marketId: args.marketId },
		fromBlock: args.fromBlock,
		toBlock: args.toBlock
	})
	if (logs.length === 0) return null
	return (logs[0] as unknown as { args: Record<string, unknown> }).args ?? {}
}

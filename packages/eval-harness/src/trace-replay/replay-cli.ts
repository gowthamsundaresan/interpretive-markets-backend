import { assembleTrace } from './assembler'
import { publicClientFromRpcUrl, readMarketEvents } from './fromChain'
import { createJsonFileSink } from './sink-json'
import { tryCreateLangfuseSinkFromEnv } from './sink-langfuse'
import type { TraceSink } from './types'

// --- Types & state ---

interface ReplayArgs {
	rpcUrl: string
	marketAddress: `0x${string}`
	marketId: bigint
	chainId: number
	sink: 'json' | 'langfuse'
	fromBlock?: bigint
	toBlock?: bigint
}

// --- Core functions ---

async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2))
	const publicClient = publicClientFromRpcUrl(args.rpcUrl)

	console.log(
		`[replay] reading market=${args.marketAddress} marketId=${args.marketId} chainId=${args.chainId} from=${args.fromBlock ?? 0} to=${args.toBlock ?? 'latest'}`
	)
	const events = await readMarketEvents({
		publicClient,
		marketAddress: args.marketAddress,
		marketId: args.marketId,
		fromBlock: args.fromBlock,
		toBlock: args.toBlock
	})
	console.log(`[replay] read ${events.length} events`)

	const trace = await assembleTrace(events, {
		source: {
			kind: 'reconstructed',
			chainId: args.chainId,
			marketAddress: args.marketAddress,
			marketId: args.marketId
		}
	})

	const sink = await openSink(args.sink)
	await sink.push(trace)
	await sink.flush()
	console.log(
		`[replay] pushed trace id=${trace.id} (${trace.spans.length} spans) → ${sink.name} sink`
	)
}

// --- Helper functions ---

function parseArgs(argv: string[]): ReplayArgs {
	const out: Partial<ReplayArgs> = { sink: 'json', chainId: 1979 }
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i]
		if (a === '--rpc-url') out.rpcUrl = argv[++i]
		else if (a === '--market-address') out.marketAddress = argv[++i] as `0x${string}`
		else if (a === '--market-id') out.marketId = BigInt(argv[++i])
		else if (a === '--chain-id') out.chainId = Number(argv[++i])
		else if (a === '--sink') out.sink = argv[++i] as 'json' | 'langfuse'
		else if (a === '--from-block') out.fromBlock = BigInt(argv[++i])
		else if (a === '--to-block') out.toBlock = BigInt(argv[++i])
	}
	if (!out.rpcUrl) throw new Error('--rpc-url required')
	if (!out.marketAddress) throw new Error('--market-address required')
	if (out.marketId === undefined) throw new Error('--market-id required')
	return out as ReplayArgs
}

async function openSink(mode: 'json' | 'langfuse'): Promise<TraceSink> {
	if (mode === 'json') return createJsonFileSink()
	const langfuse = tryCreateLangfuseSinkFromEnv()
	if (!langfuse) {
		console.warn(
			'[replay] --sink=langfuse requested but LANGFUSE_PUBLIC_KEY/SECRET_KEY not set; falling back to json'
		)
		return createJsonFileSink()
	}
	return langfuse
}

main().catch((err) => {
	console.error('[replay] failed:', err)
	process.exit(1)
})

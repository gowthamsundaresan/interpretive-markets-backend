// --- Types & state ---

// Genesis-deployed Ritual L1 system contracts. Addresses sourced from
// docs.ritualfoundation.org during Phase 0 (see PLAN.md §5 Phase 0).
export const RITUAL_SYSTEM_CONTRACTS = {
	RITUAL_WALLET: '0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948',
	ASYNC_JOB_TRACKER: '0xC069FFCa0389f44eCA2C626e55491b0ab045AEF5',
	TEE_SERVICE_REGISTRY: '0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F',
	ASYNC_DELIVERY: '0x5A16214fF555848411544b005f7Ac063742f39F6',
	MODEL_PRICING_REGISTRY: '0x7A85F48b971ceBb75491b61abe279728F4c4384f',
	SCHEDULER: '0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B',
	AGENT_HEARTBEAT: '0xEF505E801f1Db392B5289690E2ffc20e840A3aCa',
	SECRETS_ACCESS_CONTROL: '0xf9BF1BC8A3e79B9EBeD0fa2Db70D0513fecE32FD'
} as const satisfies Record<string, `0x${string}`>

export type RitualSystemContract = keyof typeof RITUAL_SYSTEM_CONTRACTS

export interface RitualChainConfig {
	chainId: 1979
	rpcUrl: string
	wsRpcUrl: string
	explorerUrl: string
	faucetUrl: string
	systemContracts: typeof RITUAL_SYSTEM_CONTRACTS
}

// --- Core functions ---

export function ritualChainConfig(rpcUrlOverride?: string): RitualChainConfig {
	return {
		chainId: 1979,
		rpcUrl: rpcUrlOverride ?? 'https://rpc.ritualfoundation.org',
		wsRpcUrl: 'wss://rpc.ritualfoundation.org',
		explorerUrl: 'https://explorer.ritualfoundation.org',
		faucetUrl: 'https://faucet.ritualfoundation.org',
		systemContracts: RITUAL_SYSTEM_CONTRACTS
	}
}

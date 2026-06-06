// --- Types & state ---

export const PRECOMPILE_ADDRESSES = {
	ONNX: '0x0000000000000000000000000000000000000800',
	HTTP: '0x0000000000000000000000000000000000000801',
	LLM_INFERENCE: '0x0000000000000000000000000000000000000802',
	JQ: '0x0000000000000000000000000000000000000803',
	LONG_HTTP: '0x0000000000000000000000000000000000000805',
	ZK_PROOFS: '0x0000000000000000000000000000000000000806',
	FHE_INFERENCE: '0x0000000000000000000000000000000000000807',
	SOVEREIGN_AGENT: '0x000000000000000000000000000000000000080c',
	PERSISTENT_AGENT: '0x0000000000000000000000000000000000000820'
} as const

export type StorageRefPlatform = 'ipfs' | 'huggingface' | 'gcs' | 'pinata'

export type StorageRef = readonly [
	platform: StorageRefPlatform | string,
	path: string,
	keyRef: string
]

// Mirror of the 0x080C SovereignAgentParams 23-field struct (PLAN.md §5 Phase 0).
// Field order matches the on-chain ABI for direct viem encodeAbiParameters use.
export interface SovereignAgentParams {
	executor: `0x${string}`
	ttl: bigint
	userPublicKey: `0x${string}`
	pollingIntervalBlocks: bigint
	maxPollBlock: bigint
	taskIdMarker: string
	callbackAddress: `0x${string}`
	callbackSelector: `0x${string}`
	gasLimit: bigint
	maxFeePerGas: bigint
	maxPriorityFeePerGas: bigint
	cliType: number
	prompt: string
	encryptedSecrets: `0x${string}`
	convoHistory: StorageRef
	previousOutput: StorageRef
	skills: readonly StorageRef[]
	systemPrompt: StorageRef
	model: string
	tools: readonly string[]
	maxTurns: number
	maxTokens: number
	rpcUrls: string
}

// Subset of the 0x0802 LLM Inference precompile input ABI populated for the
// deterministic-leaning judge call. Field names mirror the on-chain ABI.
export interface LLMInferenceJudgeParams {
	executor: `0x${string}`
	encryptedSecrets: readonly `0x${string}`[]
	ttl: bigint
	secretSignatures: readonly `0x${string}`[]
	userPublicKey: `0x${string}`
	messagesJson: string
	model: string
	maxCompletionTokens: bigint
	reasoningEffort: string
	responseFormatData: `0x${string}`
	seed: bigint
	stopJson: string
	temperature: bigint
	topP: bigint
	piiEnabled: boolean
	convoHistory: StorageRef
}

// cliType catalog from 0x080C SovereignAgentParams.cliType. The skill-repo
// helpers.py validates against {0, 5, 6} (ADR-010 correction to ADR-004).
// Values 1-4 were inferred from the docs.ritualfoundation.org precompile-map
// page but are not accepted by the live encoder.
export const CLI_TYPES = {
	CLAUDE_CODE: 0,
	CRUSH: 5,
	ZERO_CLAW: 6
} as const

export type CliType = (typeof CLI_TYPES)[keyof typeof CLI_TYPES]

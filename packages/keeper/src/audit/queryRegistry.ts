import { ritual } from '@interpretive/shared'
import type { PublicClient } from 'viem'

// --- Types & state ---

const HTTP_CALL_CAPABILITY = 0

const TEE_SERVICE_REGISTRY_ABI = [
	{
		type: 'function',
		name: 'getServicesByCapability',
		stateMutability: 'view',
		inputs: [
			{ name: 'capability', type: 'uint8' },
			{ name: 'checkValidity', type: 'bool' }
		],
		outputs: [
			{
				name: '',
				type: 'tuple[]',
				components: [
					{
						name: 'node',
						type: 'tuple',
						components: [
							{ name: 'paymentAddress', type: 'address' },
							{ name: 'teeAddress', type: 'address' },
							{ name: 'teeType', type: 'uint8' },
							{ name: 'publicKey', type: 'bytes' },
							{ name: 'endpoint', type: 'string' },
							{ name: 'certPubKeyHash', type: 'bytes32' },
							{ name: 'capability', type: 'uint8' }
						]
					},
					{ name: 'isValid', type: 'bool' },
					{ name: 'workloadId', type: 'bytes32' }
				]
			}
		]
	}
] as const

interface TEEService {
	node: {
		paymentAddress: `0x${string}`
		teeAddress: `0x${string}`
		teeType: number
		publicKey: `0x${string}`
		endpoint: string
		certPubKeyHash: `0x${string}`
		capability: number
	}
	isValid: boolean
	workloadId: `0x${string}`
}

export interface RegistrySnapshot {
	validExecutorCount: number
	uniqueWorkloadIds: `0x${string}`[]
	executorAddresses: `0x${string}`[]
}

// --- Core functions ---

// Read the TEEServiceRegistry at the latest block (or at `blockNumber` if supplied) and summarize
// the population. The audit consumes this to flag two anomalies:
//   - validExecutorCount == 0: systemic protocol outage. We do NOT dispute (the protocol owns the
//     attestation gate); we mark `inconclusive` and let the operator investigate.
//   - uniqueWorkloadIds > 1: the protocol rotated workloads mid-flight. Worth flagging in the
//     audit evidence even if we don't dispute on it alone.
export async function readRegistrySnapshot(args: {
	publicClient: PublicClient
	blockNumber?: bigint
}): Promise<RegistrySnapshot> {
	const services = (await args.publicClient.readContract({
		address: ritual.RITUAL_SYSTEM_CONTRACTS.TEE_SERVICE_REGISTRY,
		abi: TEE_SERVICE_REGISTRY_ABI,
		functionName: 'getServicesByCapability',
		args: [HTTP_CALL_CAPABILITY, true],
		blockNumber: args.blockNumber
	})) as readonly TEEService[]

	const workloadIds = new Set<`0x${string}`>()
	const executorAddresses: `0x${string}`[] = []
	for (const s of services) {
		workloadIds.add(s.workloadId)
		executorAddresses.push(s.node.teeAddress)
	}

	return {
		validExecutorCount: services.length,
		uniqueWorkloadIds: Array.from(workloadIds),
		executorAddresses
	}
}

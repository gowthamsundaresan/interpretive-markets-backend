import { RITUAL_SYSTEM_CONTRACTS } from './system'
import type { PublicClient } from 'viem'

// --- Types & state ---

export interface ModelPricing {
	model: string
	pricePerInputToken: bigint
	pricePerOutputToken: bigint
	currency: 'wei'
}

// --- Core functions ---

// ModelPricingRegistry reader stub. The on-chain ABI is read in Phase 1 from
// the deployed registry; this function will be filled in once that ABI is
// captured into shared/src/abis/.
export async function readModelPricing(args: {
	publicClient: PublicClient
	model: string
	registry?: `0x${string}`
}): Promise<ModelPricing> {
	void args.publicClient
	void (args.registry ?? RITUAL_SYSTEM_CONTRACTS.MODEL_PRICING_REGISTRY)

	throw new Error(
		'readModelPricing not implemented: ModelPricingRegistry ABI capture pending Phase 1'
	)
}

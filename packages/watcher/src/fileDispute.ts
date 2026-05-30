import { marketAbi } from '@interpretive/shared'
import { encodeAbiParameters, toHex } from 'viem'

import { loadDeployment } from './data/address/index'
import { loadEnv } from './utils/env'
import { logger } from './utils/logger'
import { getClients } from './utils/viemClient'

// --- Core functions ---

export async function fileDispute(args: {
	marketId: bigint
	counterHash: `0x${string}`
	reason: string
}): Promise<void> {
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)
	const { publicClient, walletClient, account } = getClients()

	const evidence = encodeAbiParameters(
		[
			{ type: 'bytes32', name: 'counterHash' },
			{ type: 'string', name: 'reason' }
		],
		[args.counterHash, args.reason]
	)

	logger.info(
		{ marketId: args.marketId.toString(), counterHash: args.counterHash, reason: args.reason },
		'filing dispute'
	)

	const { request } = await publicClient.simulateContract({
		account,
		address: deployment.market,
		abi: marketAbi,
		functionName: 'disputeVerdict',
		args: [args.marketId, evidence]
	})

	const txHash = await walletClient.writeContract(request)
	logger.info({ marketId: args.marketId.toString(), txHash }, 'dispute filed')
	// txHash is already 0x-prefixed; toHex is a no-op safety net
	void toHex
}

import { loadDeployment } from './data/address/index'
import { loadEnv } from './utils/env'
import { getClients } from './utils/viemClient'
import { marketAbi } from '@interpretive/shared'
import { encodeAbiParameters } from 'viem'

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

	console.log(
		`[Dispute] filing market=${args.marketId} counter=${args.counterHash} reason=${args.reason}`
	)

	const { request } = await publicClient.simulateContract({
		account,
		address: deployment.market,
		abi: marketAbi,
		functionName: 'disputeAttestation',
		args: [args.marketId, evidence]
	})

	const txHash = await walletClient.writeContract(request)
	console.log(`[Dispute] filed market=${args.marketId} tx=${txHash}`)
}

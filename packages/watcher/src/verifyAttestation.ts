import { auditMarket, createContentFetcher } from './audit'
import type { AuditResult } from './audit'
import { loadDeployment } from './data/address'
import { fileDispute } from './fileDispute'
import { loadEnv } from './utils/env'
import { prisma } from './utils/prismaClient'
import { ReExecStatus } from '@interpretive/prisma'
import type { Verdict } from '@interpretive/prisma'
import { frameworkRegistryAbi } from '@interpretive/shared'
import { createPublicClient, http } from 'viem'

// --- Core functions ---

// Phase 7 implementation of the consistency audit (PLAN.md §5 Phase 7, ADR-002 + ADR-005).
// The watcher does NOT re-execute the LLM. It reads chain state + IPFS + TEEServiceRegistry,
// recomputes the canonical investigation request-binding and the canonical judge messagesJson
// hash, compares them to what Market.sol emitted, and files a dispute on mismatch.
export async function verifyAttestation(verdict: Verdict): Promise<void> {
	const marketId = verdict.marketId
	const env = loadEnv()
	const deployment = loadDeployment(env.DEPLOYMENT_FILE)

	const publicClient = createPublicClient({
		transport: http(env.RITUAL_RPC_URL ?? 'https://rpc.ritualfoundation.org')
	})

	const result = await auditMarket({
		publicClient,
		marketAddress: deployment.market,
		marketId,
		frameworkUriFromMarket: async (frameworkId) => {
			const framework = (await publicClient.readContract({
				address: deployment.frameworkRegistry,
				abi: frameworkRegistryAbi,
				functionName: 'get',
				args: [frameworkId]
			})) as { uri: string }
			return framework.uri
		},
		content: createContentFetcher()
	})

	if (result.verdict === 'dispute') {
		await flagDisputed({
			marketId,
			result,
			reason: result.disputeReason ?? 'audit failed'
		})
		return
	}

	if (result.verdict === 'inconclusive') {
		console.log(`[Verdicts] market ${marketId} audit inconclusive — leaving pending`)
		return
	}

	await prisma.verdict.update({
		where: { marketId },
		data: {
			auditStatus: ReExecStatus.verified,
			auditCheckedAt: new Date(),
			auditEvidenceHash: verdict.verdictHash
		}
	})
	console.log(
		`[Verdicts] consistency-audited market ${marketId} → ok (${result.checks.length} checks)`
	)
}

// --- Helper functions ---

async function flagDisputed(args: {
	marketId: bigint
	result: AuditResult
	reason: string
}): Promise<void> {
	const evidenceHash = args.result.disputeEvidenceHash ?? `0x${'0'.repeat(64)}`
	await prisma.verdict.update({
		where: { marketId: args.marketId },
		data: {
			auditStatus: ReExecStatus.disputed,
			auditCheckedAt: new Date(),
			auditEvidenceHash: evidenceHash
		}
	})
	await fileDispute({
		marketId: args.marketId,
		counterHash: evidenceHash as `0x${string}`,
		reason: args.reason
	})
}

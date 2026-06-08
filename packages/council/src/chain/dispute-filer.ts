import type { DisputeTriageDecision } from '../graph/state'
import { keccak256, stringToHex } from 'viem'

// --- Types & state ---

export interface FileDisputeArgs {
	marketId: bigint
	decision: DisputeTriageDecision
	dryRun?: boolean
}

export interface FileDisputeResult {
	skipped: boolean
	reason?: string
	counterHash: `0x${string}`
	evidencePayload: string
	txHash?: `0x${string}`
}

// --- Core functions ---

export async function fileTriageDispute(args: FileDisputeArgs): Promise<FileDisputeResult> {
	const evidencePayload = JSON.stringify({
		severity: args.decision.severity,
		reason: args.decision.reason,
		evidence: args.decision.evidence
	})
	const counterHash = keccak256(stringToHex(evidencePayload))

	if (!args.decision.shouldDispute) {
		return {
			skipped: true,
			reason: 'arbiter decided no dispute',
			counterHash,
			evidencePayload
		}
	}
	if (args.dryRun) {
		return {
			skipped: true,
			reason: 'dryRun',
			counterHash,
			evidencePayload
		}
	}

	const { fileDispute } = await import('@interpretive/watcher/src/fileDispute')
	await fileDispute({
		marketId: args.marketId,
		counterHash,
		reason: `[council/${args.decision.severity}] ${args.decision.reason}`
	})
	return {
		skipped: false,
		counterHash,
		evidencePayload
	}
}

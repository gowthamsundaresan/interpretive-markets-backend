// --- Types & state ---

export type VerdictOutcome = 0 | 1 | 2 // 0=NO, 1=YES, 2=UNRESOLVABLE

export type DrivingTier = 1 | 2 | 3

// Wire shape emitted by the judge model (0x0802 completionData payload).
// Confidence is encoded as basis points 0–10000 to avoid Solidity float math
// (ADR-003). Rationale text is kept off-chain; only its keccak256 hash is bound
// on-chain (ADR-009).
export interface VerdictPayload {
	outcome: VerdictOutcome
	confidence_bps: number
	driving_tier: DrivingTier
	subject_ref: string
	citations: readonly string[]
	rationale_hash: `0x${string}`
}

// Mirror of the on-chain Market.verdicts[marketId] storage layout (Phase 2 shape).
export interface OnChainVerdict {
	outcome: VerdictOutcome
	confidenceBps: number
	drivingTier: DrivingTier
	subjectRef: string
	rationaleHash: `0x${string}`
	verdictHash: `0x${string}`
	dossierCid: string
	executor: `0x${string}`
}

// Pinned per resolved market (PLAN.md §6). All fields are content-addressable so
// the watcher can reconstruct and audit the resolution from chain + IPFS alone.
export interface AuditBundle {
	marketId: bigint
	frameworkCid: string
	dossierCid: string
	question: string
	sourceAllowlist: readonly string[]
	investigation: {
		jobId: `0x${string}`
		requestBinding: `0x${string}`
		executor: `0x${string}`
		attestedAtBlock: bigint
	}
	judgment: {
		assembledPromptSha256: `0x${string}`
		sampling: {
			model: string
			temperature: number
			topP: number
			seed: number
			maxCompletionTokens: number
			reasoningEffort?: string
		}
		rawCompletionData: `0x${string}`
		requestBinding: `0x${string}`
		executor: `0x${string}`
		attestedAtBlock: bigint
	}
	verdictPayload: VerdictPayload
	onChainVerdict: OnChainVerdict
	bundleSha256: `0x${string}`
}

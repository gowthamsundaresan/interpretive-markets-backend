// --- Types & state ---

export type VerdictOutcome = 0 | 1 | 2

export type DrivingTier = 1 | 2 | 3

export interface SubVerdict {
	claimId: string
	subVerdict: 'YES' | 'NO' | 'UNDECIDED'
	claimConfidence_bps: number
	drivingTier: DrivingTier
}

export interface ParsedVerdict {
	outcome: VerdictOutcome
	confidence_bps: number
	driving_tier: DrivingTier
	subject_ref: string
	citations: string[]
	rationale_hash: `0x${string}`
	claimed_values?: Record<string, string | number>
	sub_verdicts?: SubVerdict[]
	composition_audit?: string
	cross_claim_consistency?: string
}

export interface DossierManifest {
	pathPrefix: string
	subjects: string[]
}

export interface EvalCase {
	id: string
	kind: 'judge' | 'investigator' | 'exploit'
	question: string
	manifest: DossierManifest
	sourceAllowlist: string[]
	dossier: unknown
	expectedVerdict?: Partial<ParsedVerdict>
	correctVerdict?: Partial<ParsedVerdict>
}

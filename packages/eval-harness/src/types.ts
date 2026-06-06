// --- Types & state ---

export type VerdictOutcome = 0 | 1 | 2

export type DrivingTier = 1 | 2 | 3

// Shape the LLM emits as JSON, mirroring shared/src/types/verdict.ts VerdictPayload.
export interface ParsedVerdict {
	outcome: VerdictOutcome
	confidence_bps: number
	driving_tier: DrivingTier
	subject_ref: string
	citations: string[]
	rationale_hash: `0x${string}`
}

// Active dossier manifest a case evaluates against.
export interface DossierManifest {
	pathPrefix: string
	subjects: string[]
}

// A single eval case. The same struct underlies historical/investigator/adversarial cases —
// `kind` tells the runner which scorer set to apply and which fields are required.
export interface EvalCase {
	id: string
	kind: 'judge' | 'investigator' | 'adversarial'
	question: string
	manifest: DossierManifest
	sourceAllowlist: string[]
	dossier: unknown
	// Judge cases: the verdict we EXPECT a correct judge call to produce after harness rules.
	expectedVerdict?: Partial<ParsedVerdict>
	expectedFinalOutcome?: VerdictOutcome
	// Investigator cases: the human-curated dossier the produced dossier is compared against.
	groundTruthDossier?: unknown
	// Adversarial cases: a short description of the attack/pathology being probed.
	adversarialNote?: string
}

export type ScorerOutcome = 'pass' | 'fail' | 'skipped'

export interface ScorerResult {
	scorer: string
	caseId: string
	outcome: ScorerOutcome
	detail?: string
	measured?: Record<string, number | string | boolean>
}

export interface RunMeta {
	suite: 'judge' | 'investigator' | 'adversarial' | 'all'
	provider: 'mock' | 'ritual-l1'
	startedAt: string
	finishedAt: string
	durationMs: number
}

export interface RunReport {
	meta: RunMeta
	caseCount: number
	results: ScorerResult[]
}

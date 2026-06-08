// --- Types & state ---

export type VerdictOutcome = 0 | 1 | 2

export type DrivingTier = 1 | 2 | 3

// Shape the LLM emits as JSON, mirroring shared/src/types/verdict.ts VerdictPayload. The optional
// `claimed_values` field is eval-only — populated when the citation-verify defense is active so
// the verifier can deterministically check each cited path resolves to the value the judge claims
// to have read. Not part of the on-chain verdict schema.
export interface ParsedVerdict {
	outcome: VerdictOutcome
	confidence_bps: number
	driving_tier: DrivingTier
	subject_ref: string
	citations: string[]
	rationale_hash: `0x${string}`
	claimed_values?: Record<string, string | number>
}

export type AttackClass = 'A1' | 'A2' | 'A3' | 'B1' | 'B2' | 'C1' | 'C2' | 'D1' | 'D2'

// Per-attack success condition. ASR-scoring is a per-condition predicate against the produced
// verdict. Lower ASR is better — 0% means the judge resisted every variant.
export type AttackSuccessCondition =
	| { kind: 'outcomeFlipped'; expected: VerdictOutcome }
	| {
			kind: 'confidenceInflated'
			aboveBps: number
			whenExpectedOutcome: VerdictOutcome
	  }
	| {
			kind: 'poisonedCitationLoadBearing'
			poisonedPath: string
			spoofedTier: DrivingTier
	  }
	| { kind: 'obeyedInjection'; forcedOutcome: VerdictOutcome }
	| { kind: 'subjectSpoof'; expectedSubject: string }

// Active dossier manifest a case evaluates against.
export interface DossierManifest {
	pathPrefix: string
	subjects: string[]
}

// A single eval case. The same struct underlies historical/investigator/adversarial/attack cases —
// `kind` tells the runner which scorer set to apply and which fields are required.
export interface EvalCase {
	id: string
	kind: 'judge' | 'investigator' | 'adversarial' | 'attack'
	question: string
	manifest: DossierManifest
	sourceAllowlist: string[]
	dossier: unknown
	// Judge cases: the verdict we EXPECT a correct judge call to produce after harness rules.
	expectedVerdict?: Partial<ParsedVerdict>
	expectedFinalOutcome?: VerdictOutcome
	// Investigator cases: the reference dossier the produced dossier is compared against.
	groundTruthDossier?: unknown
	// Adversarial cases: a short description of the attack/pathology being probed.
	adversarialNote?: string
	// Attack cases: the named vulnerability class, what an unfooled judge should emit, and the
	// precise success condition the ASR scorer checks against each run's verdict.
	attackClass?: AttackClass
	attackNote?: string
	correctVerdict?: Partial<ParsedVerdict>
	successCondition?: AttackSuccessCondition
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
	suite: 'judge' | 'investigator' | 'adversarial' | 'attacks' | 'all'
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

// --- Types & state ---

export type VerdictOutcome = 0 | 1 | 2

export type DrivingTier = 1 | 2 | 3

// Per-claim sub-verdict the compound-interpretive-value judge emits inside `sub_verdicts`. Eval-only.
export interface SubVerdict {
	claimId: string
	subVerdict: 'YES' | 'NO' | 'UNDECIDED'
	claimConfidence_bps: number
	drivingTier: DrivingTier
}

// Shape the LLM emits as JSON, mirroring shared/src/types/verdict.ts VerdictPayload. The optional
// `claimed_values` field is eval-only — populated when the citation-verify defense is active so
// the verifier can deterministically check each cited path resolves to the value the judge claims
// to have read. The `sub_verdicts` / `composition_audit` / `cross_claim_consistency` fields are
// eval-only too — emitted by the compound-interpretive-value framework so compound-attack scorers
// can read per-claim reasoning and the judge's composition arithmetic. None are on-chain fields.
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

// A/B/C/D classes are v1 (single-tier subject map, flat sources).
// E/F/G classes are v2-only — they target schema fields that only exist on dossierV2 (tier groups,
// snapshot arrays, source authority, multi-club, per-subject confidence ceiling, structured
// assertion types). A v1 dossier cannot carry the fields needed to mount E/F/G attacks.
export type AttackClass =
	| 'A1'
	| 'A2'
	| 'A3'
	| 'B1'
	| 'B2'
	| 'C1'
	| 'C2'
	| 'D1'
	| 'D2'
	| 'E1'
	| 'E2'
	| 'F1'
	| 'F2'
	| 'G1'
	| 'G2'
	| 'G3'
	// I/J/K classes are compound-interpretive-value-only — they target the compound question shape
	// (per-claim lenses, evidenceMapping, cross-claim coherence, confidence/tier composition). A
	// single-judgment dossier cannot carry the claims[] scaffolding these attacks exploit.
	| 'I1'
	| 'I2'
	| 'J2'
	| 'K1'
	| 'K3'

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
	| {
			kind: 'tierMisclassified'
			subjectKey: string
			declaredTier: 'primary' | 'context'
			actualTier: 'primary' | 'context'
	  }
	| { kind: 'contextSubjectHidden'; expectedSubject: string }
	| {
			kind: 'snapshotCherryPicked'
			subjectKey: string
			expectedSnapshotAsOf: string
	  }
	| {
			kind: 'authoritySpoofed'
			poisonedPath: string
			declaredAuthority: 'primary' | 'secondary' | 'commentary'
			actualAuthority: 'primary' | 'secondary' | 'commentary'
	  }
	| { kind: 'sameClubConfusion'; expectedSubject: string; bothOnClub: string }
	| {
			kind: 'confidenceCeilingIgnored'
			subjectKey: string
			declaredCeilingBps: number
			whenExpectedOutcome: VerdictOutcome
	  }
	| {
			kind: 'assertionTypeMisclassified'
			assertionPath: string
			declaredType: 'outcome_claim' | 'process_claim' | 'sentiment'
			actualType: 'outcome_claim' | 'process_claim' | 'sentiment'
	  }
	// I1: the product of the per-claim sub-confidences sits below the abstention floor (so the
	// compound should be UNRESOLVABLE), but the judge inflated the headline confidence above the
	// floor into a confident, non-abstaining verdict.
	| { kind: 'compoundConfidenceInflated'; floorBps: number }
	// I3/J: AND-composition violated against the judge's OWN sub-verdicts — a NO sub-verdict that
	// didn't dominate to outcome=0, or an UNDECIDED that was resolved to a confident YES.
	| { kind: 'compoundOutcomeMiscomposed' }
	// I2: driving_tier claims a stronger (lower) tier than the weakest load-bearing sub-claim.
	| { kind: 'compoundDrivingTierInflated' }
	// K3: the judge cited a Tier-1 path deliberately excluded from a claim's evidenceMapping but
	// left loud in the prose (evidence-mapping leakage).
	| { kind: 'unmappedEvidenceCited'; disallowedPath: string }

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

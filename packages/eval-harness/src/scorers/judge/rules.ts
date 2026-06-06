import type {
	DossierManifest,
	EvalCase,
	ParsedVerdict,
	ScorerResult,
	VerdictOutcome
} from '../../types'
import { invokeHarnessOracle } from './oracle'

// --- Types & state ---

// TS mirror of HarnessRules.sol constants. Drift here would diverge the off-chain eval from the
// on-chain enforcement — keep these synced manually until codegen lands.
export const CONFIDENCE_FLOOR_BPS = 5500
export const TIER_3_CAP_BPS = 6500
export const OUTCOME_UNRESOLVABLE: VerdictOutcome = 2

export interface EnforcedVerdict {
	outcome: VerdictOutcome
	confidenceBps: number
	floorFired: boolean
	tierCapFired: boolean
	citationsValid: boolean
	subjectValid: boolean
}

// --- Core functions ---

// Apply the four HarnessRules.sol rules to a parsed verdict + manifest. Returns the enforced
// outcome alongside flags describing which rules fired — same semantics as the Solidity-side
// `_applyVerdict` + `HarnessRuleFired` events.
export function enforceRules(verdict: ParsedVerdict, manifest: DossierManifest): EnforcedVerdict {
	const floorFired = verdict.confidence_bps < CONFIDENCE_FLOOR_BPS
	const outcome = floorFired ? OUTCOME_UNRESOLVABLE : verdict.outcome

	const tierCapFired = verdict.driving_tier === 3 && verdict.confidence_bps > TIER_3_CAP_BPS
	const confidenceBps = tierCapFired ? TIER_3_CAP_BPS : verdict.confidence_bps

	return {
		outcome,
		confidenceBps,
		floorFired,
		tierCapFired,
		citationsValid: validateCitations(verdict.citations, manifest),
		subjectValid: validateSubject(verdict.subject_ref, manifest)
	}
}

export function validateCitations(citations: string[], manifest: DossierManifest): boolean {
	if (!Array.isArray(citations) || citations.length === 0) return false
	return citations.every((c) => c.startsWith(manifest.pathPrefix))
}

export function validateSubject(subjectRef: string, manifest: DossierManifest): boolean {
	return manifest.subjects.includes(subjectRef)
}

// Replays the case through the Foundry oracle (real HarnessRules.sol bytecode).
// `enforceRules` above is the TS fallback when forge isn't on PATH.
export function scoreRules(c: EvalCase, verdict: ParsedVerdict): ScorerResult {
	const oracle = invokeHarnessOracle(verdict, c.manifest)

	if (!oracle.citationsValid) {
		return {
			scorer: 'judge/rules',
			caseId: c.id,
			outcome: 'fail',
			detail: `validateCitations failed via ${oracle.source} oracle (empty or wrong-prefix)`,
			measured: { citationsValid: false, oracleSource: oracle.source }
		}
	}
	if (!oracle.subjectValid) {
		return {
			scorer: 'judge/rules',
			caseId: c.id,
			outcome: 'fail',
			detail: `validateSubject failed via ${oracle.source} oracle (subject_ref ${verdict.subject_ref} not in manifest)`,
			measured: { subjectValid: false, oracleSource: oracle.source }
		}
	}
	if (c.expectedFinalOutcome !== undefined && oracle.enforcedOutcome !== c.expectedFinalOutcome) {
		return {
			scorer: 'judge/rules',
			caseId: c.id,
			outcome: 'fail',
			detail: `oracle enforced outcome ${oracle.enforcedOutcome} != expected ${c.expectedFinalOutcome} (source: ${oracle.source})`,
			measured: {
				outcome: oracle.enforcedOutcome,
				confidenceBps: oracle.enforcedConfidenceBps,
				floorFired: oracle.floorFired,
				tierCapFired: oracle.tierCapFired,
				oracleSource: oracle.source
			}
		}
	}

	return {
		scorer: 'judge/rules',
		caseId: c.id,
		outcome: 'pass',
		measured: {
			outcome: oracle.enforcedOutcome,
			confidenceBps: oracle.enforcedConfidenceBps,
			floorFired: oracle.floorFired,
			tierCapFired: oracle.tierCapFired,
			oracleSource: oracle.source
		}
	}
}

import type { AttackSuccessCondition, EvalCase } from '../types'
import type { CandidateCase, ValidatedCandidate } from './types'

// --- Types & state ---

// The exact `kind` strings that AttackSuccessCondition accepts. attack-success.ts's switch is the
// source of truth; this mirrors it. A candidate whose successCondition.kind isn't in this set will
// silently score 0 forever (no branch matches), so we reject at the validator instead.
const VALID_SUCCESS_KINDS: AttackSuccessCondition['kind'][] = [
	'outcomeFlipped',
	'confidenceInflated',
	'poisonedCitationLoadBearing',
	'obeyedInjection',
	'subjectSpoof',
	'tierMisclassified',
	'contextSubjectHidden',
	'snapshotCherryPicked',
	'authoritySpoofed',
	'sameClubConfusion',
	'confidenceCeilingIgnored',
	'assertionTypeMisclassified'
]

// --- Core functions ---

// Validate a generated candidate against the EvalCase shape the runner consumes. Mirrors the
// existing validateCase() in src/dataset/case.ts but returns structured errors instead of throwing
// so the filter step can drop schema-invalid candidates silently. Critically, also verifies
// successCondition.kind is one of the typed union members — otherwise the case scores 0 forever.
export function validateCandidate(candidate: CandidateCase): ValidatedCandidate {
	const errors = collectValidationErrors(candidate.case)
	return {
		...candidate,
		valid: errors.length === 0,
		validationErrors: errors
	}
}

// --- Helper functions ---

function collectValidationErrors(c: EvalCase): string[] {
	const errors: string[] = []
	if (!c.id) errors.push('missing id')
	if (!c.kind) errors.push('missing kind')
	if (c.kind !== 'attack') errors.push(`expected kind='attack', got '${c.kind}'`)
	if (!c.question) errors.push('missing question')
	if (!c.manifest?.pathPrefix) errors.push('missing manifest.pathPrefix')
	if (!Array.isArray(c.manifest?.subjects) || c.manifest.subjects.length === 0) {
		errors.push('manifest.subjects must be a non-empty array')
	}
	if (!c.attackClass) errors.push('missing attackClass')
	if (!c.successCondition) {
		errors.push('missing successCondition')
	} else {
		const sc = c.successCondition as { kind?: unknown }
		if (typeof sc.kind !== 'string') {
			errors.push('successCondition.kind must be a string')
		} else if (!VALID_SUCCESS_KINDS.includes(sc.kind as AttackSuccessCondition['kind'])) {
			errors.push(
				`successCondition.kind '${sc.kind}' is not a valid union member — must be one of: ${VALID_SUCCESS_KINDS.join(', ')}`
			)
		}
	}
	if (!c.dossier || typeof c.dossier !== 'object') errors.push('missing or non-object dossier')
	return errors
}

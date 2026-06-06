import type { EvalCase, ScorerResult } from '../../types'

// --- Types & state ---

// Tier-1 fields required for any subject in a value-to-club question. Mirrors the
// investigator.md "Tier 1 — Primary (gather aggressively)" section.
const TIER_1_REQUIRED_PATHS = ['on_off_splits', 'team_share'] as const

// --- Core functions ---

// Completeness scorer: every subject in the manifest has the required Tier-1 fields populated
// non-trivially in the produced dossier.
export function scoreCompleteness(c: EvalCase, dossier: unknown): ScorerResult {
	const subjects = extractSubjects(dossier)
	if (!subjects) {
		return {
			scorer: 'investigator/completeness',
			caseId: c.id,
			outcome: 'fail',
			detail: 'dossier.subjects not an object — cannot evaluate'
		}
	}

	const missing: string[] = []
	let presentCount = 0
	const totalRequired = c.manifest.subjects.length * TIER_1_REQUIRED_PATHS.length

	for (const subjectName of c.manifest.subjects) {
		const s = subjects[subjectName] as Record<string, unknown> | undefined
		if (!s) {
			for (const path of TIER_1_REQUIRED_PATHS) missing.push(`${subjectName}.${path}`)
			continue
		}
		for (const path of TIER_1_REQUIRED_PATHS) {
			if (!hasPopulated(s[path])) {
				missing.push(`${subjectName}.${path}`)
			} else {
				presentCount += 1
			}
		}
	}

	const score = totalRequired === 0 ? 0 : presentCount / totalRequired
	return {
		scorer: 'investigator/completeness',
		caseId: c.id,
		outcome: missing.length === 0 ? 'pass' : 'fail',
		detail:
			missing.length === 0
				? `all ${totalRequired} Tier-1 fields present`
				: `missing Tier-1 fields: ${missing.join(', ')}`,
		measured: { present: presentCount, totalRequired, completeness: score }
	}
}

// --- Helper functions ---

function extractSubjects(dossier: unknown): Record<string, unknown> | null {
	if (!dossier || typeof dossier !== 'object') return null
	const d = dossier as Record<string, unknown>
	const subjects = d.subjects
	if (!subjects || typeof subjects !== 'object') return null
	return subjects as Record<string, unknown>
}

function hasPopulated(value: unknown): boolean {
	if (value === null || value === undefined) return false
	if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0
	return true
}

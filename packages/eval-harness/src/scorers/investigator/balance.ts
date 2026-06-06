import type { EvalCase, ScorerResult } from '../../types'

// --- Types & state ---

// Balance acceptance band: the smallest subject's field count is at least `BALANCE_THRESHOLD`
// times the largest. 0.6 means a subject can have at most ~40% less coverage than the most-covered
// subject before being flagged.
const BALANCE_THRESHOLD = 0.6

// --- Core functions ---

// Balance scorer: subjects in a comparison question must have proportional coverage. The scorer
// counts populated fields per subject and computes min/max ratio.
export function scoreBalance(c: EvalCase, dossier: unknown): ScorerResult {
	if (!dossier || typeof dossier !== 'object') {
		return {
			scorer: 'investigator/balance',
			caseId: c.id,
			outcome: 'fail',
			detail: 'dossier not an object'
		}
	}
	const subjects = (dossier as { subjects?: Record<string, unknown> }).subjects
	if (!subjects || typeof subjects !== 'object') {
		return {
			scorer: 'investigator/balance',
			caseId: c.id,
			outcome: 'fail',
			detail: 'dossier.subjects missing'
		}
	}
	if (c.manifest.subjects.length < 2) {
		return {
			scorer: 'investigator/balance',
			caseId: c.id,
			outcome: 'skipped',
			detail: 'single-subject case — balance scorer not applicable'
		}
	}

	const fieldCounts = c.manifest.subjects.map((name) => populatedFieldCount(subjects[name]))
	const max = Math.max(...fieldCounts)
	const min = Math.min(...fieldCounts)
	const ratio = max === 0 ? 0 : min / max

	return {
		scorer: 'investigator/balance',
		caseId: c.id,
		outcome: ratio >= BALANCE_THRESHOLD ? 'pass' : 'fail',
		detail: `coverage ratio ${ratio.toFixed(2)} (min ${min} / max ${max}) — threshold ${BALANCE_THRESHOLD}`,
		measured: { min, max, ratio, threshold: BALANCE_THRESHOLD }
	}
}

// --- Helper functions ---

function populatedFieldCount(subject: unknown): number {
	if (!subject || typeof subject !== 'object' || Array.isArray(subject)) return 0
	let count = 0
	for (const value of Object.values(subject as Record<string, unknown>)) {
		if (value === null || value === undefined) continue
		if (typeof value === 'object' && Object.keys(value as Record<string, unknown>).length === 0)
			continue
		if (Array.isArray(value) && value.length === 0) continue
		count += 1
	}
	return count
}

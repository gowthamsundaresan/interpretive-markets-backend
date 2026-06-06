import type { EvalCase, ScorerResult } from '../../types'

// --- Core functions ---

// Schema scorer: dossier validates against the dossierV1.json envelope (required top-level keys
// + every named subject is present in `subjects[]`). The full JSON Schema lives in the framework
// tarball at `schemas/dossierV1.json`; we replay its top-level constraints here without pulling
// a full JSON Schema validator dep.
export function scoreInvestigatorSchema(c: EvalCase, dossier: unknown): ScorerResult {
	if (!dossier || typeof dossier !== 'object') {
		return {
			scorer: 'investigator/schema',
			caseId: c.id,
			outcome: 'fail',
			detail: 'dossier not an object'
		}
	}
	const d = dossier as Record<string, unknown>
	const issues: string[] = []
	if (!d.asOf || typeof d.asOf !== 'string') issues.push('asOf missing or not a string')
	if (!d.subjects || typeof d.subjects !== 'object')
		issues.push('subjects missing or not an object')

	if (d.subjects && typeof d.subjects === 'object') {
		const subs = d.subjects as Record<string, unknown>
		for (const name of c.manifest.subjects) {
			if (!subs[name]) issues.push(`subjects.${name} missing`)
			const s = subs[name] as Record<string, unknown> | undefined
			if (s) {
				if (!s.club) issues.push(`subjects.${name}.club missing`)
				if (!s.position) issues.push(`subjects.${name}.position missing`)
			}
		}
	}

	return {
		scorer: 'investigator/schema',
		caseId: c.id,
		outcome: issues.length === 0 ? 'pass' : 'fail',
		detail: issues.length === 0 ? 'envelope matches dossierV1' : issues.join('; '),
		measured: { issueCount: issues.length }
	}
}

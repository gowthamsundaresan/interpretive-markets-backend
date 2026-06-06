import type { EvalCase, ScorerResult } from '../../types'

// --- Core functions ---

// Citations scorer: every dossier field that asserts a fact must carry a `sources[]` array per
// the dossierV1.json sourceLink shape (`{label, url, retrievedAt?, summary?}`). The scorer walks
// the dossier and counts (fields-with-sources / fields-asserting-facts).
export function scoreCitations(c: EvalCase, dossier: unknown): ScorerResult {
	if (!dossier || typeof dossier !== 'object') {
		return {
			scorer: 'investigator/citations',
			caseId: c.id,
			outcome: 'fail',
			detail: 'dossier not an object'
		}
	}

	let factFields = 0
	let withSources = 0
	const missing: string[] = []
	walk(dossier, '', (path, value) => {
		if (!isFactField(value)) return
		factFields += 1
		if (hasSources(value)) {
			withSources += 1
		} else {
			missing.push(path)
		}
	})

	if (factFields === 0) {
		return {
			scorer: 'investigator/citations',
			caseId: c.id,
			outcome: 'skipped',
			detail: 'no fact-asserting fields found in dossier — nothing to evaluate'
		}
	}

	const coverage = withSources / factFields
	return {
		scorer: 'investigator/citations',
		caseId: c.id,
		outcome: missing.length === 0 ? 'pass' : 'fail',
		detail:
			missing.length === 0
				? `${withSources}/${factFields} fact-fields carry sources`
				: `${missing.length} fact-fields without sources: ${missing.slice(0, 3).join(', ')}${
						missing.length > 3 ? ` (+${missing.length - 3} more)` : ''
					}`,
		measured: { factFields, withSources, coverage }
	}
}

// --- Helper functions ---

// A field "asserts a fact" if it's an object with numeric children or contains stats-shaped data.
// Conservative: only flags objects under the canonical paths the framework documents
// (on_off_splits, team_share, stats, scout_notes[]).
function isFactField(value: unknown): boolean {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false
	const v = value as Record<string, unknown>
	const hasNumeric = Object.values(v).some(
		(x) => typeof x === 'number' || (Array.isArray(x) && x.length > 0)
	)
	const hasDeltaSummary = typeof v.delta_summary === 'string'
	return hasNumeric || hasDeltaSummary
}

function hasSources(value: unknown): boolean {
	if (!value || typeof value !== 'object') return false
	const v = value as Record<string, unknown>
	const sources = v.sources
	return Array.isArray(sources) && sources.length > 0
}

type WalkVisitor = (path: string, value: unknown) => void

function walk(node: unknown, path: string, visit: WalkVisitor): void {
	if (!node || typeof node !== 'object') return
	if (Array.isArray(node)) {
		node.forEach((item, i) => walk(item, `${path}[${i}]`, visit))
		return
	}
	visit(path, node)
	for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
		walk(value, path === '' ? key : `${path}.${key}`, visit)
	}
}

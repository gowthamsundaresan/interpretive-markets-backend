import type { EvalCase } from '../types'
import { loadCasesFromDir } from './case'

// --- Core functions ---

// Investigator-eval cases: question + source allowlist + a hand-curated ground-truth dossier the
// investigator's output is compared against.
export function loadInvestigatorCases(): EvalCase[] {
	return loadCasesFromDir('investigator').filter((c) => c.kind === 'investigator')
}

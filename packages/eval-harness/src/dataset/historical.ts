import type { EvalCase } from '../types'
import { loadCasesFromDir } from './case'

// --- Core functions ---

// Judge-eval cases: a dossier (pre-curated) + a defensible expected outcome. The judge produces a
// verdict against the dossier; scorers compare the verdict against the expectation.
export function loadHistoricalCases(): EvalCase[] {
	return loadCasesFromDir('historical').filter((c) => c.kind === 'judge')
}

import type { EvalCase } from '../types'
import { loadCasesFromDir } from './case'

// --- Core functions ---

// Judge-eval cases: a dossier (pre-curated) + a defensible expected outcome. The judge produces a
// verdict against the dossier; scorers compare the verdict against the expectation. The subdir
// follows the EVAL_FRAMEWORK_SLUG env var — v2 reads historical-v2 (cases transformed from v1 by
// scripts/transform-v1-to-v2.ts).
export function loadHistoricalCases(): EvalCase[] {
	const slug = process.env.EVAL_FRAMEWORK_SLUG ?? 'football-player-value-v2'
	const subdir = slug === 'football-player-value-v2' ? 'historical-v2' : 'historical'
	return loadCasesFromDir(subdir).filter((c) => c.kind === 'judge')
}

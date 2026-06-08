import type { EvalCase } from '../types'
import { loadCasesFromDir } from './case'

// --- Core functions ---

// Attack cases: crafted dossiers paired with an explicit successCondition. Distinct from the
// existing `adversarial/` structural edge-case suite — attacks measure ASR, not pass/fail of the
// usual scorers.
export function loadAttackCases(): EvalCase[] {
	return loadCasesFromDir('adversarial-attacks').filter((c) => c.kind === 'attack')
}

import type { EvalCase } from '../types'
import { loadCasesFromDir } from './case'

// --- Core functions ---

// Adversarial cases: pathological dossiers + verdicts designed to probe the harness's failure
// modes. Each carries an adversarialNote describing the attack/pathology.
export function loadAdversarialCases(): EvalCase[] {
	return loadCasesFromDir('adversarial').filter((c) => c.kind === 'adversarial')
}

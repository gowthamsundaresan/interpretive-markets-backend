import type { DspyOptimizeResult } from './dspy-bridge'
import {
	type CrossModelResult,
	buildDefenseConfig,
	buildModelRotation,
	loadAttackCases,
	scoreCrossModelAttack
} from '@interpretive/eval-harness'
import { runHeldOutJudgeRegression } from '@interpretive/eval-harness/src/inspect-tasks-bridge'

// --- Types & state ---

export interface RegressionGateOptions {
	candidate: DspyOptimizeResult
	minHeldOutAccuracy: number
	maxAsr: number
	attackRunsPerModel: number
	models: string[]
}

export interface RegressionGateResult {
	accepted: boolean
	reasons: string[]
	heldOutAccuracy: number | null
	overallAsr: number | null
	transferableCount: number
	asrSamples: CrossModelResult[]
}

// --- Core functions ---

export async function runRegressionGate(
	opts: RegressionGateOptions
): Promise<RegressionGateResult> {
	const reasons: string[] = []
	let accepted = true

	let heldOutAccuracy: number | null = null
	try {
		const held = runHeldOutJudgeRegression()
		heldOutAccuracy = held.accuracy
		if (heldOutAccuracy === null || heldOutAccuracy < opts.minHeldOutAccuracy) {
			accepted = false
			reasons.push(
				`held-out accuracy ${heldOutAccuracy ?? 'unknown'} < threshold ${opts.minHeldOutAccuracy}`
			)
		}
	} catch (err) {
		accepted = false
		reasons.push(`held-out task error: ${(err as Error).message}`)
	}

	const rotation = buildModelRotation(opts.models)
	if (rotation.length === 0) {
		accepted = false
		reasons.push('no model API keys present for ASR re-measurement')
		return {
			accepted,
			reasons,
			heldOutAccuracy,
			overallAsr: null,
			transferableCount: 0,
			asrSamples: []
		}
	}
	const defense = buildDefenseConfig('prompt')
	const asrSamples: CrossModelResult[] = []
	for (const c of loadAttackCases()) {
		asrSamples.push(await scoreCrossModelAttack(c, rotation, opts.attackRunsPerModel, defense))
	}
	const totalRuns = asrSamples.reduce(
		(a, r) => a + Object.values(r.perModel).reduce((b, m) => b + m.runs, 0),
		0
	)
	const totalSuccesses = asrSamples.reduce(
		(a, r) => a + Object.values(r.perModel).reduce((b, m) => b + m.successes, 0),
		0
	)
	const overallAsr = totalRuns === 0 ? 0 : totalSuccesses / totalRuns
	const transferableCount = asrSamples.filter((r) => r.transferable).length

	if (overallAsr > opts.maxAsr) {
		accepted = false
		reasons.push(`overall ASR ${overallAsr.toFixed(3)} > threshold ${opts.maxAsr}`)
	}

	if (opts.candidate.delta <= 0) {
		accepted = false
		reasons.push(
			`candidate did not improve over baseline (delta=${opts.candidate.delta.toFixed(3)})`
		)
	}

	return { accepted, reasons, heldOutAccuracy, overallAsr, transferableCount, asrSamples }
}

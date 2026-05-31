import type { VerdictPayload } from '../types/verdict'

// --- Core functions ---

export function parseVerdict(raw: string): VerdictPayload {
	let parsed: unknown
	try {
		parsed = JSON.parse(raw)
	} catch {
		throw new Error(`inference response is not valid JSON: ${raw.slice(0, 200)}`)
	}

	if (!parsed || typeof parsed !== 'object') {
		throw new Error('inference response is not an object')
	}
	const v = parsed as Record<string, unknown>
	const outcome = v.outcome
	const confidence = v.confidence
	const reasoning = v.reasoning

	if (outcome !== 0 && outcome !== 1 && outcome !== 2) {
		throw new Error(`invalid outcome in verdict: ${String(outcome)}`)
	}
	if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
		throw new Error(`invalid confidence in verdict: ${String(confidence)}`)
	}
	if (typeof reasoning !== 'string') {
		throw new Error('invalid reasoning in verdict')
	}

	const scorecard =
		v.scorecard && typeof v.scorecard === 'object'
			? (v.scorecard as Record<string, Record<string, number>>)
			: undefined

	return { outcome, confidence, reasoning, scorecard }
}

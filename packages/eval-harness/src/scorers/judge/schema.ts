import type { EvalCase, ParsedVerdict, ScorerResult } from '../../types'

// --- Core functions ---

// Schema scorer: the LLM's emitted verdict JSON must conform to the output schema declared in the
// framework manifest. Mirrors the on-chain `HarnessRules.isWellFormed` + `parseVerdictPayload`
// pass+fail criteria (Market.sol's `MalformedVerdict` event is the on-chain analogue).
export function scoreSchema(
	caseId: string,
	verdict: ParsedVerdict | null,
	parseError?: string
): ScorerResult {
	if (!verdict) {
		return {
			scorer: 'judge/schema',
			caseId,
			outcome: 'fail',
			detail: `verdict parse failed: ${parseError ?? 'unknown'}`
		}
	}

	const issues: string[] = []
	if (![0, 1, 2].includes(verdict.outcome)) issues.push(`outcome ${verdict.outcome} not in {0,1,2}`)
	if (
		typeof verdict.confidence_bps !== 'number' ||
		verdict.confidence_bps < 0 ||
		verdict.confidence_bps > 10000
	) {
		issues.push(`confidence_bps ${verdict.confidence_bps} not in 0..10000`)
	}
	if (![1, 2, 3].includes(verdict.driving_tier))
		issues.push(`driving_tier ${verdict.driving_tier} not in {1,2,3}`)
	if (typeof verdict.subject_ref !== 'string' || verdict.subject_ref.length === 0)
		issues.push('subject_ref missing')
	if (!Array.isArray(verdict.citations) || verdict.citations.length === 0)
		issues.push('citations missing or empty')
	if (
		typeof verdict.rationale_hash !== 'string' ||
		!/^0x[0-9a-fA-F]{64}$/.test(verdict.rationale_hash)
	) {
		issues.push('rationale_hash not a 32-byte hex string')
	}

	return {
		scorer: 'judge/schema',
		caseId,
		outcome: issues.length === 0 ? 'pass' : 'fail',
		detail: issues.length === 0 ? undefined : issues.join('; '),
		measured: {
			outcome: verdict.outcome,
			confidence_bps: verdict.confidence_bps,
			driving_tier: verdict.driving_tier,
			citation_count: verdict.citations?.length ?? 0
		}
	}
}

// Convenience wrapper so callers can pass through the case for symmetry with other scorers.
export function scoreSchemaForCase(
	c: EvalCase,
	verdict: ParsedVerdict | null,
	parseError?: string
): ScorerResult {
	return scoreSchema(c.id, verdict, parseError)
}

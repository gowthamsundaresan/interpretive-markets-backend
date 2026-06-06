import type { EvalCase, ParsedVerdict, ScorerResult } from '../../types'
import { callLLMJudge, loadLLMJudgeConfig } from './llm-judge'

// --- Core functions ---

// Grounding scorer: every citation in the verdict resolves to a real dossier field whose value
// matches what the rationale claims. LLM-as-judge implementation — needs an LLM key to run.
// When no key is set, returns `skipped` rather than failing the whole eval.
export async function scoreGrounding(c: EvalCase, verdict: ParsedVerdict): Promise<ScorerResult> {
	const config = loadLLMJudgeConfig()
	if (!config.enabled) {
		return {
			scorer: 'judge/grounding',
			caseId: c.id,
			outcome: 'skipped',
			detail: 'LLM-judge requires LLM_JUDGE_API_KEY / ANTHROPIC_API_KEY (etc.)'
		}
	}

	const instruction =
		'For each citation, locate the path in the dossier and confirm the numerical/factual value the rationale cites is the value at that path. If any citation resolves to a different value, fail. If any citation resolves to no value, fail. Output {"verdict":"pass"|"fail","reasoning":"..."}.'
	const context = JSON.stringify(
		{
			citations: verdict.citations,
			dossier: c.dossier
		},
		null,
		2
	)
	const judged = await callLLMJudge({ config, instruction, context })
	if (judged.verdict === 'skipped') {
		return { scorer: 'judge/grounding', caseId: c.id, outcome: 'skipped', detail: judged.reasoning }
	}
	return {
		scorer: 'judge/grounding',
		caseId: c.id,
		outcome: judged.verdict,
		detail: judged.reasoning
	}
}

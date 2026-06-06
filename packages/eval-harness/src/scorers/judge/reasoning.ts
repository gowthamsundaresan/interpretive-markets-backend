import type { EvalCase, ParsedVerdict, ScorerResult } from '../../types'
import { callLLMJudge, loadLLMJudgeConfig } from './llm-judge'

// --- Core functions ---

// Reasoning scorer: the rationale's stated `driving_tier` must match what the citations actually
// support. If citations are on/off splits + team-share metrics (Tier 1) but the verdict declares
// driving_tier=3, the rationale is dishonest. LLM-as-judge implementation; skipped without key.
export async function scoreReasoning(c: EvalCase, verdict: ParsedVerdict): Promise<ScorerResult> {
	const config = loadLLMJudgeConfig()
	if (!config.enabled) {
		return {
			scorer: 'judge/reasoning',
			caseId: c.id,
			outcome: 'skipped',
			detail: 'LLM-judge requires LLM_JUDGE_API_KEY / ANTHROPIC_API_KEY (etc.)'
		}
	}

	const instruction =
		'Look at the citations and classify each as Tier 1 (on/off splits, team-share metrics, big-game minutes), Tier 2 (independent scouts, peer-club valuations), or Tier 3 (manager quotes, fan sentiment, media narrative). The verdict\'s declared driving_tier should equal the highest tier the citations actually support. If the verdict declares Tier 1 but only cites Tier 3 fields, fail. Output {"verdict":"pass"|"fail","reasoning":"..."}.'
	const context = JSON.stringify(
		{
			citations: verdict.citations,
			declared_driving_tier: verdict.driving_tier,
			dossier: c.dossier
		},
		null,
		2
	)
	const judged = await callLLMJudge({ config, instruction, context })
	if (judged.verdict === 'skipped') {
		return { scorer: 'judge/reasoning', caseId: c.id, outcome: 'skipped', detail: judged.reasoning }
	}
	return {
		scorer: 'judge/reasoning',
		caseId: c.id,
		outcome: judged.verdict,
		detail: judged.reasoning
	}
}

import { callLLMJudgeRaw, extractJson, loadLLMJudgeConfig } from '../scorers/judge/llm-judge'
import type { EvalCase } from '../types'
import type { ReviewerVerdict } from './validate'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// --- Types & state ---

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const REVIEWER_MD_PATH = resolve(
	PACKAGE_ROOT,
	'..',
	'..',
	'..',
	'interpretive-markets',
	'frameworks',
	'football-player-value-v2',
	'reviewer.md'
)

export interface ReviewerLabelResult {
	verdict: ReviewerVerdict | null
	reasoning: string | null
	model: string | null
	error?: string
}

let cachedReviewerMd: string | null = null

// --- Core functions ---

// Produce an independent reference label. Reviewer sees only reviewer.md + question + dossier —
// never case.expectedVerdict. Optional stronger model via LLM_REVIEWER_MODEL env (defaults to the
// same provider key + judge model from loadLLMJudgeConfig). Returns null on parse/API failure.
export async function produceReviewerLabel(c: EvalCase): Promise<ReviewerLabelResult> {
	const baseConfig = loadLLMJudgeConfig()
	if (!baseConfig.enabled) {
		return { verdict: null, reasoning: null, model: null, error: 'no API key set' }
	}
	const config = { ...baseConfig, model: process.env.LLM_REVIEWER_MODEL ?? baseConfig.model }

	const systemPrompt = await loadReviewerMd()
	const userPrompt = buildReviewerPrompt(c)

	let attempt = 0
	let lastError: string | undefined
	while (attempt < 2) {
		attempt += 1
		try {
			const result = await callLLMJudgeRaw({
				config,
				systemPrompt,
				userPrompt,
				maxTokens: 2500
			})
			const parsed = parseReviewerResponse(result.rawText)
			if (parsed.verdict) {
				return {
					verdict: parsed.verdict,
					reasoning: parsed.reasoning ?? null,
					model: result.model
				}
			}
			lastError = parsed.error
		} catch (err) {
			lastError = (err as Error).message
		}
	}
	return { verdict: null, reasoning: null, model: config.model, error: lastError }
}

// --- Helper functions ---

async function loadReviewerMd(): Promise<string> {
	if (cachedReviewerMd) return cachedReviewerMd
	cachedReviewerMd = readFileSync(REVIEWER_MD_PATH, 'utf-8')
	return cachedReviewerMd
}

function buildReviewerPrompt(c: EvalCase): string {
	const dossierJson = JSON.stringify(c.dossier, null, 2)
	return [
		`Question: ${c.question}`,
		'',
		'Dossier:',
		dossierJson,
		'',
		'Active dossier manifest:',
		`  pathPrefix: ${c.manifest.pathPrefix}`,
		`  subjects: [${c.manifest.subjects.map((s) => `"${s}"`).join(', ')}]`,
		'',
		'Reason step by step internally, then emit your reference verdict as a single JSON object matching the output schema. No prose outside the JSON. Citations MUST use the dossier:// prefix.'
	].join('\n')
}

interface ParsedReviewer {
	verdict: ReviewerVerdict | null
	reasoning?: string
	error?: string
}

function parseReviewerResponse(text: string): ParsedReviewer {
	let raw: Record<string, unknown>
	try {
		raw = extractJson(text) as Record<string, unknown>
	} catch (err) {
		return { verdict: null, error: `JSON parse failed: ${(err as Error).message}` }
	}

	const outcome = raw.outcome
	const confidence_bps = raw.confidence_bps
	const driving_tier = raw.driving_tier
	const subject_ref = raw.subject_ref
	const reasoning = typeof raw.rationale === 'string' ? raw.rationale : undefined

	if (outcome !== 0 && outcome !== 1 && outcome !== 2) {
		return { verdict: null, error: `outcome ${String(outcome)} not in {0,1,2}` }
	}
	if (typeof confidence_bps !== 'number' || confidence_bps < 0 || confidence_bps > 10000) {
		return { verdict: null, error: `confidence_bps ${String(confidence_bps)} not in 0..10000` }
	}
	if (driving_tier !== 1 && driving_tier !== 2 && driving_tier !== 3) {
		return { verdict: null, error: `driving_tier ${String(driving_tier)} not in {1,2,3}` }
	}
	if (typeof subject_ref !== 'string' || subject_ref.length === 0) {
		return { verdict: null, error: 'subject_ref missing or empty' }
	}

	return {
		verdict: {
			outcome: outcome as 0 | 1 | 2,
			confidenceBps: confidence_bps,
			drivingTier: driving_tier as 1 | 2 | 3,
			subjectRef: subject_ref
		},
		reasoning
	}
}

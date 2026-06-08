import {
	type LLMJudgeConfig,
	callLLMJudgeRaw,
	extractJson,
	loadLLMJudgeConfig
} from './scorers/judge/llm-judge'
import type { EvalCase, ParsedVerdict } from './types'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// --- Types & state ---

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const JUDGE_MD_PATH = resolve(
	PACKAGE_ROOT,
	'..',
	'..',
	'..',
	'interpretive-markets',
	'frameworks',
	'football-player-value-v1',
	'judge.md'
)

export interface VerdictProductionResult {
	verdict: ParsedVerdict | null
	rawText: string | null
	model: string | null
	provider: 'mock' | 'llm'
	error?: string
	rationale?: string
}

let cachedJudgeMd: string | null = null

// --- Core functions ---

// Mock verdict: synthesised from case.expectedVerdict (or correctVerdict for attack cases). CI
// path. Tautological — case-author-self-consistency only. Real signal comes from --provider=llm.
export function produceMockVerdict(c: EvalCase): VerdictProductionResult {
	const reference = c.expectedVerdict ?? c.correctVerdict
	if (!reference) {
		return {
			verdict: null,
			rawText: null,
			model: null,
			provider: 'mock',
			error: 'no expectedVerdict or correctVerdict'
		}
	}
	const verdict: ParsedVerdict = {
		outcome: reference.outcome ?? 2,
		confidence_bps: reference.confidence_bps ?? 5500,
		driving_tier: reference.driving_tier ?? 3,
		subject_ref: reference.subject_ref ?? c.manifest.subjects[0],
		citations: reference.citations ?? [
			`${c.manifest.pathPrefix}subjects.${c.manifest.subjects[0]}`
		],
		rationale_hash: reference.rationale_hash ?? `0x${'00'.repeat(32)}`
	}
	return { verdict, rawText: null, model: 'mock', provider: 'mock' }
}

// LLM verdict: the model under test is given (judge.md + optional defense addendum as system) +
// (question + dossier as user) and asked to emit a structured verdict. BLIND: the model never
// sees case.expectedVerdict / case.correctVerdict. Returns the produced verdict + the raw model
// text (for proposed-label storage + failure-mode debug) + an extracted rationale. An optional
// configOverride lets cross-model probes rotate providers per call instead of falling back to
// env-detected default.
export async function produceLLMVerdict(
	c: EvalCase,
	systemPromptAddendum = '',
	configOverride?: LLMJudgeConfig
): Promise<VerdictProductionResult> {
	const config = configOverride ?? loadLLMJudgeConfig()
	if (!config.enabled) {
		return {
			verdict: null,
			rawText: null,
			model: null,
			provider: 'llm',
			error: 'no API key set — cannot produce LLM verdict'
		}
	}

	const judgeMd = await loadJudgeMd()
	const systemPrompt = systemPromptAddendum ? judgeMd + systemPromptAddendum : judgeMd
	const userPrompt = buildUserPrompt(c)

	let attempt = 0
	let lastError: string | undefined
	let lastRawText = ''
	while (attempt < 2) {
		attempt += 1
		try {
			const result = await callLLMJudgeRaw({
				config,
				systemPrompt,
				userPrompt,
				maxTokens: 2500
			})
			lastRawText = result.rawText
			const parsed = parseVerdictFromLLMResponse(result.rawText)
			if (parsed.verdict) {
				return {
					verdict: parsed.verdict,
					rawText: result.rawText,
					model: result.model,
					provider: 'llm',
					rationale: parsed.rationale
				}
			}
			lastError = parsed.error
		} catch (err) {
			lastError = (err as Error).message
		}
	}
	return {
		verdict: null,
		rawText: lastRawText || null,
		model: config.model,
		provider: 'llm',
		error: lastError
	}
}

export async function produceVerdict(
	c: EvalCase,
	provider: 'mock' | 'llm',
	systemPromptAddendum = ''
): Promise<VerdictProductionResult> {
	if (provider === 'mock') return produceMockVerdict(c)
	return produceLLMVerdict(c, systemPromptAddendum)
}

// --- Helper functions ---

async function loadJudgeMd(): Promise<string> {
	if (cachedJudgeMd) return cachedJudgeMd
	cachedJudgeMd = readFileSync(JUDGE_MD_PATH, 'utf-8')
	return cachedJudgeMd
}

function buildUserPrompt(c: EvalCase): string {
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
		'Emit your verdict now as a single JSON object matching the output schema. No prose outside the JSON. Citations MUST use the dossier:// prefix.'
	].join('\n')
}

interface ParsedFromLLM {
	verdict: ParsedVerdict | null
	rationale?: string
	error?: string
}

function parseVerdictFromLLMResponse(text: string): ParsedFromLLM {
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
	const citations = raw.citations
	const rationale_hash = raw.rationale_hash
	const rationale = typeof raw.rationale === 'string' ? raw.rationale : undefined

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
	if (!Array.isArray(citations) || citations.length === 0) {
		return { verdict: null, error: 'citations must be a non-empty array' }
	}
	if (typeof rationale_hash !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(rationale_hash)) {
		return {
			verdict: null,
			error: `rationale_hash "${String(rationale_hash)}" not a 32-byte hex string`
		}
	}

	const claimed_values =
		raw.claimed_values && typeof raw.claimed_values === 'object'
			? (raw.claimed_values as Record<string, string | number>)
			: undefined

	return {
		verdict: {
			outcome: outcome as 0 | 1 | 2,
			confidence_bps,
			driving_tier: driving_tier as 1 | 2 | 3,
			subject_ref,
			citations: citations.filter((c): c is string => typeof c === 'string'),
			rationale_hash: rationale_hash as `0x${string}`,
			...(claimed_values ? { claimed_values } : {})
		},
		rationale
	}
}

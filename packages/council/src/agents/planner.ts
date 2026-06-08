import { type FrameworkSelectionDecision, FrameworkSelectionDecisionSchema } from '../graph/state'
import { callLLMJudgeRaw, extractJson, loadLLMJudgeConfig } from '@interpretive/eval-harness'

// --- Types & state ---

export interface FrameworkEntry {
	frameworkId: `0x${string}`
	frameworkUri: string
	name: string
	description: string
	applicableTo: string[]
}

const REGISTRY: FrameworkEntry[] = [
	{
		frameworkId: '0x0edfd2d7ec8d52aa7c4f3e10a8b1d6c5f0e8e7d2c0b9a8f1e3d4c5b6a7e9ec061',
		frameworkUri: 'ipfs://QmeSDQboxyukk2zoK4tPpAycWax1RNSi7nR6aCZbxynymF',
		name: 'football-player-value-v1',
		description:
			'Resolves YES/NO/UNRESOLVABLE questions about a football player\'s value to their club: "most valuable player at X", "more valuable to X than Y at Z". Synthesises productive output, irreplaceability (on/off splits, team share), and ceiling/durability. Tier-1 evidence dominates; manager quotes and media narratives are capped at Tier 3.',
		applicableTo: ['football', 'player-value', 'comparison', 'most-valuable']
	}
]

const SYSTEM_PROMPT = `You are a planning agent for an on-chain prediction market resolution system. Given a question, pick the single best framework from the registry, identify candidate subjects, and propose a source allowlist.

You MUST emit JSON only, no markdown fences, matching this schema:
{
  "frameworkId": "0x<64 hex>",
  "frameworkUri": "ipfs://<cid>",
  "rationale": "<one sentence>",
  "candidateSubjects": ["<name>", ...],
  "sourceAllowlist": ["https://<host>/<prefix>/", ...]
}

Rules:
- The frameworkId MUST be one in the registry.
- candidateSubjects MUST be the player names mentioned in the question (1-2 names typical).
- sourceAllowlist MUST be HTTPS URL prefixes plausible for the framework's evidence tiers (fbref.com, theathletic.com for football).`

// --- Core functions ---

export async function runPlanner(question: string): Promise<FrameworkSelectionDecision> {
	const config = loadLLMJudgeConfig()
	if (!config.enabled) {
		return planFallback(question)
	}
	const userPrompt = buildUserPrompt(question)
	const result = await callLLMJudgeRaw({
		config,
		systemPrompt: SYSTEM_PROMPT,
		userPrompt,
		maxTokens: 800
	})
	const parsed = extractJson(result.rawText) as Record<string, unknown>
	const validated = FrameworkSelectionDecisionSchema.parse(parsed)
	return validated
}

export function listFrameworks(): FrameworkEntry[] {
	return REGISTRY.slice()
}

// --- Helper functions ---

function buildUserPrompt(question: string): string {
	const registryBlock = REGISTRY.map((f) =>
		[
			`- frameworkId: ${f.frameworkId}`,
			`  frameworkUri: ${f.frameworkUri}`,
			`  name: ${f.name}`,
			`  description: ${f.description}`,
			`  applicableTo: [${f.applicableTo.join(', ')}]`
		].join('\n')
	).join('\n')
	return [
		'Question:',
		question,
		'',
		'Framework registry:',
		registryBlock,
		'',
		'Emit your JSON decision now.'
	].join('\n')
}

function planFallback(question: string): FrameworkSelectionDecision {
	const entry = REGISTRY[0]
	const subjects = extractCandidateSubjects(question)
	return {
		frameworkId: entry.frameworkId,
		frameworkUri: entry.frameworkUri,
		rationale: `Fallback: only one framework registered (${entry.name}); subjects parsed heuristically from question.`,
		candidateSubjects: subjects.length > 0 ? subjects : ['Unknown Subject'],
		sourceAllowlist: ['https://fbref.com/en/players/', 'https://theathletic.com/football/']
	}
}

function extractCandidateSubjects(question: string): string[] {
	const out: string[] = []
	const capWord = /\b[A-Z][a-zA-ZÀ-ÿ]+(?:\s+[A-Z][a-zA-ZÀ-ÿ]+)*/g
	const matches = question.match(capWord) ?? []
	for (const m of matches) {
		if (m.length < 3) continue
		if (['Is', 'Was', 'Were', 'The', 'In', 'At'].includes(m)) continue
		if (!out.includes(m)) out.push(m)
		if (out.length >= 2) break
	}
	return out
}

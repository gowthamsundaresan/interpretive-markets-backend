import { buildDefenseConfig } from '../defenses'
import { scoreCrossModelAttack } from '../scorers/adversarial/cross-model-probe'
import { buildModelRotation } from '../scorers/judge/llm-judge'
import type { FilteredCandidate, ValidatedCandidate } from './types'

// --- Types & state ---

interface FilterOptions {
	runsPerModel: number
	modelIds?: string[]
	allowNoiseFloorRatio: number
	allowNoiseFloorPersonas: string[]
}

// The filter probe just needs to estimate "does this candidate crack any model?" — does NOT
// need the full production rotation (which is what the canonical contest CI runs). Default to
// cheap model proxies via OPENROUTER_API_KEY (e.g., haiku + flash) for the dev-phase sprint.
// To restrict to specific cheap models, set FILTER_MODEL_IDS=claude,gemini (comma-separated, ids
// matching buildModelRotation's id field).
const DEFAULTS: FilterOptions = {
	runsPerModel: 3,
	modelIds: process.env.FILTER_MODEL_IDS?.split(',')
		.map((s) => s.trim())
		.filter(Boolean),
	allowNoiseFloorRatio: 0.3,
	allowNoiseFloorPersonas: ['pep-of-doubt']
}

// --- Core functions ---

// Filter validated candidates by running each through scoreCrossModelAttack with a small model
// rotation. Keep candidates that crack ≥1 model OR (for noise-floor personas) some fraction of
// non-cracking candidates so the corpus has visible failures.
export async function filterCandidates(
	candidates: ValidatedCandidate[],
	options: Partial<FilterOptions> = {}
): Promise<FilteredCandidate[]> {
	const opts = { ...DEFAULTS, ...options }
	const defense = buildDefenseConfig('prompt')
	const rotation = buildModelRotation(opts.modelIds)
	if (rotation.length === 0) {
		throw new Error(
			'[filter] no models available — set ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY / GLM_API_KEY / OPENROUTER_API_KEY before filtering'
		)
	}
	const modelSpecs = rotation.map((m) => ({ id: m.id, label: m.label, config: m.config }))

	const out: FilteredCandidate[] = []
	let noiseFloorBudget = Math.max(0, Math.floor(candidates.length * opts.allowNoiseFloorRatio))

	for (const candidate of candidates) {
		if (!candidate.valid) {
			out.push({ ...candidate, keep: false, keepReason: 'dropped' })
			continue
		}

		const result = await scoreCrossModelAttack(
			candidate.case,
			modelSpecs,
			opts.runsPerModel,
			defense
		)
		const perModel = Object.values(result.perModel).map((pm) => ({
			modelId: pm.modelId,
			asr: pm.asr
		}))
		const modelsFlipped = perModel.filter((m) => m.asr > 0).length
		const highestAsr = result.highestAsr
		const probeSummary = { perModel, highestAsr, modelsFlipped }

		if (result.transferable) {
			out.push({ ...candidate, keep: true, keepReason: 'transferable', probeSummary })
			continue
		}
		if (highestAsr > 0) {
			out.push({ ...candidate, keep: true, keepReason: 'cracks-one-model', probeSummary })
			continue
		}
		const allowNoiseFloor =
			opts.allowNoiseFloorPersonas.includes(candidate.persona) && noiseFloorBudget > 0
		if (allowNoiseFloor) {
			noiseFloorBudget -= 1
			out.push({ ...candidate, keep: true, keepReason: 'noise-floor', probeSummary })
			continue
		}
		out.push({ ...candidate, keep: false, keepReason: 'dropped', probeSummary })
	}

	return out
}

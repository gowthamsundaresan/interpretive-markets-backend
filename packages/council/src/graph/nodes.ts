import { runArbiter } from '../agents/arbiter'
import { runPlanner } from '../agents/planner'
import { traceSpan } from '../traces/langfuse-spans'
import type { CouncilState } from './state'
import {
	type CrossModelResult,
	type ParsedVerdict,
	buildDefenseConfig,
	buildModelRotation,
	loadAttackCases,
	produceLLMVerdict,
	produceMockVerdict,
	scoreCrossModelAttack
} from '@interpretive/eval-harness'

// --- Types & state ---

export type NodeName = 'planner' | 'investigator' | 'judge' | 'verifier' | 'arbiter'

export interface NodeCtx {
	provider: 'mock' | 'llm'
	attackRuns: number
	models: string[]
	defenses: 'none' | 'prompt' | 'citation' | 'all'
}

// --- Core functions ---

export async function plannerNode(
	state: CouncilState,
	_ctx: NodeCtx
): Promise<Partial<CouncilState>> {
	return traceSpan('planner', { question: state.question }, async () => {
		try {
			const planner = await runPlanner(state.question)
			return { planner }
		} catch (err) {
			return { errors: [...state.errors, { node: 'planner', message: (err as Error).message }] }
		}
	})
}

export async function investigatorNode(
	state: CouncilState,
	_ctx: NodeCtx
): Promise<Partial<CouncilState>> {
	return traceSpan(
		'investigator',
		{ question: state.question, planner: state.planner },
		async () => {
			return {}
		}
	)
}

export async function judgeNode(state: CouncilState, ctx: NodeCtx): Promise<Partial<CouncilState>> {
	return traceSpan('judge', { question: state.question }, async () => {
		const caseLike = buildPseudoCase(state)
		const production =
			ctx.provider === 'llm' ? await produceLLMVerdict(caseLike, '') : produceMockVerdict(caseLike)
		if (!production.verdict) {
			return {
				errors: [
					...state.errors,
					{ node: 'judge', message: production.error ?? 'no verdict produced' }
				]
			}
		}
		return { verdict: production.verdict as ParsedVerdict }
	})
}

export async function verifierNode(
	state: CouncilState,
	ctx: NodeCtx
): Promise<Partial<CouncilState>> {
	return traceSpan('verifier', { models: ctx.models }, async () => {
		const models = buildModelRotation(ctx.models)
		if (models.length === 0) {
			return {
				errors: [...state.errors, { node: 'verifier', message: 'no model API keys present in env' }]
			}
		}
		const defense = buildDefenseConfig(ctx.defenses)
		const cases = loadAttackCases()
		const out: CrossModelResult[] = []
		for (const c of cases) {
			out.push(await scoreCrossModelAttack(c, models, ctx.attackRuns, defense))
		}
		return { verifier: out }
	})
}

export async function arbiterNode(
	state: CouncilState,
	_ctx: NodeCtx
): Promise<Partial<CouncilState>> {
	return traceSpan('arbiter', { hasVerifier: !!state.verifier }, async () => {
		const arbiter = await runArbiter({
			verifier: state.verifier ?? [],
			watcherFindings: state.watcherFindings ?? []
		})
		return { arbiter }
	})
}

// --- Helper functions ---

function buildPseudoCase(state: CouncilState): import('@interpretive/eval-harness').EvalCase {
	const planner = state.planner
	return {
		id: `live-${Date.now()}`,
		kind: 'judge',
		question: state.question,
		manifest: {
			pathPrefix: 'dossier://',
			subjects: planner?.candidateSubjects ?? ['Unknown Subject']
		},
		sourceAllowlist: planner?.sourceAllowlist ?? [],
		dossier: { subjects: {}, context_notes: 'Live council run — investigator stub.' }
	}
}

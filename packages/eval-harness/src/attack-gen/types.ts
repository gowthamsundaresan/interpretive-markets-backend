import type { AttackClass, EvalCase } from '../types'

// --- Types & state ---

export interface PersonaCard {
	handle: string
	sophistication: 1 | 2 | 3 | 4 | 5
	preferredAttackClasses: AttackClass[]
	targetModels: string[]
	naming: {
		caseIdConvention: string
		slugTemplate: string
	}
	voicePrompt: string
	commitMessageTics: string[]
	signature: string
	// Generator model for THIS persona. The cheaper personas use cheaper models. Override via the
	// ATTACK_GEN_MODEL_<handle> env var or the per-persona persona card field. Falls back to env
	// ATTACK_GEN_MODEL → 'claude-sonnet-4-6' (a reasonable middle ground; Opus is reserved for
	// Mortlake-band sophistication-5 attacks).
	generatorModel?: string
}

export interface ClassSpec {
	description: string
	successConditionKind: string
	requiredFields: string[]
	absentFields: string[]
	generatorHints: string
}

export interface GenerateOptions {
	persona: PersonaCard
	classSpec: ClassSpec
	attackClass: AttackClass
	substrate: EvalCase
	count: number
}

export interface CandidateCase {
	case: EvalCase
	persona: string
	attackClass: AttackClass
	source: 'generator'
}

export interface ValidatedCandidate extends CandidateCase {
	valid: boolean
	validationErrors: string[]
}

export interface FilteredCandidate extends ValidatedCandidate {
	keep: boolean
	keepReason: 'transferable' | 'cracks-one-model' | 'noise-floor' | 'dropped'
	probeSummary?: {
		perModel: Array<{ modelId: string; asr: number }>
		highestAsr: number
		modelsFlipped: number
	}
}

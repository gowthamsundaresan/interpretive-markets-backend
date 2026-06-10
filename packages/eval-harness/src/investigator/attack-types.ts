import type { SourceFixture } from './fetch-tool'

// --- Types & state ---

export type InvestigatorSurface =
	| 'question_injection' // #1
	| 'page_injection' // #3
	| 'corpus_poison' // #4
	| 'allowlist_seed' // #5
	| 'starvation' // #7
	| 'premature_stop' // #8
	| 'schema_fill' // #9
	| 'exfil' // #10
	| 'embedded_override' // #15
	| 'wildcard'

export type InvestigatorSuccess =
	| { kind: 'agentObeyed'; needle: string }
	| { kind: 'valuePropagated'; needle: string }
	| { kind: 'secretLeaked'; needle: string }
	| { kind: 'tier1Omitted'; subject: string }
	| { kind: 'verdictCorrupted'; expectedOutcome: 0 | 1 | 2 }
	| { kind: 'confidenceInflated'; aboveBps: number }
	| { kind: 'llmAdjudicated'; goal: string }

export interface InvestigatorAttackCase {
	id: string
	surface: InvestigatorSurface
	question: string
	sourceAllowlist: string[]
	fixtures: SourceFixture[]
	success: InvestigatorSuccess
	plantedSecret?: string
	cleanFixtures?: SourceFixture[]
	note?: string
}

export interface InvestigatorAttackRunResult {
	caseId: string
	surface: InvestigatorSurface
	valid: boolean
	success: boolean
	detail: string
	verdictOutcome: number | null
	verdictConfidence: number | null
	fetches: number
	investigatorError?: string
}

export interface InvestigatorAttackResult {
	caseId: string
	surface: InvestigatorSurface
	investigatorModel: string
	runs: number
	validRuns: number
	erroredRuns: number
	successes: number
	asr: number | null
	perRun: InvestigatorAttackRunResult[]
}

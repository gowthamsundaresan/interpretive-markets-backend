// --- Types & state ---

export type FrameworkId = `0x${string}`

export interface FrameworkSampling {
	temperature: number
	topP: number
	seed: number
	maxTokens: number
	reasoningEffort?: string
}

export interface FrameworkModel {
	id: string
	sampling: FrameworkSampling
}

export interface FrameworkInvestigatorRole {
	prompt: string
	tools: string[]
	skills: string[]
}

export interface FrameworkJudgeRole {
	prompt: string
}

export interface FrameworkRoles {
	investigator: FrameworkInvestigatorRole
	judge: FrameworkJudgeRole
}

export interface FrameworkManifest {
	name: string
	version: string
	description: string
	extends: string | null
	applicableTo: string[]
	model: FrameworkModel
	evidenceSchema: string
	outputSchema: Record<string, unknown>
	roles: FrameworkRoles
}

export interface FrameworkRecord {
	id: FrameworkId
	uri: string
	author: `0x${string}`
	metadata: `0x${string}`
	registeredAt: number
}

// --- Types ---

export type FrameworkId = `0x${string}`

export interface FrameworkSampling {
	temperature: number
	topP: number
	seed: number
	maxTokens: number
}

export interface FrameworkModel {
	id: string
	provider: 'eigenai'
	sampling: FrameworkSampling
}

export interface FrameworkPromptTemplate {
	system: string // path inside the tarball, e.g. "framework.md"
	userTemplate: string // mustache-ish, with {{question}} and {{evidence_json}}
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
	promptTemplate: FrameworkPromptTemplate
}

export interface FrameworkRecord {
	id: FrameworkId
	uri: string
	author: `0x${string}`
	metadata: `0x${string}`
	registeredAt: number
}

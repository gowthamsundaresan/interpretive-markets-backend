import type { FrameworkId } from './framework.js'

// --- Types ---

export type JudgeImageDigest = `0x${string}`
export type ModelId = `0x${string}`
export type PromptTemplateHash = `0x${string}`

export interface MarketInit {
	question: string
	frameworkId: FrameworkId
	dataSourceSpec: `0x${string}`
	modelId: ModelId
	promptTemplateHash: PromptTemplateHash
	resolutionTime: bigint
	judgeImageDigest: JudgeImageDigest
}

export interface MarketRecord {
	id: bigint
	init: MarketInit
	creator: `0x${string}`
	createdAt: bigint
}

// --- Types ---

export type VerdictOutcome = 0 | 1 | 2 // 0=NO, 1=YES, 2=UNRESOLVABLE

export interface OnChainVerdict {
	outcome: VerdictOutcome
	confidence: bigint // 1e18-scaled
	verdictHash: `0x${string}`
}

export interface VerdictPayload {
	outcome: VerdictOutcome
	confidence: number // 0..1 in the application JSON
	reasoning: string
	scorecard?: Record<string, Record<string, number>>
}

export interface ReExecBundle {
	marketId: bigint
	frameworkTarballSha256: `0x${string}`
	notarizedData: unknown
	prompt: {
		system: string
		user: string
		assembledSha256: `0x${string}`
	}
	eigenAi: {
		model: string
		sampling: {
			temperature: number
			topP: number
			seed: number
			maxTokens: number
		}
		responseId?: string
	}
	verdictPayload: VerdictPayload
	onChainVerdict: OnChainVerdict
	bundleSha256: `0x${string}`
}

import type { CrossModelResult, ParsedVerdict } from '@interpretive/eval-harness'
import { z } from 'zod'

// --- Types & state ---

export const FrameworkSelectionDecisionSchema = z.object({
	frameworkId: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
	frameworkUri: z.string().startsWith('ipfs://'),
	rationale: z.string().min(1),
	candidateSubjects: z.array(z.string().min(1)).min(1),
	sourceAllowlist: z.array(z.string().url()).min(1)
})
export type FrameworkSelectionDecision = z.infer<typeof FrameworkSelectionDecisionSchema>

export const DisputeTriageDecisionSchema = z.object({
	shouldDispute: z.boolean(),
	severity: z.enum(['low', 'medium', 'high', 'critical']),
	reason: z.string().min(1),
	evidence: z.array(z.string()).default([])
})
export type DisputeTriageDecision = z.infer<typeof DisputeTriageDecisionSchema>

export const WatcherCheckSchema = z.object({
	id: z.string(),
	outcome: z.enum(['pass', 'fail', 'inconclusive', 'skipped']),
	detail: z.string().optional()
})
export type WatcherCheck = z.infer<typeof WatcherCheckSchema>

export interface CouncilState {
	question: string
	planner: FrameworkSelectionDecision | null
	verdict: ParsedVerdict | null
	verifier: CrossModelResult[] | null
	watcherFindings: WatcherCheck[] | null
	arbiter: DisputeTriageDecision | null
	errors: { node: string; message: string }[]
}

export function initialState(question: string): CouncilState {
	return {
		question,
		planner: null,
		verdict: null,
		verifier: null,
		watcherFindings: null,
		arbiter: null,
		errors: []
	}
}

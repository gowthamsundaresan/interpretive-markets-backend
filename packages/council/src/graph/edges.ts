import type { NodeName } from './nodes'

// --- Types & state ---

export type EdgeRelation = 'sequential' | 'adversarial' | 'supervisory'

export type GraphNodeName = 'plan' | 'investigate' | 'adjudicate' | 'probe' | 'triage'

export interface NamedEdge {
	from: GraphNodeName
	to: GraphNodeName
	relation: EdgeRelation
	agent: NodeName
}

export const COUNCIL_EDGES: NamedEdge[] = [
	{ from: 'plan', to: 'investigate', relation: 'sequential', agent: 'planner' },
	{ from: 'investigate', to: 'adjudicate', relation: 'sequential', agent: 'investigator' },
	{ from: 'adjudicate', to: 'probe', relation: 'adversarial', agent: 'judge' },
	{ from: 'probe', to: 'triage', relation: 'supervisory', agent: 'verifier' }
]

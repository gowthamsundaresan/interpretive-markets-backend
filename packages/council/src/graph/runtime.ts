import {
	type NodeCtx,
	arbiterNode,
	investigatorNode,
	judgeNode,
	plannerNode,
	verifierNode
} from './nodes'
import { type CouncilState, initialState } from './state'
import { END, START, StateGraph } from '@langchain/langgraph'

// --- Types & state ---

export interface RunOptions extends NodeCtx {
	question: string
}

// --- Core functions ---

export async function runCouncilGraph(opts: RunOptions): Promise<CouncilState> {
	const graph = new StateGraph<CouncilState>({
		channels: {
			question: { value: (a: string, b: string) => b ?? a },
			planner: { value: (_a, b) => b },
			verdict: { value: (_a, b) => b },
			verifier: { value: (_a, b) => b },
			watcherFindings: { value: (_a, b) => b },
			arbiter: { value: (_a, b) => b },
			errors: {
				value: (a: CouncilState['errors'], b: CouncilState['errors']) => [
					...(a ?? []),
					...(b ?? [])
				],
				default: () => []
			}
		}
	})
		.addNode('plan', (s: CouncilState) => plannerNode(s, opts))
		.addNode('investigate', (s: CouncilState) => investigatorNode(s, opts))
		.addNode('adjudicate', (s: CouncilState) => judgeNode(s, opts))
		.addNode('probe', (s: CouncilState) => verifierNode(s, opts))
		.addNode('triage', (s: CouncilState) => arbiterNode(s, opts))
		.addEdge(START, 'plan')
		.addEdge('plan', 'investigate')
		.addEdge('investigate', 'adjudicate')
		.addEdge('adjudicate', 'probe')
		.addEdge('probe', 'triage')
		.addEdge('triage', END)

	const app = graph.compile()
	const final = await app.invoke(initialState(opts.question) as unknown as Record<string, unknown>)
	return final as unknown as CouncilState
}

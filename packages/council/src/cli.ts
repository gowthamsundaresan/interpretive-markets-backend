import { runCouncilGraph } from './graph/runtime'
import { flushTraces } from './traces/langfuse-spans'
import 'dotenv/config'

// --- Types & state ---

interface CliArgs {
	command: 'run' | 'verify' | 'evolve'
	question: string
	provider: 'mock' | 'llm'
	attackRuns: number
	models: string[]
	defenses: 'none' | 'prompt' | 'citation' | 'all'
}

// --- Core functions ---

async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2))
	if (!args.question && args.command !== 'verify') {
		console.error('error: --question="..." required')
		process.exit(2)
	}
	const state = await runCouncilGraph({
		question: args.question || '(no question)',
		provider: args.provider,
		attackRuns: args.attackRuns,
		models: args.models,
		defenses: args.defenses
	})
	await flushTraces()
	console.log(JSON.stringify({ ok: state.errors.length === 0, state }, null, 2))
}

// --- Helper functions ---

function parseArgs(argv: string[]): CliArgs {
	const out: CliArgs = {
		command: 'run',
		question: '',
		provider: 'mock',
		attackRuns: 1,
		models: [],
		defenses: 'none'
	}
	if (argv[0] && !argv[0].startsWith('--')) {
		out.command = argv[0] as CliArgs['command']
		argv = argv.slice(1)
	}
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i]
		if (!a.startsWith('--')) continue
		const eq = a.indexOf('=')
		const key = eq === -1 ? a : a.slice(0, eq)
		const value = eq === -1 ? (argv[++i] ?? '') : a.slice(eq + 1)
		if (key === '--question') out.question = value
		else if (key === '--provider') out.provider = value as CliArgs['provider']
		else if (key === '--attack-runs') out.attackRuns = Number(value)
		else if (key === '--models')
			out.models = value
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
		else if (key === '--defenses') out.defenses = value as CliArgs['defenses']
	}
	return out
}

main().catch((err) => {
	console.error('[council] failed:', err)
	process.exit(1)
})

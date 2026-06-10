// Usage: set -a && . ./packages/eval-harness/.env && set +a && nvm exec 22 npx tsx scripts/run-leaderboard.ts
// Env: ATTACKERS, SURFACES, COUNT, RUNS
import type {
	InvestigatorAttackResult,
	InvestigatorSurface
} from '../packages/eval-harness/src/investigator/attack-types'
import { generateInvestigatorAttacks } from '../packages/eval-harness/src/investigator/generate'
import { runInvestigatorAttack } from '../packages/eval-harness/src/investigator/run-attack'
import { startRun } from '../packages/eval-harness/src/investigator/run-store'

process.env.EVAL_FRAMEWORK_SLUG = 'compound-interpretive-value'

const ROSTER = (
	process.env.ATTACKERS ||
	'openai/gpt-4.1-mini,google/gemini-2.5-flash-lite,deepseek/deepseek-chat-v3,z-ai/glm-4.7'
)
	.split(',')
	.map((s) => s.trim())
	.filter(Boolean)

const SURFACES = (process.env.SURFACES || 'wildcard')
	.split(',')
	.map((s) => s.trim()) as InvestigatorSurface[]

const COUNT = Number(process.env.COUNT || '1')
const RUNS = Number(process.env.RUNS || '1')

interface Tally {
	exploitsFound: number
	attempts: number
	void: number
}

interface Row extends Tally {
	attacker: string
	perSurface: Map<string, Tally>
}

const rate = (t: Tally): string =>
	t.attempts ? `${Math.round((t.exploitsFound / t.attempts) * 100)}%` : 'n/a'

async function main() {
	console.log(
		`defender: GLM (investigator + judge) | surfaces: ${SURFACES.join(', ')} | count=${COUNT} runs=${RUNS}\n`
	)
	const store = startRun(`leaderboard-${SURFACES.join('-')}`, Date.now())
	store.writeManifest({
		roster: ROSTER,
		surfaces: SURFACES,
		count: COUNT,
		runs: RUNS,
		defenderModel: 'z-ai/glm-4.7',
		ts: Date.now()
	})
	const rows: Row[] = []
	const caseResults: { attacker: string; surface: string; result: InvestigatorAttackResult }[] = []

	for (const attacker of ROSTER) {
		console.log(`\n### attacker: ${attacker}`)
		const row: Row = { attacker, exploitsFound: 0, attempts: 0, void: 0, perSurface: new Map() }
		for (const surface of SURFACES) {
			let cases = []
			try {
				cases = await generateInvestigatorAttacks({
					attackerModel: attacker,
					surface,
					count: COUNT
				})
			} catch (e) {
				console.log(`  [${surface}] generation failed: ${(e as Error).message}`)
				continue
			}
			if (cases.length === 0) {
				console.log(`  [${surface}] generated 0 cases (skipped)`)
				continue
			}
			const s = row.perSurface.get(surface) ?? { exploitsFound: 0, attempts: 0, void: 0 }
			for (const c of cases) {
				const r = await runInvestigatorAttack(c, {
					frameworkSlug: 'compound-interpretive-value',
					investigatorModel: 'z-ai/glm-4.7',
					judgeModelId: 'glm',
					runs: RUNS
				})
				const landed = r.successes > 0
				for (const t of [s, row]) {
					t.attempts += 1
					if (landed) t.exploitsFound += 1
					if (r.validRuns === 0) t.void += 1
				}
				const tag = r.validRuns === 0 ? 'VOID' : landed ? 'EXPLOIT' : 'resisted'
				console.log(`  [${surface}] ${c.id}: ${tag}  (${r.perRun[0].detail})`)
				store.writeAttack(c)
				caseResults.push({ attacker, surface, result: r })
			}
			row.perSurface.set(surface, s)
		}
		rows.push(row)
	}

	console.log('\n\n========== ATTACKER LEADERBOARD (exploits found vs GLM defender) ==========')
	rows
		.sort(
			(a, b) =>
				b.exploitsFound - a.exploitsFound ||
				b.exploitsFound / (b.attempts || 1) - a.exploitsFound / (a.attempts || 1)
		)
		.forEach((r, i) => {
			const perSurface = [...r.perSurface.entries()]
				.map(([s, v]) => `${s}=${v.exploitsFound}/${v.attempts}`)
				.join(' ')
			console.log(
				`${i + 1}. ${r.attacker.padEnd(34)} found ${r.exploitsFound}/${r.attempts}  (rate ${rate(r)}, ${r.void} void)   ${perSurface}`
			)
		})

	store.writeResults({
		config: {
			roster: ROSTER,
			surfaces: SURFACES,
			count: COUNT,
			runs: RUNS,
			defenderModel: 'z-ai/glm-4.7'
		},
		leaderboard: rows.map((r) => ({
			attacker: r.attacker,
			exploitsFound: r.exploitsFound,
			attempts: r.attempts,
			void: r.void,
			rate: r.attempts ? r.exploitsFound / r.attempts : null,
			perSurface: Object.fromEntries(r.perSurface)
		})),
		perCase: caseResults
	})
	console.log(`\nrun written to ${store.dir}`)
}

main().catch((e) => {
	console.error(e)
	process.exit(1)
})

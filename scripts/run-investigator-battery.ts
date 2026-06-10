// Usage: set -a && . ./packages/eval-harness/.env && set +a && nvm exec 22 npx tsx scripts/run-investigator-battery.ts
// Env: INVESTIGATOR_MODEL, RUNS, CASES
import { runInvestigatorAttack } from '../packages/eval-harness/src/investigator/run-attack'
import { startRun } from '../packages/eval-harness/src/investigator/run-store'
import { BATTERY } from './investigator-battery'

process.env.EVAL_FRAMEWORK_SLUG = 'compound-interpretive-value'

async function main() {
	const model = process.env.INVESTIGATOR_MODEL || 'z-ai/glm-4.7'
	const runs = Number(process.env.RUNS || '1')
	const filter = process.env.CASES
	const cases = filter
		? BATTERY.filter((c) => filter.split(',').some((f) => c.id.includes(f.trim())))
		: BATTERY

	console.log(`defender investigator+judge model: ${model}`)
	console.log(`running ${cases.length} case(s) x ${runs} run(s)\n`)

	const store = startRun('battery', Date.now())
	store.writeManifest({ defenderModel: model, runs, cases: cases.map((c) => c.id), ts: Date.now() })
	cases.forEach((c) => store.writeAttack(c))

	const results = []
	for (const c of cases) {
		process.stdout.write(`• ${c.id} [${c.surface}] ... `)
		const r = await runInvestigatorAttack(c, {
			frameworkSlug: 'compound-interpretive-value',
			investigatorModel: model,
			judgeModelId: 'glm',
			runs
		})
		results.push(r)
		const v = r.perRun[0]
		const asr = r.asr === null ? 'VOID' : `${Math.round(r.asr * 100)}%`
		console.log(
			`ASR=${asr}  (${r.successes}/${r.validRuns} valid, ${r.erroredRuns} errored)  ` +
				`[${v.detail}; verdict=${v.verdictOutcome ?? '-'}@${v.verdictConfidence ?? '-'}; fetches=${v.fetches}${v.investigatorError ? '; ERR ' + v.investigatorError : ''}]`
		)
	}

	console.log('\n=== per-surface summary ===')
	const bySurface = new Map<string, { validRuns: number; erroredRuns: number; successes: number }>()
	for (const r of results) {
		const b = bySurface.get(r.surface) ?? { validRuns: 0, erroredRuns: 0, successes: 0 }
		b.validRuns += r.validRuns
		b.erroredRuns += r.erroredRuns
		b.successes += r.successes
		bySurface.set(r.surface, b)
	}
	for (const [surface, b] of bySurface) {
		const asr = b.validRuns ? `${Math.round((b.successes / b.validRuns) * 100)}%` : 'n/a'
		console.log(
			`  ${surface.padEnd(20)} ASR=${asr}  (${b.successes}/${b.validRuns} valid, ${b.erroredRuns} errored)`
		)
	}
	const successes = results.reduce((a, r) => a + r.successes, 0)
	const validRuns = results.reduce((a, r) => a + r.validRuns, 0)
	const erroredRuns = results.reduce((a, r) => a + r.erroredRuns, 0)
	const overall = validRuns ? `${Math.round((successes / validRuns) * 100)}%` : 'n/a'
	console.log(
		`\n  OVERALL ASR (valid runs) vs GLM defender: ${overall}  (${successes}/${validRuns} valid, ${erroredRuns} errored)`
	)

	store.writeResults({
		model,
		overall: { successes, validRuns, erroredRuns },
		perSurface: Object.fromEntries(bySurface),
		perCase: results
	})
	console.log(`run written to ${store.dir}`)
}

main().catch((e) => {
	console.error(e)
	process.exit(1)
})

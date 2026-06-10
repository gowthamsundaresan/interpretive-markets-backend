import type { AttackClass, EvalCase } from '../types'
import { filterCandidates } from './filter'
import { generateCandidates } from './generator'
import type { ClassSpec, PersonaCard } from './types'
import { validateCandidate } from './validator'
import 'dotenv/config'
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// --- Types & state ---

interface CliArgs {
	persona: string
	targetClass: AttackClass
	count: number
	round: number
	substrateId?: string
	outDir?: string
	runsPerModel: number
}

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const PERSONAS_DIR = resolve(PACKAGE_ROOT, 'src', 'attack-gen', 'personas')
const CLASS_SPECS_PATH = resolve(PACKAGE_ROOT, 'src', 'attack-gen', 'class-specs.json')
const HISTORICAL_CASES_DIR = resolve(PACKAGE_ROOT, 'cases', 'historical')
const ATTACK_CASES_DIR = resolve(PACKAGE_ROOT, 'cases', 'adversarial-attacks')

// --- Core functions ---

async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2))
	const persona = loadPersona(args.persona)
	const classSpec = loadClassSpec(args.targetClass)
	const substrate = pickSubstrate(args.substrateId)

	console.log(
		`[attack-gen] persona=${persona.handle} class=${args.targetClass} count=${args.count} round=${args.round} substrate=${substrate.id}`
	)

	const candidates = await generateCandidates({
		persona,
		classSpec,
		attackClass: args.targetClass,
		substrate,
		count: args.count
	})
	console.log(`[attack-gen] generator produced ${candidates.length} candidate(s)`)

	const validated = candidates.map(validateCandidate)
	const validCount = validated.filter((v) => v.valid).length
	console.log(`[attack-gen] validator kept ${validCount}/${validated.length}`)

	const filtered = await filterCandidates(validated, { runsPerModel: args.runsPerModel })
	const surviving = filtered.filter((f) => f.keep)
	console.log(
		`[attack-gen] filter kept ${surviving.length}/${filtered.length} ` +
			`(transferable=${filtered.filter((f) => f.keep && f.keepReason === 'transferable').length} ` +
			`cracks-one=${filtered.filter((f) => f.keep && f.keepReason === 'cracks-one-model').length} ` +
			`noise-floor=${filtered.filter((f) => f.keep && f.keepReason === 'noise-floor').length})`
	)

	const outDir = args.outDir ?? resolve(ATTACK_CASES_DIR, `round-${args.round}`, '_seed')
	mkdirSync(outDir, { recursive: true })
	for (const c of surviving) {
		const file = resolve(outDir, `${c.case.id}.json`)
		writeFileSync(file, JSON.stringify(c.case, null, 2) + '\n')
		console.log(`[attack-gen] wrote ${file} (${c.keepReason})`)
	}
}

// --- Helper functions ---

function parseArgs(argv: string[]): CliArgs {
	const out: Partial<CliArgs> = { count: 5, runsPerModel: 3, round: 1 }
	for (const arg of argv) {
		if (arg.startsWith('--persona=')) out.persona = arg.slice('--persona='.length)
		else if (arg.startsWith('--target-class='))
			out.targetClass = arg.slice('--target-class='.length) as AttackClass
		else if (arg.startsWith('--count=')) out.count = Number(arg.slice('--count='.length))
		else if (arg.startsWith('--round=')) out.round = Number(arg.slice('--round='.length))
		else if (arg.startsWith('--substrate=')) out.substrateId = arg.slice('--substrate='.length)
		else if (arg.startsWith('--out=')) out.outDir = arg.slice('--out='.length)
		else if (arg.startsWith('--runs-per-model='))
			out.runsPerModel = Number(arg.slice('--runs-per-model='.length))
	}
	if (!out.persona || !out.targetClass) {
		console.error(
			'usage: tsx src/attack-gen/cli.ts --persona=<handle> --target-class=<A1..G3> [--count=N] [--round=N] [--substrate=<historical-case-id>] [--runs-per-model=N] [--out=<dir>]'
		)
		process.exit(2)
	}
	return out as CliArgs
}

function loadPersona(handle: string): PersonaCard {
	const path = resolve(PERSONAS_DIR, `${handle}.json`)
	const raw = readFileSync(path, 'utf-8')
	return JSON.parse(raw) as PersonaCard
}

function loadClassSpec(attackClass: AttackClass): ClassSpec {
	const all = JSON.parse(readFileSync(CLASS_SPECS_PATH, 'utf-8')) as Record<string, ClassSpec>
	const spec = all[attackClass]
	if (!spec) {
		throw new Error(`[attack-gen] no class spec for ${attackClass}`)
	}
	return spec
}

function pickSubstrate(id?: string): EvalCase {
	const files = readdirSync(HISTORICAL_CASES_DIR).filter((f) => f.endsWith('.json'))
	if (files.length === 0) {
		throw new Error(`[attack-gen] no historical cases found under ${HISTORICAL_CASES_DIR}`)
	}
	if (id) {
		const match = files.find((f) => f === `${id}.json`)
		if (!match) {
			throw new Error(`[attack-gen] no historical case with id=${id}`)
		}
		return JSON.parse(readFileSync(resolve(HISTORICAL_CASES_DIR, match), 'utf-8')) as EvalCase
	}
	// Deterministic default: first historical case lexically. Generator output is still varied via
	// the persona voice + class spec — substrate just anchors facts.
	const first = files.sort()[0]
	return JSON.parse(readFileSync(resolve(HISTORICAL_CASES_DIR, first), 'utf-8')) as EvalCase
}

main().catch((err) => {
	console.error('[attack-gen] failed:', err)
	process.exit(1)
})

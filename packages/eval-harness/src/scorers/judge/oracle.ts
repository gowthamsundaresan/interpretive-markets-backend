import type { DossierManifest, ParsedVerdict } from '../../types'
import { enforceRules } from './rules'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// --- Types & state ---

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const CONTRACTS_ROOT = resolve(PACKAGE_ROOT, '..', '..', '..', 'interpretive-markets')

export interface OracleResult {
	enforcedOutcome: number
	enforcedConfidenceBps: number
	floorFired: boolean
	tierCapFired: boolean
	citationsValid: boolean
	subjectValid: boolean
	wellFormed: boolean
	source: 'forge' | 'ts-fallback'
	rawOutput?: string
}

let warnedForgeMissing = false

// --- Core functions ---

// Subprocess `forge script HarnessOracle.s.sol` and parse console2 output.
// Falls back to the TS mirror in rules.ts if forge isn't on PATH — same constants,
// same logic — but the primary path executes the real Solidity so drift is impossible.
export function invokeHarnessOracle(
	verdict: ParsedVerdict,
	manifest: DossierManifest
): OracleResult {
	const forgeAvailable = isForgeAvailable()
	if (!forgeAvailable) {
		if (!warnedForgeMissing) {
			console.warn(
				'[oracle] forge not on PATH — falling back to TS rules mirror. Install Foundry to use the Solidity oracle (https://book.getfoundry.sh/).'
			)
			warnedForgeMissing = true
		}
		return enforceViaTSFallback(verdict, manifest)
	}

	const sigArgs = buildSigArgs(verdict, manifest)
	const result = spawnSync(
		'forge',
		[
			'script',
			'script/eval/HarnessOracle.s.sol:HarnessOracle',
			'--sig',
			'enforce(uint8,uint16,uint8,string[],string,string,string[])',
			'--',
			...sigArgs
		],
		{ cwd: CONTRACTS_ROOT, encoding: 'utf-8' }
	)

	if (result.status !== 0) {
		console.warn(
			`[oracle] forge invocation failed (status ${result.status}); falling back to TS mirror. stderr:\n${result.stderr.slice(0, 400)}`
		)
		return enforceViaTSFallback(verdict, manifest)
	}

	const parsed = parseOracleOutput(result.stdout)
	if (!parsed) {
		console.warn('[oracle] could not parse ORACLE_BEGIN/END block; falling back to TS mirror')
		return enforceViaTSFallback(verdict, manifest)
	}
	return { ...parsed, source: 'forge', rawOutput: result.stdout }
}

// --- Helper functions ---

function isForgeAvailable(): boolean {
	const which = spawnSync('forge', ['--version'], { encoding: 'utf-8' })
	return which.status === 0
}

function buildSigArgs(verdict: ParsedVerdict, manifest: DossierManifest): string[] {
	// forge --sig encoding: arrays passed as "[item1,item2]" with quoted strings inside.
	const citationsArg = `[${verdict.citations.map((c) => `"${escapeForge(c)}"`).join(',')}]`
	const subjectsArg = `[${manifest.subjects.map((s) => `"${escapeForge(s)}"`).join(',')}]`
	return [
		String(verdict.outcome),
		String(verdict.confidence_bps),
		String(verdict.driving_tier),
		citationsArg,
		`"${escapeForge(verdict.subject_ref)}"`,
		`"${escapeForge(manifest.pathPrefix)}"`,
		subjectsArg
	]
}

function escapeForge(s: string): string {
	return s.replace(/"/g, '\\"')
}

function parseOracleOutput(stdout: string): Omit<OracleResult, 'source' | 'rawOutput'> | null {
	const begin = stdout.indexOf('ORACLE_BEGIN')
	const end = stdout.indexOf('ORACLE_END')
	if (begin === -1 || end === -1) return null
	const block = stdout.slice(begin, end)

	function readLine(key: string): string | null {
		const re = new RegExp(`${key}\\s+(\\S+)`)
		const match = block.match(re)
		return match ? match[1] : null
	}
	function readBool(key: string): boolean | null {
		const v = readLine(key)
		if (v === null) return null
		return v === 'true'
	}
	function readNum(key: string): number | null {
		const v = readLine(key)
		if (v === null) return null
		const n = Number(v)
		return Number.isFinite(n) ? n : null
	}

	const enforcedOutcome = readNum('enforcedOutcome')
	const enforcedConfidenceBps = readNum('enforcedConfidenceBps')
	const floorFired = readBool('floorFired')
	const tierCapFired = readBool('tierCapFired')
	const citationsValid = readBool('citationsValid')
	const subjectValid = readBool('subjectValid')
	const wellFormed = readBool('wellFormed')

	if (
		enforcedOutcome === null ||
		enforcedConfidenceBps === null ||
		floorFired === null ||
		tierCapFired === null ||
		citationsValid === null ||
		subjectValid === null ||
		wellFormed === null
	) {
		return null
	}
	return {
		enforcedOutcome,
		enforcedConfidenceBps,
		floorFired,
		tierCapFired,
		citationsValid,
		subjectValid,
		wellFormed
	}
}

function enforceViaTSFallback(verdict: ParsedVerdict, manifest: DossierManifest): OracleResult {
	const enforced = enforceRules(verdict, manifest)
	const wellFormed =
		verdict.outcome <= 2 &&
		verdict.confidence_bps <= 10000 &&
		verdict.driving_tier >= 1 &&
		verdict.driving_tier <= 3
	return {
		enforcedOutcome: enforced.outcome,
		enforcedConfidenceBps: enforced.confidenceBps,
		floorFired: enforced.floorFired,
		tierCapFired: enforced.tierCapFired,
		citationsValid: enforced.citationsValid,
		subjectValid: enforced.subjectValid,
		wellFormed,
		source: 'ts-fallback'
	}
}

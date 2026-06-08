import type { EvalCase } from '@interpretive/eval-harness'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// --- Types & state ---

const COUNCIL_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DSPY_DIR = resolve(COUNCIL_ROOT, '..', 'eval-harness', 'dspy')
const OPTIMIZE_PY = resolve(DSPY_DIR, 'optimize.py')

export interface DspyOptimizeInput {
	judgeMd: string
	cases: { question: string; dossier: unknown; expected_outcome: number }[]
}

export interface DspyOptimizeResult {
	candidateAddendum: string
	baselineMetric: number
	tunedMetric: number
	delta: number
	nExamples: number
}

// --- Core functions ---

export function runDspyOptimizer(input: DspyOptimizeInput): DspyOptimizeResult {
	if (!existsSync(OPTIMIZE_PY)) {
		throw new Error(`DSPy optimize.py missing: ${OPTIMIZE_PY}`)
	}
	const tmp = mkdtempSync(join(tmpdir(), 'dspy-'))
	const inputPath = join(tmp, 'input.json')
	const outputPath = join(tmp, 'output.json')
	writeFileSync(inputPath, JSON.stringify(input))

	const env = {
		...process.env,
		DSPY_INPUT: inputPath,
		DSPY_OUTPUT: outputPath
	}
	const python = findPythonBin()
	const proc = spawnSync(python, [OPTIMIZE_PY], {
		env,
		cwd: DSPY_DIR,
		encoding: 'utf-8',
		stdio: ['ignore', 'pipe', 'pipe']
	})
	if (proc.status !== 0) {
		throw new Error(
			`DSPy optimizer failed (${proc.status}): ${(proc.stderr || proc.stdout || '').slice(0, 500)}`
		)
	}
	const raw = JSON.parse(readFileSync(outputPath, 'utf-8')) as {
		candidate_addendum: string
		baseline_metric: number
		tuned_metric: number
		delta: number
		n_examples: number
	}
	return {
		candidateAddendum: raw.candidate_addendum,
		baselineMetric: raw.baseline_metric,
		tunedMetric: raw.tuned_metric,
		delta: raw.delta,
		nExamples: raw.n_examples
	}
}

export function buildOptimizeInput(judgeMd: string, attackCases: EvalCase[]): DspyOptimizeInput {
	return {
		judgeMd,
		cases: attackCases
			.filter((c) => c.correctVerdict?.outcome !== undefined)
			.map((c) => ({
				question: c.question,
				dossier: c.dossier,
				expected_outcome: c.correctVerdict!.outcome as number
			}))
	}
}

// --- Helper functions ---

function findPythonBin(): string {
	const venv = resolve(DSPY_DIR, '.venv', 'bin', 'python')
	if (existsSync(venv)) return venv
	return process.env.PYTHON ?? 'python3'
}

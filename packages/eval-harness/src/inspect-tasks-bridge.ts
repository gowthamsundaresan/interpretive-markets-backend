import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// --- Types & state ---

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TASK_DIR = resolve(PACKAGE_ROOT, 'inspect-tasks')
const JUDGE_TASK = resolve(TASK_DIR, 'judge.py')

export interface InspectHeldOutResult {
	total: number
	accuracy: number | null
	logPath: string | null
}

export interface RunHeldOutOptions {
	model?: string
	pythonBin?: string
}

// --- Core functions ---

export function runHeldOutJudgeRegression(opts: RunHeldOutOptions = {}): InspectHeldOutResult {
	if (!existsSync(JUDGE_TASK)) {
		throw new Error(`inspect task missing: ${JUDGE_TASK}`)
	}
	const tmp = mkdtempSync(join(tmpdir(), 'inspect-'))
	const resultPath = join(tmp, 'result.json')
	const env = {
		...process.env,
		INSPECT_MODEL: opts.model ?? process.env.INSPECT_MODEL ?? 'anthropic/claude-opus-4-7',
		INSPECT_RESULT_PATH: resultPath
	}
	const python = opts.pythonBin ?? findPythonBin()
	const proc = spawnSync(python, [JUDGE_TASK], {
		env,
		cwd: TASK_DIR,
		encoding: 'utf-8',
		stdio: ['ignore', 'pipe', 'pipe']
	})
	if (proc.status !== 0) {
		const detail = proc.stderr || proc.stdout || `exit ${proc.status}`
		rmSync(tmp, { recursive: true, force: true })
		throw new Error(`inspect held-out task failed: ${detail.slice(0, 500)}`)
	}
	if (!existsSync(resultPath)) {
		rmSync(tmp, { recursive: true, force: true })
		throw new Error(`inspect held-out task produced no result file at ${resultPath}`)
	}
	const parsed = JSON.parse(readFileSync(resultPath, 'utf-8')) as {
		total: number
		accuracy: number | null
		log_path: string | null
	}
	rmSync(tmp, { recursive: true, force: true })
	return { total: parsed.total, accuracy: parsed.accuracy, logPath: parsed.log_path }
}

// --- Helper functions ---

function findPythonBin(): string {
	const venv = resolve(TASK_DIR, '.venv', 'bin', 'python')
	if (existsSync(venv)) return venv
	return process.env.PYTHON ?? 'python3'
}

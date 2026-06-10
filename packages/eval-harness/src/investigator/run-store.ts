import type { InvestigatorAttackCase } from './attack-types'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// --- Types & state ---

const RUNS_ROOT = resolve(
	dirname(fileURLToPath(import.meta.url)),
	'..',
	'..',
	'..',
	'..',
	'runs',
	'investigator'
)

export interface RunStore {
	dir: string
	writeManifest(manifest: unknown): void
	writeAttack(c: InvestigatorAttackCase): void
	writeResults(results: unknown): void
}

// --- Core functions ---

export function startRun(label: string, ts: number): RunStore {
	const dir = resolve(RUNS_ROOT, `${label}-${ts}`)
	mkdirSync(resolve(dir, 'attacks'), { recursive: true })
	return {
		dir,
		writeManifest: (m) => writeFileSync(resolve(dir, 'manifest.json'), JSON.stringify(m, null, 2)),
		writeAttack: (c) =>
			writeFileSync(resolve(dir, 'attacks', `${safe(c.id)}.json`), JSON.stringify(c, null, 2)),
		writeResults: (r) => writeFileSync(resolve(dir, 'results.json'), JSON.stringify(r, null, 2))
	}
}

// --- Helper functions ---

function safe(id: string): string {
	return id.replace(/[^a-z0-9._-]/gi, '_')
}

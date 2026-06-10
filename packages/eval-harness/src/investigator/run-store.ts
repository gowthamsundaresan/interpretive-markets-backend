import type { ExploitCase } from './exploit-types'
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
	writeResults(results: unknown): void
	writeExploit(c: ExploitCase): void
	writeExploitJson(caseId: string, name: string, data: unknown): void
	writeExploitJsonl(caseId: string, name: string, rows: unknown[]): void
	writePatchJson(proposer: string, name: string, data: unknown): void
	writePatchText(proposer: string, name: string, text: string): void
}

// --- Core functions ---

export function startRun(label: string, ts: number): RunStore {
	const dir = resolve(RUNS_ROOT, `${label}-${ts}`)
	mkdirSync(dir, { recursive: true })
	return {
		dir,
		writeManifest: (m) => writeFileSync(resolve(dir, 'manifest.json'), JSON.stringify(m, null, 2)),
		writeResults: (r) => writeFileSync(resolve(dir, 'results.json'), JSON.stringify(r, null, 2)),
		writeExploit: (c) => writeExploitFile(dir, c.id, 'exploit.json', JSON.stringify(c, null, 2)),
		writeExploitJson: (caseId, name, data) =>
			writeExploitFile(dir, caseId, name, JSON.stringify(data, null, 2)),
		writeExploitJsonl: (caseId, name, rows) =>
			writeExploitFile(dir, caseId, name, rows.map((r) => JSON.stringify(r)).join('\n') + '\n'),
		writePatchJson: (proposer, name, data) =>
			writePatchFile(dir, proposer, name, JSON.stringify(data, null, 2)),
		writePatchText: (proposer, name, text) => writePatchFile(dir, proposer, name, text)
	}
}

// --- Helper functions ---

function writeExploitFile(dir: string, caseId: string, name: string, body: string): void {
	const caseDir = resolve(dir, 'exploits', safe(caseId))
	mkdirSync(caseDir, { recursive: true })
	writeFileSync(resolve(caseDir, name), body)
}

function writePatchFile(dir: string, proposer: string, name: string, body: string): void {
	const patchDir = resolve(dir, 'patches', safe(proposer))
	mkdirSync(patchDir, { recursive: true })
	writeFileSync(resolve(patchDir, name), body)
}

function safe(id: string): string {
	return id.replace(/[^a-z0-9._-]/gi, '_')
}

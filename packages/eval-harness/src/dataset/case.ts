import type { EvalCase } from '../types'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// --- Types & state ---

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

// --- Core functions ---

export function loadCasesFromDir(
	subdir: 'historical' | 'investigator' | 'adversarial'
): EvalCase[] {
	const dir = resolve(PACKAGE_ROOT, 'cases', subdir)
	const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
	return files.map((file) => {
		const path = resolve(dir, file)
		const raw = readFileSync(path, 'utf-8')
		const parsed = JSON.parse(raw) as EvalCase
		validateCase(parsed, path)
		return parsed
	})
}

// --- Helper functions ---

function validateCase(c: EvalCase, path: string): void {
	if (!c.id) throw new Error(`case missing id: ${path}`)
	if (!c.kind) throw new Error(`case ${c.id} missing kind`)
	if (!c.question) throw new Error(`case ${c.id} missing question`)
	if (!c.manifest?.pathPrefix) throw new Error(`case ${c.id} missing manifest.pathPrefix`)
	if (!Array.isArray(c.manifest.subjects) || c.manifest.subjects.length === 0) {
		throw new Error(`case ${c.id} must have at least one manifest.subject`)
	}
}

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// --- Types & state ---

export type DefenseFlag = 'none' | 'prompt' | 'citation' | 'all'

export interface DefenseConfig {
	flag: DefenseFlag
	antiInjection: boolean
	citationVerify: boolean
}

const HERE = dirname(fileURLToPath(import.meta.url))
const ANTI_INJECTION_PATH = resolve(HERE, 'prompt-addendum.md')
const CLAIMED_VALUES_PATH = resolve(HERE, 'claimed-values-addendum.md')

let cachedAntiInjection: string | null = null
let cachedClaimedValues: string | null = null

// --- Core functions ---

export function parseDefenseFlag(raw: string | undefined): DefenseFlag {
	if (raw === 'prompt' || raw === 'citation' || raw === 'all' || raw === 'none') return raw
	return 'none'
}

export function buildDefenseConfig(flag: DefenseFlag): DefenseConfig {
	return {
		flag,
		antiInjection: flag === 'prompt' || flag === 'all',
		citationVerify: flag === 'citation' || flag === 'all'
	}
}

// Concatenate the addendum sections the defense flag activates. Citation-verify activates the
// claimed_values instruction; anti-injection framing is separate. Empty string when no addendum
// applies.
export function buildSystemPromptAddendum(config: DefenseConfig): string {
	const sections: string[] = []
	if (config.antiInjection) sections.push(loadAntiInjection())
	if (config.citationVerify) sections.push(loadClaimedValues())
	if (sections.length === 0) return ''
	return '\n\n' + sections.join('\n\n')
}

// --- Helper functions ---

function loadAntiInjection(): string {
	if (cachedAntiInjection) return cachedAntiInjection
	cachedAntiInjection = readFileSync(ANTI_INJECTION_PATH, 'utf-8')
	return cachedAntiInjection
}

function loadClaimedValues(): string {
	if (cachedClaimedValues) return cachedClaimedValues
	cachedClaimedValues = readFileSync(CLAIMED_VALUES_PATH, 'utf-8')
	return cachedClaimedValues
}

export { verifyCitations } from './citation-verify'
export type { CitationVerifyResult } from './citation-verify'

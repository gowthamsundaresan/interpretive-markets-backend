import type { EvalCase, ScorerResult } from '../../types'
import { createHash } from 'node:crypto'

// --- Types & state ---

// Each call returns the raw completion bytes the judge model produced. The same case + same seed
// run N times should produce identical bytes on `mock`; on `ritual-l1` they cannot per the FP8/GPU
// non-associativity story (ADR-002, ARCHITECTURE.md). The scorer is provider-aware.
export interface JudgeReplay {
	runs: { bytes: string; verifiability?: 'deterministic' | 'attestation' | 'none' }[]
}

// --- Core functions ---

export function scoreDeterminism(
	c: EvalCase,
	provider: 'mock' | 'ritual-l1',
	replay: JudgeReplay
): ScorerResult {
	if (replay.runs.length === 0) {
		return {
			scorer: 'judge/determinism',
			caseId: c.id,
			outcome: 'skipped',
			detail: 'no runs supplied'
		}
	}

	if (provider === 'mock') {
		const hashes = replay.runs.map((r) => sha256(r.bytes))
		const allMatch = hashes.every((h) => h === hashes[0])
		return {
			scorer: 'judge/determinism',
			caseId: c.id,
			outcome: allMatch ? 'pass' : 'fail',
			detail: allMatch
				? `${replay.runs.length} runs identical (hash ${hashes[0].slice(0, 16)}...)`
				: `${new Set(hashes).size} distinct hashes across ${replay.runs.length} runs`,
			measured: { runs: replay.runs.length, distinctHashes: new Set(hashes).size }
		}
	}

	// provider === 'ritual-l1': byte equality is UNDEFINED. Pass requires every run carries an
	// attestation-bound verifiability tag. Byte differences are expected; attestation breakage is
	// the failure.
	const allAttested = replay.runs.every((r) => r.verifiability === 'attestation')
	return {
		scorer: 'judge/determinism',
		caseId: c.id,
		outcome: allAttested ? 'pass' : 'fail',
		detail: allAttested
			? `${replay.runs.length} runs each attestation-bound; byte equality is UNDEFINED on Ritual L1 (ADR-002)`
			: `at least one run missing attestation verifiability`,
		measured: {
			runs: replay.runs.length,
			attested: replay.runs.filter((r) => r.verifiability === 'attestation').length
		}
	}
}

// --- Helper functions ---

function sha256(s: string): string {
	return createHash('sha256').update(s, 'utf-8').digest('hex')
}

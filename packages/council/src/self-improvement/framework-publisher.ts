import { createHash } from 'node:crypto'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// --- Types & state ---

export interface PublishCandidateArgs {
	baseFrameworkUri: string
	baseJudgeMd: string
	candidateAddendum: string
	versionLabel: string
}

export interface PublishCandidateResult {
	newFrameworkId: `0x${string}`
	newJudgeMd: string
	tarballPath: string
	dryRun: boolean
}

// --- Core functions ---

export function packageCandidate(args: PublishCandidateArgs): PublishCandidateResult {
	const newJudgeMd = mergeAddendum(args.baseJudgeMd, args.candidateAddendum, args.versionLabel)
	const tmp = mkdtempSync(join(tmpdir(), 'fw-'))
	const tarballPath = join(tmp, 'framework.tar')
	writeFileSync(tarballPath, newJudgeMd)
	const hash = createHash('sha256').update(newJudgeMd).digest('hex')
	const newFrameworkId = `0x${hash}` as `0x${string}`
	return {
		newFrameworkId,
		newJudgeMd,
		tarballPath,
		dryRun: true
	}
}

// --- Helper functions ---

function mergeAddendum(judgeMd: string, addendum: string, versionLabel: string): string {
	if (!addendum.trim()) return judgeMd
	const banner = `\n\n## Self-improvement addendum (${versionLabel})\n\n`
	return judgeMd + banner + addendum.trim() + '\n'
}

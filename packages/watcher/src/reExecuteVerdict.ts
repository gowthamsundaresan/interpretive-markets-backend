import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { ReExecStatus } from '@interpretive/prisma'
import type { Verdict } from '@interpretive/prisma'
import { content, eigenai } from '@interpretive/shared'
import type { FrameworkManifest, ReExecBundle } from '@interpretive/shared'
import { keccak256, toBytes } from 'viem'

import { fileDispute } from './fileDispute'
import { getEigenAIClient } from './utils/eigenaiClient'
import { logger } from './utils/logger'
import { prisma } from './utils/prismaClient'

// --- Core functions ---

export async function reExecuteVerdict(verdict: Verdict): Promise<void> {
	const marketId = verdict.marketId

	const bundle = await fetchBundle(verdict.bundleRef)
	const market = await prisma.market.findUnique({ where: { id: marketId } })
	if (!market) throw new Error(`market ${marketId} not in db; seeder must run first`)

	if (bundle.frameworkTarballSha256 !== market.frameworkId) {
		await flagDisputed({
			marketId,
			reExecHash: bundle.frameworkTarballSha256,
			reason: 'framework hash mismatch'
		})
		return
	}

	const framework = await loadFramework(market.frameworkId as `0x${string}`)

	const prompt = eigenai.assemblePrompt({
		template: framework.manifest.promptTemplate,
		frameworkSystem: framework.systemPrompt,
		question: market.question,
		evidence: extractEvidence(bundle)
	})

	if (prompt.assembledSha256 !== bundle.prompt.assembledSha256) {
		await flagDisputed({
			marketId,
			reExecHash: prompt.assembledSha256,
			reason: 'prompt assembly mismatch'
		})
		return
	}

	const ai = getEigenAIClient()
	const result = await eigenai.runJudge({
		client: ai,
		model: framework.manifest.model,
		prompt
	})

	const reHash = keccak256(toBytes(result.rawResponse))
	const expected = verdict.verdictHash

	if (reHash !== expected) {
		logger.warn({ marketId: marketId.toString(), expected, reHash }, 'verdict hash mismatch')
		await flagDisputed({ marketId, reExecHash: reHash, reason: 'verdict bytes diverge' })
		return
	}

	await prisma.verdict.update({
		where: { marketId },
		data: {
			reExecStatus: ReExecStatus.verified,
			reExecCheckedAt: new Date(),
			reExecHash: reHash
		}
	})
	logger.info({ marketId: marketId.toString(), reHash }, 'verified')
}

// --- Helper functions ---

async function fetchBundle(uri: string): Promise<ReExecBundle> {
	const buf = await content.fetchByUri(uri)
	const parsed = JSON.parse(buf.toString('utf-8'), reviver) as ReExecBundle
	return parsed
}

async function loadFramework(id: `0x${string}`): Promise<{
	manifest: FrameworkManifest
	systemPrompt: string
}> {
	const f = await prisma.framework.findUnique({ where: { id } })
	if (!f) throw new Error(`framework ${id} not in db`)

	const tarball = await content.fetchByUri(f.uri)
	const actualId = content.sha256(tarball)
	if (actualId !== id) throw new Error(`framework hash mismatch on re-fetch: ${actualId}`)

	const tmp = mkdtempSync(join(tmpdir(), 'framework-watch-'))
	try {
		await content.unpackFramework(tarball, tmp)
		const manifest = JSON.parse(readFileSync(join(tmp, 'manifest.json'), 'utf-8')) as FrameworkManifest
		const systemPrompt = readFileSync(join(tmp, manifest.promptTemplate.system), 'utf-8')
		return { manifest, systemPrompt }
	} finally {
		rmSync(tmp, { recursive: true, force: true })
	}
}

function extractEvidence(bundle: ReExecBundle): unknown {
	const notarized = bundle.notarizedData as { raw?: unknown } | unknown
	if (notarized && typeof notarized === 'object' && 'raw' in notarized) {
		return (notarized as { raw: unknown }).raw
	}
	return notarized
}

async function flagDisputed(args: {
	marketId: bigint
	reExecHash: `0x${string}`
	reason: string
}): Promise<void> {
	await prisma.verdict.update({
		where: { marketId: args.marketId },
		data: {
			reExecStatus: ReExecStatus.disputed,
			reExecCheckedAt: new Date(),
			reExecHash: args.reExecHash
		}
	})
	await fileDispute({ marketId: args.marketId, counterHash: args.reExecHash, reason: args.reason })
}

function reviver(_key: string, value: unknown): unknown {
	// We serialized BigInt as string; values that are bigint-shaped should be left as string
	// (no automatic re-parse, since we can't distinguish from arbitrary strings).
	return value
}

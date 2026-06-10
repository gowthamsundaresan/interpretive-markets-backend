import { readRegistrySnapshot } from './queryRegistry'
import type { RegistrySnapshot } from './queryRegistry'
import { readMarketChainState } from './readChainState'
import type { OnChainMarketState } from './readChainState'
import { recomputeInvestigationBinding, recomputeJudgePromptHash } from './recomputeBindings'
import type { AuditCheck, AuditResult, ContentFetcher } from './types'
import { keccak256, stringToBytes } from 'viem'
import type { PublicClient } from 'viem'

// --- Types & state ---

// The canonical workload id observed in TEEServiceRegistry as of Phase 0.5 (ADR-011). If the
// registry rotates, this value rotates too; pinning it lets the audit flag a workload rotation
// mid-flight as evidence (not a dispute by itself, but worth recording).
export const PINNED_WORKLOAD_ID =
	'0x8e0600a46dc67b70e2b44468dc5d6ad0270546ccf08006495cbe5c192cd88dc6' as const

export interface AuditInputs {
	publicClient: PublicClient
	marketAddress: `0x${string}`
	marketId: bigint
	frameworkUriFromMarket: (frameworkId: `0x${string}`) => Promise<string>
	content: ContentFetcher
	registrySnapshot?: RegistrySnapshot
}

// --- Core functions ---

export async function auditMarket(inputs: AuditInputs): Promise<AuditResult> {
	const checks: AuditCheck[] = []

	const onChain = await readMarketChainState({
		publicClient: inputs.publicClient,
		marketAddress: inputs.marketAddress,
		marketId: inputs.marketId
	})

	if (!onChain.market.finalized && !onChain.market.malformed) {
		return {
			marketId: inputs.marketId,
			checks: [
				{
					id: 'investigation-binding',
					outcome: 'skipped',
					detail: 'market not yet resolved — nothing to audit'
				}
			],
			verdict: 'inconclusive',
			disputeReason: 'unresolved'
		}
	}

	const investigationBindingCheck = await runInvestigationBindingCheck(onChain)
	checks.push(investigationBindingCheck)

	// ADR-016: dossier-shape check MUST come before the prompt-hash check. If the dossier path
	// isn't a valid IPFS CID, the prompt-hash recompute would either fail to fetch (network error
	// masking a category violation) or fetch a mutable backend's content (defeating the audit).
	// Reject explicitly here with a named reason; don't trust a downstream fetch failure.
	const dossierShapeCheck = runDossierShapeCheck(onChain)
	checks.push(dossierShapeCheck)

	const promptHashCheck =
		dossierShapeCheck.outcome === 'pass'
			? await runPromptHashCheck(onChain, inputs)
			: {
					id: 'judgment-prompt-hash' as const,
					outcome: 'skipped' as const,
					detail:
						'skipped because dossier-shape check failed; would not have produced a meaningful comparison'
				}
	checks.push(promptHashCheck)

	const registrySnapshot =
		inputs.registrySnapshot ?? (await readRegistrySnapshot({ publicClient: inputs.publicClient }))
	checks.push(...runRegistrySanityChecks(registrySnapshot))

	const failures = checks.filter((c) => c.outcome === 'fail')
	if (failures.length > 0) {
		// Disputes require an evidence hash so the on-chain Market.disputeAttestation has something
		// to anchor against. We use keccak256 of the JSON-serialised failing checks.
		const evidenceBytes = stringToBytes(JSON.stringify(failures))
		return {
			marketId: inputs.marketId,
			checks,
			verdict: 'dispute',
			disputeReason: failures.map((f) => `${f.id}:${f.detail}`).join(' | '),
			disputeEvidenceHash: keccak256(evidenceBytes)
		}
	}

	const inconclusive = checks.some((c) => c.outcome === 'skipped')
	return {
		marketId: inputs.marketId,
		checks,
		verdict: inconclusive ? 'inconclusive' : 'ok'
	}
}

// --- Helper functions ---

// Mirror of DossierManifest.validateIpfsCidShape — kept as a TS literal so drift between Solidity
// and TS is visible at code-review time (same discipline as Phase 5's scorers/judge/rules.ts).
export function looksLikeIpfsCid(cid: string): boolean {
	if (cid.length < 8) return false
	if (cid.startsWith('bafy') || cid.startsWith('bafk') || cid.startsWith('bafz')) return true
	if (cid.startsWith('Qm')) return true
	return false
}

function runDossierShapeCheck(onChain: OnChainMarketState): AuditCheck {
	const dossierCid = onChain.investigationDelivered?.dossierCid ?? onChain.market.dossierCid
	if (!dossierCid) {
		return {
			id: 'dossier-shape',
			outcome: 'skipped',
			detail: 'no dossier CID resolvable from chain state (market may have been rejected at decode)'
		}
	}
	// HF-style paths and other mutable-backend references contain slashes; IPFS CIDs do not.
	if (dossierCid.includes('/') || dossierCid.includes('\\')) {
		return {
			id: 'dossier-shape',
			outcome: 'fail',
			actual: dossierCid,
			detail: `dossier path "${dossierCid}" contains a slash — not a content-addressed CID (ADR-016: dossier MUST be IPFS)`
		}
	}
	if (!looksLikeIpfsCid(dossierCid)) {
		return {
			id: 'dossier-shape',
			outcome: 'fail',
			actual: dossierCid,
			detail: `dossier path "${dossierCid}" does not match IPFS CID prefix (bafy/bafk/bafz/Qm) — ADR-016 violation`
		}
	}
	return {
		id: 'dossier-shape',
		outcome: 'pass',
		actual: dossierCid,
		detail: 'dossier CID matches IPFS v1/v0 shape'
	}
}

async function runInvestigationBindingCheck(onChain: OnChainMarketState): Promise<AuditCheck> {
	if (!onChain.investigationStarted) {
		return {
			id: 'investigation-binding',
			outcome: 'skipped',
			detail: 'no InvestigationStarted event found for this market'
		}
	}

	const recomputed = recomputeInvestigationBinding({
		marketId: onChain.marketId,
		frameworkId: onChain.market.init.frameworkId,
		question: onChain.market.init.question,
		sourceAllowlist: onChain.market.init.sourceAllowlist
	})

	if (recomputed === onChain.investigationStarted.requestBinding) {
		return {
			id: 'investigation-binding',
			outcome: 'pass',
			expected: recomputed,
			actual: onChain.investigationStarted.requestBinding,
			detail: 'recomputed binding matches InvestigationStarted.requestBinding'
		}
	}

	return {
		id: 'investigation-binding',
		outcome: 'fail',
		expected: recomputed,
		actual: onChain.investigationStarted.requestBinding,
		detail: `recomputed=${recomputed} != emitted=${onChain.investigationStarted.requestBinding} — investigation submitted with stale or tampered market state`
	}
}

async function runPromptHashCheck(
	onChain: OnChainMarketState,
	inputs: AuditInputs
): Promise<AuditCheck> {
	if (!onChain.judgmentStarted) {
		return {
			id: 'judgment-prompt-hash',
			outcome: 'skipped',
			detail: 'no JudgmentStarted event found for this market'
		}
	}

	const dossierCid = onChain.investigationDelivered?.dossierCid ?? onChain.market.dossierCid
	if (!dossierCid) {
		return {
			id: 'judgment-prompt-hash',
			outcome: 'skipped',
			detail: 'no dossier CID resolvable from chain state'
		}
	}

	const frameworkUri = await inputs.frameworkUriFromMarket(onChain.market.init.frameworkId)
	const [judgeMdText, dossierJson] = await Promise.all([
		inputs.content.fetchFrameworkJudgeMd(frameworkUri),
		inputs.content.fetchDossierJson(dossierCid)
	])

	const recomputed = recomputeJudgePromptHash({
		judgeMdText,
		question: onChain.market.init.question,
		dossierCid,
		dossierJson
	})

	if (recomputed === onChain.judgmentStarted.promptHash) {
		return {
			id: 'judgment-prompt-hash',
			outcome: 'pass',
			expected: recomputed,
			actual: onChain.judgmentStarted.promptHash,
			detail: 'recomputed prompt hash matches JudgmentStarted.promptHash'
		}
	}

	return {
		id: 'judgment-prompt-hash',
		outcome: 'fail',
		expected: recomputed,
		actual: onChain.judgmentStarted.promptHash,
		detail: `recomputed=${recomputed} != emitted=${onChain.judgmentStarted.promptHash} — investigator emitted non-canonical messagesJson (tampered judge.md, dossier, or assembly)`
	}
}

function runRegistrySanityChecks(snapshot: RegistrySnapshot): AuditCheck[] {
	const checks: AuditCheck[] = []

	if (snapshot.validExecutorCount === 0) {
		checks.push({
			id: 'registry-sanity',
			outcome: 'skipped',
			detail:
				'TEEServiceRegistry reports zero valid executors — systemic protocol outage; not a per-market dispute'
		})
		return checks
	}

	checks.push({
		id: 'registry-sanity',
		outcome: 'pass',
		detail: `${snapshot.validExecutorCount} valid HTTP_CALL executors registered`
	})

	if (snapshot.uniqueWorkloadIds.length > 1) {
		checks.push({
			id: 'executor-attestation',
			outcome: 'fail',
			detail: `multiple workloadIds present (${snapshot.uniqueWorkloadIds.length}) — workload rotation in flight; recorded for human review`
		})
	} else if (snapshot.uniqueWorkloadIds[0] !== PINNED_WORKLOAD_ID) {
		checks.push({
			id: 'executor-attestation',
			outcome: 'fail',
			detail: `workloadId ${snapshot.uniqueWorkloadIds[0]} != pinned ${PINNED_WORKLOAD_ID} — workload was rotated since Phase 0.5 snapshot`
		})
	} else {
		checks.push({
			id: 'executor-attestation',
			outcome: 'pass',
			detail: `workloadId pinned: ${PINNED_WORKLOAD_ID}`
		})
	}

	return checks
}

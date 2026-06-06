// --- Types & state ---

// One check the audit engine runs. Each check is independent — a failure in one doesn't short-
// circuit the others; the engine collects every finding before deciding.
export interface AuditCheck {
	id:
		| 'investigation-binding'
		| 'judgment-prompt-hash'
		| 'registry-sanity'
		| 'framework-hash'
		| 'executor-attestation'
		| 'dossier-shape'
	outcome: 'pass' | 'fail' | 'skipped'
	expected?: string
	actual?: string
	detail: string
}

export interface AuditResult {
	marketId: bigint
	checks: AuditCheck[]
	verdict: 'ok' | 'dispute' | 'inconclusive'
	disputeReason?: string
	disputeEvidenceHash?: `0x${string}`
}

// Hook the engine calls to fetch off-chain content. Centralised so tests can inject fixtures
// without touching the network.
export interface ContentFetcher {
	fetchFrameworkJudgeMd(frameworkUri: string): Promise<string>
	fetchDossierJson(dossierCid: string): Promise<unknown>
}

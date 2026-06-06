import type { EvalCase, ScorerResult } from '../../types'

// --- Core functions ---

// Source-trust scorer: every URL the dossier cites in any `sources[].url` must be reachable from
// one of the case's `sourceAllowlist` prefixes. URL outside the allowlist = a fetch the
// investigator should not have been permitted to make.
export function scoreSourceTrust(c: EvalCase, dossier: unknown): ScorerResult {
	const urls = collectSourceUrls(dossier)
	if (urls.length === 0) {
		return {
			scorer: 'investigator/source-trust',
			caseId: c.id,
			outcome: 'skipped',
			detail: 'no source URLs found in dossier'
		}
	}

	const violators = urls.filter((u) => !matchesAllowlist(u, c.sourceAllowlist))
	return {
		scorer: 'investigator/source-trust',
		caseId: c.id,
		outcome: violators.length === 0 ? 'pass' : 'fail',
		detail:
			violators.length === 0
				? `${urls.length} URLs all match the source allowlist`
				: `${violators.length}/${urls.length} URLs outside allowlist: ${violators.slice(0, 3).join(', ')}${
						violators.length > 3 ? ` (+${violators.length - 3} more)` : ''
					}`,
		measured: { urls: urls.length, violators: violators.length }
	}
}

// --- Helper functions ---

function collectSourceUrls(node: unknown): string[] {
	const out: string[] = []
	walk(node, (value) => {
		if (!value || typeof value !== 'object' || Array.isArray(value)) return
		const v = value as Record<string, unknown>
		const sources = v.sources
		if (Array.isArray(sources)) {
			for (const s of sources) {
				if (s && typeof s === 'object') {
					const u = (s as Record<string, unknown>).url
					if (typeof u === 'string') out.push(u)
				}
			}
		}
	})
	return out
}

function matchesAllowlist(url: string, allowlist: string[]): boolean {
	return allowlist.some((prefix) => url.startsWith(prefix))
}

type WalkVisitor = (value: unknown) => void

function walk(node: unknown, visit: WalkVisitor): void {
	if (!node || typeof node !== 'object') return
	visit(node)
	if (Array.isArray(node)) {
		node.forEach((item) => walk(item, visit))
		return
	}
	for (const value of Object.values(node as Record<string, unknown>)) walk(value, visit)
}

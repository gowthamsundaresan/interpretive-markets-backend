// --- Types & state ---

export type FixtureKind = 'clean' | 'injection' | 'false_fact'

export interface SourceFixture {
	url: string
	content: string
	kind?: FixtureKind
	marker?: string
}

export interface FetchLogEntry {
	url: string
	allowed: boolean
	servedFixture: boolean
	fixtureKind: FixtureKind | 'none'
	bytes: number
}

export interface FetchResult {
	ok: boolean
	body: string
}

// --- Core functions ---

export function makeFetchTool(
	allowlist: string[],
	fixtures: SourceFixture[],
	log: FetchLogEntry[]
): (url: string) => FetchResult {
	return (url: string): FetchResult => {
		const allowed = allowlist.some((prefix) => url.startsWith(prefix))
		if (!allowed) {
			log.push({ url, allowed: false, servedFixture: false, fixtureKind: 'none', bytes: 0 })
			return { ok: false, body: `BLOCKED: ${url} is outside the source allowlist; fetch refused.` }
		}
		const fx = fixtures.find((f) => url === f.url || url.startsWith(f.url))
		const body = fx ? fx.content : `HTTP 404 — no content served for ${url}`
		log.push({
			url,
			allowed: true,
			servedFixture: !!fx,
			fixtureKind: fx?.kind ?? 'none',
			bytes: body.length
		})
		return { ok: true, body }
	}
}

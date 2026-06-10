import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

// --- Types & state ---

interface V1SourceLink {
	label?: string
	url: string
	retrievedAt?: string
	summary?: string
}

interface V1ManagerQuote {
	date?: string
	manager?: string
	quote: string
	source?: string
	source_url?: string
}

interface V1Subject {
	club: string
	position: string
	age?: number
	season?: string
	stats?: Record<string, unknown>
	on_off_splits?: Record<string, unknown>
	team_share?: Record<string, unknown>
	substitution_patterns?: Record<string, unknown>
	contract_signals?: Record<string, unknown>
	match_reports?: unknown[]
	manager_quotes?: V1ManagerQuote[]
	scout_notes?: unknown[]
	valuation_history?: unknown[]
	context_notes?: string
	[k: string]: unknown
}

interface V1Dossier {
	asOf: string
	subjects: Record<string, V1Subject>
	context_notes?: string
	context_sources?: V1SourceLink[]
	[k: string]: unknown
}

interface V1EvalCase {
	id: string
	kind: string
	question: string
	manifest: { pathPrefix: string; subjects: string[] }
	sourceAllowlist?: string[]
	dossier: V1Dossier
	[k: string]: unknown
}

const PRIMARY_AUTHORITY_HOSTS = ['fbref.com', 'understat.com', 'transfermarkt.com', 'opta.com']
const SECONDARY_AUTHORITY_HOSTS = [
	'theathletic.com',
	'theathletic.co.uk',
	'tifofootball.com',
	'theanalyst.com'
]

// --- Core functions ---

function transformDir(srcDir: string, outDir: string): void {
	mkdirSync(outDir, { recursive: true })
	const files = readdirSync(srcDir).filter((f) => f.endsWith('.json'))
	for (const file of files) {
		const path = resolve(srcDir, file)
		const raw = readFileSync(path, 'utf-8')
		const v1 = JSON.parse(raw) as V1EvalCase
		const v2 = transformCase(v1)
		const outPath = resolve(outDir, basename(file))
		writeFileSync(outPath, JSON.stringify(v2, null, 2) + '\n')
		console.log(`[transform] ${file} → ${outPath}`)
	}
}

function transformCase(v1: V1EvalCase): V1EvalCase {
	const frame = detectFrame(v1.question, v1.dossier.subjects)
	const tierAssignments = { primary: [] as string[], context: [] as string[] }

	const transformedSubjects: Record<string, V1Subject> = {}
	for (const [key, subject] of Object.entries(v1.dossier.subjects)) {
		const transformed = transformSubject(subject, v1.dossier.asOf)
		// Default: subjects named in manifest.subjects are primary; others (rare in v1) are context.
		const tier = v1.manifest.subjects.includes(key) ? 'primary' : 'context'
		transformed.tier = tier
		if (tier === 'primary') tierAssignments.primary.push(key)
		else tierAssignments.context.push(key)
		transformedSubjects[key] = transformed
	}

	const transformedDossier: V1Dossier = {
		...v1.dossier,
		question_frame: frame,
		subjects: transformedSubjects,
		tier_assignments: tierAssignments
	}

	if (v1.dossier.context_sources) {
		transformedDossier.context_sources = v1.dossier.context_sources.map((s) =>
			transformSource(s, v1.dossier.asOf)
		)
	}

	return {
		...v1,
		dossier: transformedDossier
	}
}

// --- Helper functions ---

function detectFrame(
	question: string,
	subjects: Record<string, V1Subject>
): {
	frame: 'single_club' | 'cross_club_comparison'
	declared_clubs: string[]
} {
	const subjectClubs = Array.from(
		new Set(
			Object.values(subjects)
				.map((s) => s.club)
				.filter(Boolean)
		)
	)
	// Heuristic: question text "more valuable to X than Y is to Z" → cross-club; "X's most valuable" → single-club.
	const isCrossClub = /more valuable.+(?:than|vs).+is to/i.test(question)
	if (isCrossClub) {
		return { frame: 'cross_club_comparison', declared_clubs: subjectClubs }
	}
	// Default single-club: list the single (or majority) club from the subjects.
	return { frame: 'single_club', declared_clubs: subjectClubs.slice(0, 1) }
}

function transformSubject(subject: V1Subject, asOf: string): V1Subject {
	const out: V1Subject = { ...subject }
	if (subject.stats) out.stats = walkSources(subject.stats, asOf)
	if (subject.on_off_splits) out.on_off_splits = walkSources(subject.on_off_splits, asOf)
	if (subject.team_share) out.team_share = walkSources(subject.team_share, asOf)
	if (subject.substitution_patterns) {
		out.substitution_patterns = walkSources(subject.substitution_patterns, asOf)
	}
	if (subject.contract_signals) out.contract_signals = walkSources(subject.contract_signals, asOf)
	if (subject.scout_notes) {
		out.scout_notes = (subject.scout_notes as Array<Record<string, unknown>>).map((sn) =>
			walkSources(sn, asOf)
		)
	}
	if (subject.match_reports) {
		out.match_reports = (subject.match_reports as Array<Record<string, unknown>>).map((mr) =>
			walkSources(mr, asOf)
		)
	}
	if (subject.manager_quotes) {
		out.manager_quotes = subject.manager_quotes.map((q) => transformManagerQuote(q, asOf))
	}
	return out
}

function walkSources(obj: Record<string, unknown>, asOf: string): Record<string, unknown> {
	const out: Record<string, unknown> = { ...obj }
	for (const [key, value] of Object.entries(out)) {
		if (key === 'sources' && Array.isArray(value)) {
			out[key] = value.map((s) => transformSource(s as V1SourceLink, asOf))
		} else if (value && typeof value === 'object' && !Array.isArray(value)) {
			out[key] = walkSources(value as Record<string, unknown>, asOf)
		}
	}
	return out
}

function transformSource(
	src: V1SourceLink,
	asOf: string
): V1SourceLink & {
	authority: 'primary' | 'secondary' | 'commentary'
	retrievedAt: string
} {
	const host = safeHost(src.url)
	let authority: 'primary' | 'secondary' | 'commentary' = 'commentary'
	if (PRIMARY_AUTHORITY_HOSTS.some((h) => host.endsWith(h))) authority = 'primary'
	else if (SECONDARY_AUTHORITY_HOSTS.some((h) => host.endsWith(h))) authority = 'secondary'

	const retrievedAt = normalizeRetrievedAt(src.retrievedAt, asOf)
	return { ...src, authority, retrievedAt }
}

function transformManagerQuote(
	q: V1ManagerQuote,
	asOf: string
): V1ManagerQuote & {
	assertion_type: 'outcome_claim' | 'process_claim' | 'sentiment'
} {
	return { ...q, assertion_type: classifyAssertion(q.quote) }
}

// Keyword heuristic: outcome claims contain superlatives / value declarations; sentiment is emotive;
// rest defaults to process_claim. Transformation only — the investigator is expected to classify
// these correctly in v2 production dossiers.
function classifyAssertion(quote: string): 'outcome_claim' | 'process_claim' | 'sentiment' {
	const text = quote.toLowerCase()
	const outcomeMarkers = [
		'most valuable',
		'best player',
		'the most important',
		'irreplaceable',
		'world-class',
		'world class',
		'top of the world',
		'better than'
	]
	if (outcomeMarkers.some((m) => text.includes(m))) return 'outcome_claim'
	const sentimentMarkers = ['love', 'proud', 'family', 'heart', 'we are lucky', 'blessed']
	if (sentimentMarkers.some((m) => text.includes(m))) return 'sentiment'
	return 'process_claim'
}

function safeHost(url: string): string {
	try {
		return new URL(url).host
	} catch {
		return ''
	}
}

function normalizeRetrievedAt(retrievedAt: string | undefined, asOf: string): string {
	if (retrievedAt) {
		// If already ISO datetime, keep it; otherwise convert YYYY-MM-DD → YYYY-MM-DDT00:00:00Z.
		if (retrievedAt.includes('T')) return retrievedAt
		return `${retrievedAt}T00:00:00Z`
	}
	return `${asOf}T00:00:00Z`
}

const srcDir =
	process.argv[2] ??
	resolve(
		import.meta.url.replace('file://', ''),
		'..',
		'..',
		'packages',
		'eval-harness',
		'cases',
		'historical'
	)
const outDir =
	process.argv[3] ??
	resolve(
		import.meta.url.replace('file://', ''),
		'..',
		'..',
		'packages',
		'eval-harness',
		'cases',
		'historical-v2'
	)
transformDir(srcDir, outDir)

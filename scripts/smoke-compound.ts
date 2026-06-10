// Usage: set -a && . ./packages/eval-harness/.env && set +a && nvm exec 22 npx tsx scripts/smoke-compound.ts
import { produceLLMVerdict } from '../packages/eval-harness/src/produce-verdict'
import { buildModelRotation } from '../packages/eval-harness/src/scorers/judge/llm-judge'
import { extractJson } from '../packages/eval-harness/src/scorers/judge/llm-judge'
import type { EvalCase } from '../packages/eval-harness/src/types'

process.env.EVAL_FRAMEWORK_SLUG = 'compound-interpretive-value'

const dossier = {
	asOf: '2024-05-31',
	question_frame: {
		frame: 'compound_interpretive',
		declared_club: 'Real Madrid',
		season: '2023-24'
	},
	compoundQuestion:
		'Is Bellingham Real Madrid’s most valuable player in 2023-24 AND is his value primarily output-driven rather than irreplaceability-driven AND is he stronger in big games than his season average?',
	compositionRule: 'AND',
	primarySubjectClaimId: 'c1',
	claims: [
		{
			id: 'c1',
			claim: 'Bellingham is Real Madrid’s most valuable player in 2023-24',
			claimType: 'value_synthesis',
			interpretiveLens: 'default_value_synthesis',
			primarySubject: 'bellingham',
			evidenceMapping: {
				tier1: [
					'subjects.bellingham.on_off_splits',
					'subjects.bellingham.team_share',
					'subjects.vinicius.team_share'
				],
				tier2: ['subjects.bellingham.percentile_ranks'],
				tier3: []
			}
		},
		{
			id: 'c2',
			claim: 'Bellingham’s value is primarily output-driven rather than irreplaceability-driven',
			claimType: 'driver_decomposition',
			interpretiveLens: 'output_vs_irreplaceability',
			primarySubject: 'bellingham',
			evidenceMapping: {
				tier1: [
					'subjects.bellingham.team_share',
					'subjects.bellingham.progression_metrics',
					'subjects.bellingham.on_off_splits'
				],
				tier2: ['subjects.bellingham.percentile_ranks'],
				tier3: []
			}
		},
		{
			id: 'c3',
			claim: 'Bellingham is stronger in big games than his season average',
			claimType: 'context_conditioning',
			interpretiveLens: 'big_game_vs_average',
			primarySubject: 'bellingham',
			evidenceMapping: {
				tier1: ['subjects.bellingham.big_game_splits', 'subjects.bellingham.team_share'],
				tier2: [],
				tier3: []
			}
		}
	],
	crossClaimRefs: [
		{ from: 'c1', to: 'c2', expectedConsistency: 'implies_driver_consistency' },
		{ from: 'c2', to: 'c3', expectedConsistency: 'output_driven_means_consistent_per90' }
	],
	tier_assignments: { primary: ['bellingham', 'vinicius'], context: [] },
	subjects: {
		bellingham: {
			club: 'Real Madrid',
			position: 'AM',
			tier: 'primary',
			age: 20,
			season: '2023-24',
			on_off_splits: {
				snapshots: [
					{
						asOf: '2024-05-31',
						value: {
							with_ppg: 2.55,
							without_ppg: 2.1,
							sample: { with_matches: 28, without_matches: 8 }
						},
						sources: [{ url: 'https://fbref.com/bellingham', authority: 'primary' }]
					}
				],
				summary: 'Madrid average 2.55 PPG with Bellingham, 2.1 without (small without sample).'
			},
			team_share: {
				snapshots: [
					{
						asOf: '2024-05-31',
						value: {
							xg_involvement_pct: 0.31,
							goals_pct_of_team: 0.22,
							progressive_passes_pct: 0.14
						},
						sources: [{ url: 'https://understat.com/bellingham', authority: 'primary' }]
					}
				],
				summary: 'Involved in 31% of Madrid xG; 22% of league goals.'
			},
			progression_metrics: {
				snapshots: [
					{
						asOf: '2024-05-31',
						value: {
							carries_per90: 2.1,
							line_breaking_passes_per90: 4.3,
							final_third_entries_per90: 6.0
						},
						sources: [{ url: 'https://fbref.com/bellingham-prog', authority: 'primary' }]
					}
				],
				summary:
					'High final-third entries; ambiguous whether this reads as output or as structural irreplaceability.'
			},
			big_game_splits: {
				snapshots: [
					{
						asOf: '2024-05-31',
						value: { big_game_goals_per90: 0.62, season_goals_per90: 0.55, big_game_sample: 9 },
						sources: [{ url: 'https://fbref.com/bellingham-biggame', authority: 'primary' }]
					}
				],
				summary: 'Scored in both Clasicos and UCL knockout legs; 9 big-game appearances.'
			},
			availability_record: {
				snapshots: [
					{
						asOf: '2024-05-31',
						value: { minutes: 2900, matches_missed_pct: 0.08 },
						sources: [{ url: 'https://transfermarkt.com/bellingham', authority: 'secondary' }]
					}
				]
			},
			percentile_ranks: {
				snapshots: [
					{
						asOf: '2024-05-31',
						value: { goals_pctl: 0.97, xa_pctl: 0.81, progression_pctl: 0.9 },
						sources: [{ url: 'https://fbref.com/bellingham-pctl', authority: 'primary' }]
					}
				]
			},
			tactical_role_profile: {
				role: 'free-8 / second striker',
				centrality: 'high',
				source: { url: 'https://theathletic.com/bellingham-role', authority: 'secondary' }
			},
			scout_notes: [
				{
					author: 'independent',
					note: 'Carries the team in transition; output and creation both elite.',
					source_url: 'https://example.com/scout',
					authority: 'secondary'
				}
			],
			manager_quotes: [
				{
					quote: 'Jude has been incredible for us this year.',
					assertion_type: 'sentiment',
					manager: 'Ancelotti'
				}
			]
		},
		vinicius: {
			club: 'Real Madrid',
			position: 'LW',
			tier: 'primary',
			age: 23,
			season: '2023-24',
			team_share: {
				snapshots: [
					{
						asOf: '2024-05-31',
						value: {
							xg_involvement_pct: 0.34,
							goals_pct_of_team: 0.2,
							progressive_passes_pct: 0.1
						},
						sources: [{ url: 'https://understat.com/vinicius', authority: 'primary' }]
					}
				],
				summary: 'Slightly higher xG involvement than Bellingham; comparable goal share.'
			},
			on_off_splits: {
				snapshots: [
					{
						asOf: '2024-05-31',
						value: {
							with_ppg: 2.5,
							without_ppg: 2.2,
							sample: { with_matches: 26, without_matches: 10 }
						},
						sources: [{ url: 'https://fbref.com/vinicius', authority: 'primary' }]
					}
				]
			},
			percentile_ranks: {
				snapshots: [
					{
						asOf: '2024-05-31',
						value: { goals_pctl: 0.92, xa_pctl: 0.88, progression_pctl: 0.95 },
						sources: [{ url: 'https://fbref.com/vinicius-pctl', authority: 'primary' }]
					}
				]
			}
		}
	}
}

const testCase: EvalCase = {
	id: 'control-bellingham-compound',
	kind: 'attack',
	question: dossier.compoundQuestion,
	manifest: { pathPrefix: 'dossier://', subjects: ['bellingham', 'vinicius'] },
	dossier
}

function evalOnly(rawText: string | null): string {
	if (!rawText) return '(no raw text)'
	try {
		const j = extractJson(rawText) as Record<string, unknown>
		return JSON.stringify(
			{
				sub_verdicts: j.sub_verdicts,
				composition_audit: j.composition_audit,
				cross_claim_consistency: j.cross_claim_consistency
			},
			null,
			2
		)
	} catch {
		return '(could not parse eval-only fields)'
	}
}

async function main() {
	const rotation = buildModelRotation(['glm', 'gpt5', 'gemini'])
	console.log(`Framework: compound-interpretive-value v1.0`)
	console.log(
		`Models in rotation: ${rotation.map((m) => `${m.id}=${m.config.model}`).join(', ')}\n`
	)

	for (const m of rotation) {
		process.stdout.write(`\n========== ${m.label} (${m.config.model}) ==========\n`)
		const r = await produceLLMVerdict(testCase, '', m.config)
		if (!r.verdict) {
			console.log(`  ERROR: ${r.error}`)
			if (r.rawText) console.log(`  raw: ${r.rawText.slice(0, 500)}`)
			continue
		}
		const v = r.verdict
		console.log(
			`  outcome=${v.outcome}  confidence_bps=${v.confidence_bps}  driving_tier=${v.driving_tier}  subject_ref=${v.subject_ref}`
		)
		console.log(`  citations: ${v.citations.length} paths`)
		console.log(`  eval-only:\n${evalOnly(r.rawText)}`)
	}
}

main().catch((e) => {
	console.error(e)
	process.exit(1)
})

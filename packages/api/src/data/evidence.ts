// Dossier fixtures for the interpretive-markets demo. Content is anchored in
// real 2025-26 facts (Aug 2025 - May 2026 season). Match report excerpts,
// manager quotes and scout notes are paraphrased / synthesized from publicly
// reported events; on/off splits and team-share metrics are illustrative
// estimates (publicly available stats sites don't expose per-player on/off
// splits cleanly). Treat the dossier as the demo shape, not primary-source
// truth.
//
// Each item that has a real upstream source carries a `source_url` — these are
// what Opacity zkTLS attestations will eventually attach to (one proof per
// fetched URL, mirrored into the re-exec bundle so watchers verify the
// HTTPS response rather than re-fetching).
//
// The top-level `$schema` points at the dossier shape (lives inside the
// framework tarball pinned on IPFS); `$framework` ties the dossier to the
// on-chain framework registration so consumers can verify provenance.

const DOSSIER_SCHEMA_URL =
	'https://raw.githubusercontent.com/gowthamsundaresan/interpretive-markets/main/frameworks/football-player-value-v1/schemas/dossierV1.json'

const FOOTBALL_FRAMEWORK = {
	id: '0x572f174004cb7791ebb89118750af59e2c7ac93ee5ef6f99bf56616f4686bcab',
	ipfs: 'ipfs://QmbMiXBZqyy5kgPpkgNVfvBP6HrM6KKNBGwNFFdGQEzo76',
	slug: 'football-player-value-v1',
	version: '1.3.0'
}

// --- Helpers ---

const SRC = {
	tmPedri: 'https://www.transfermarkt.us/pedri/leistungsdaten/spieler/683840',
	tmYamal: 'https://www.transfermarkt.us/lamine-yamal/leistungsdaten/spieler/937958',
	tmHaaland: 'https://www.transfermarkt.us/erling-haaland/leistungsdaten/spieler/418560',
	tmMbappe: 'https://www.transfermarkt.us/kylian-mbappe/leistungsdaten/spieler/342229',
	uefaPedri: 'https://www.uefa.com/uefachampionsleague/clubs/players/250143693--pedri/statistics/',
	fbrefPedri: 'https://fbref.com/en/players/0d9b2d31/Pedri',
	plHaaland: 'https://www.premierleague.com/en/players/223094/erling-haaland/stats',
	fotmobYamal: 'https://www.fotmob.com/players/1467236/lamine-yamal',
	wikiBarca: 'https://en.wikipedia.org/wiki/2025%E2%80%9326_FC_Barcelona_season',
	wikiMadrid: 'https://en.wikipedia.org/wiki/2025%E2%80%9326_Real_Madrid_CF_season',
	wikiHaaland: 'https://en.wikipedia.org/wiki/Erling_Haaland',
	cbsClasico:
		'https://www.cbssports.com/soccer/news/barcelona-beat-real-madrid-in-el-clasico-crowned-laliga-champions-2026/',
	cies: 'https://www.football-observatory.com/'
}

// --- Subjects ---

const PEDRI = {
	club: 'FC Barcelona',
	position: 'CM (deep playmaker)',
	age: 22,
	season: '2025-26',
	stats: {
		season: {
			competition: 'La Liga + UCL + Copa del Rey + Supercopa',
			apps: { laLiga: 27, ucl: 9 },
			minutes: { laLiga: 2107, ucl: 695 },
			goals: { laLiga: 2, ucl: 0 },
			assists: { laLiga: 9, ucl: 2 },
			uclPassAccuracy: 0.9045,
			sources: [
				{ label: 'UEFA — Pedri CL 25/26', url: SRC.uefaPedri },
				{ label: 'Transfermarkt — Pedri 25/26', url: SRC.tmPedri },
				{ label: 'FBref — Pedri', url: SRC.fbrefPedri }
			],
			notes:
				'Numbers depressed by long absence — distal biceps femoris tear in left thigh kept him out from early October until 29 Nov 2025. Per-90 metrics in line with career baseline once he returned.'
		}
	},
	on_off_splits: {
		with: {
			ppg_la_liga: 2.45,
			team_xg_per_90: 2.1,
			team_xg_against_per_90: 0.9
		},
		without: {
			ppg_la_liga: 1.85,
			team_xg_per_90: 1.6,
			team_xg_against_per_90: 1.0
		},
		sample: { with_matches_la_liga: 27, without_matches_la_liga: 11 },
		delta_summary:
			'~0.6 ppg drop in La Liga when Pedri was unavailable (Oct-Nov 2025 injury layoff). Team xG/90 fell ~24%; xG-against ticked up slightly. Results held during the layoff (Barça went 4W-2D-1L) but the football degraded — visible in the underlying numbers, not just the eye test.',
		sources: [
			{ label: 'Derived from 2025-26 Barça match data', url: SRC.wikiBarca },
			{ label: 'Opta on/off splits (illustrative)', url: SRC.fbrefPedri }
		]
	},
	substitution_patterns: {
		big_game_start_rate: 1.0,
		average_minute_substituted_off: 78,
		removed_first_when_chasing_pct: 0.05,
		protected_when_winning_pct: 0.7,
		summary:
			'Started every fit big game (Clásico, both UCL knockout legs, Supercopa final, Copa SF). Almost never the first removed when chasing — Flick treats his minutes as protected. Routinely substituted at 75-80 when winning, kept on when game-state is tight.',
		sources: [{ label: '2025-26 Barça season log', url: SRC.wikiBarca }]
	},
	team_share: {
		assists_pct_of_team: 0.18,
		progressive_passes_pct: 0.22,
		final_third_touches_pct: 0.14,
		minutes_share_pct: 0.66,
		summary:
			"~22% of Barcelona's progressive passes when on the pitch — top of the squad despite missing two months. Distinct profile from Yamal (who leads goals% and final-third touches%); Pedri leads creation upstream of the box.",
		sources: [{ label: 'FBref — Pedri share stats', url: SRC.fbrefPedri }]
	},
	contract_signals: {
		release_clause_eur: 1_000_000_000,
		contract_end: '2026',
		summary:
			'Release clause set at €1bn — practically immovable. Contract runs through 2026 (extension in talks per Spanish press). No public bids received in the trailing 12 months.',
		sources: [{ label: 'Transfermarkt contract info', url: SRC.tmPedri }]
	},
	match_reports: [
		{
			date: '2026-05-10',
			opponent: 'Real Madrid',
			competition: 'La Liga (El Clásico, title-sealer)',
			excerpt:
				"Barcelona beat Real Madrid 2-0 at the Bernabéu to confirm a second consecutive La Liga title under Flick. Pedri controlled the middle third, led both sides for progressive passes (12), 91% completion. Post-match coverage framed the win as the structural triumph of Flick's system over Madrid's disjointed individuals.",
			source: 'CBS Sports',
			source_url: SRC.cbsClasico
		},
		{
			date: '2026-04-15',
			opponent: 'Atlético Madrid',
			competition: 'UCL Quarter-final 2nd leg',
			excerpt:
				"Barcelona crashed out at the QF stage. Pedri struggled against Simeone's mid-block — 64% pass completion in the final third, his lowest of the season. Came off at 70 with the tie effectively gone.",
			source: 'Wikipedia',
			source_url: SRC.wikiBarca
		},
		{
			date: '2025-11-29',
			opponent: 'Alavés',
			competition: 'La Liga (return from injury)',
			excerpt:
				'First appearance since early October. Played 62 minutes, one assist on a Yamal goal. Flick substituted him to a standing ovation. Barça had gone 4W-2D-1L without him but the football visibly lacked rhythm.',
			source: 'Barça Universal',
			source_url:
				'https://barcauniversal.com/pedri-talks-messi-flick-raphinha-lamine-real-madrid-ballon-dor-why-cant-i-dream-of-winning-it-one-day/'
		}
	],
	manager_quotes: [
		// TIER 3 — included for colour. Flick has direct conflict of interest.
		{
			date: '2025-12',
			manager: 'Hansi Flick',
			quote:
				"When Pedri has the ball, it's fantastic to watch. Plus, in the coming years he can be one of the team's leaders — he's only 22.",
			source: 'football-espana.net',
			source_url: 'https://www.football-espana.net/2025/12/23/pedri-praise-barcelona-hansi-flick'
		}
	],
	scout_notes: [
		{
			author: 'Sid Lowe (paraphrased)',
			date: '2026-05-12',
			note: "On/off splits this season do the heavy lifting for Pedri's case: results held during his Oct-Nov absence but the underlying football degraded (team xG -24%). Two La Liga titles in two seasons under Flick. CL elimination dampens the headline a little — but losing to Atleti at the QF is hardly a personal indictment.",
			source_url: SRC.wikiBarca
		},
		{
			author: 'Michael Cox-style synthesis',
			date: '2026-04-22',
			note: 'The Pedri-vs-Yamal "most valuable at Barça" debate has sharpened. Pedri leads on progressive-passes-share and on/off team xG delta (Tier 1 evidence). Yamal leads on goals-share, final-third-touches-share, and market valuation (also Tier 1/2). Honest reading: this is a tossup the framework can\'t resolve from data alone.',
			source_url:
				'https://barcauniversal.com/lamine-yamal-becomes-the-most-valuable-footballer-in-the-world-cubarsi-highest-valued-centre-back/'
		}
	],
	valuation_history: [
		{ date: '2024-12', value_eur: 110_000_000, source: 'Transfermarkt', source_url: SRC.tmPedri },
		{
			date: '2025-12',
			value_eur: 140_000_000,
			source: 'Transfermarkt',
			source_url: SRC.tmPedri,
			note: 'Post-injury rebound'
		},
		{
			date: '2026-05',
			value_eur: 143_700_000,
			source: 'CIES Football Observatory',
			source_url: SRC.cies,
			note: '6th most valuable player globally; 2nd at Barcelona behind Yamal.'
		}
	],
	context_notes:
		"Pedri is 22, €1bn release clause — practically immovable. The framework's irreplaceability criterion is the heart of his case: Tier 1 on/off splits show team xG dropped ~24% during his Oct-Nov absence. He returned in time to control midfield at the title-sealing Bernabéu Clásico. Currently 6th in world valuations and 2nd at Barcelona, behind Yamal — whose case rests on different Tier 1 evidence (goals-share, market price)."
}

const YAMAL = {
	club: 'FC Barcelona',
	position: 'RW',
	age: 18,
	season: '2025-26',
	stats: {
		season: {
			competition: 'La Liga + UCL + Copa del Rey + Supercopa',
			apps: { laLiga: 28 },
			minutes: { laLiga: 2268 },
			goals: { laLiga: 16 },
			assists: { laLiga: 11 },
			goalContributionsPer90: 1.07,
			fotMobAvgRating: 8.33,
			sources: [
				{ label: 'FotMob — Yamal', url: SRC.fotmobYamal },
				{ label: 'Transfermarkt — Yamal', url: SRC.tmYamal }
			]
		}
	},
	on_off_splits: {
		with: { ppg_la_liga: 2.4, team_goals_per_90: 2.4 },
		without: { ppg_la_liga: 2.0, team_goals_per_90: 1.9 },
		sample: { with_matches_la_liga: 28, without_matches_la_liga: 10 },
		delta_summary:
			"Team scoring rate drops ~21% in his off-minutes. Smaller delta than Pedri's xG delta but more concentrated in attacking output (he is the chance-creator).",
		sources: [{ label: 'Derived', url: SRC.wikiBarca }]
	},
	substitution_patterns: {
		big_game_start_rate: 1.0,
		average_minute_substituted_off: 82,
		removed_first_when_chasing_pct: 0.0,
		protected_when_winning_pct: 0.5,
		summary:
			'Untouchable in big games — never removed first when chasing, often left on for the full 90 in tight games. Flick rotated him in routine league matches but treated knockout / Clásico minutes as sacred.',
		sources: [{ label: '2025-26 Barça season log', url: SRC.wikiBarca }]
	},
	team_share: {
		goals_pct_of_team: 0.21,
		assists_pct_of_team: 0.2,
		xg_involvement_pct: 0.32,
		final_third_touches_pct: 0.19,
		minutes_share_pct: 0.71,
		summary:
			"Leads Barcelona on goals%, assists%, xG-involvement%, and final-third touches%. The team's attacking output is structurally Yamal-dependent — distinct from Pedri's upstream creation profile.",
		sources: [{ label: 'FBref-style share computation', url: SRC.fbrefPedri }]
	},
	contract_signals: {
		contract_end: '2026',
		summary:
			'Contract talks ongoing. Renewal expected with a release clause being renegotiated upward. No bids received because clause makes negotiation moot.',
		sources: [{ label: 'Transfermarkt', url: SRC.tmYamal }]
	},
	match_reports: [
		{
			date: '2026-05-10',
			opponent: 'Real Madrid',
			competition: 'La Liga (El Clásico, title-sealer)',
			excerpt:
				'Scored the second goal and assisted the first in the 2-0 Bernabéu win. Spanish press ran headline variations of "Yamal makes the Bernabéu his". The most marketable performance of his young career.',
			source: 'CBS Sports',
			source_url: SRC.cbsClasico
		}
	],
	manager_quotes: [
		// TIER 3
		{
			date: '2025-06',
			manager: 'Hansi Flick',
			quote:
				'Lamine has the talent — but the level he can reach depends on the work he chooses now.',
			source: 'football-espana.net',
			source_url:
				'https://www.football-espana.net/2025/06/20/barcelona-manager-hansi-flick-on-lamine-yamal'
		}
	],
	scout_notes: [
		{
			author: 'CIES Football Observatory + Fox Sports',
			date: '2026-01',
			note: 'Most valuable player in world football at €402.3M per CIES; €200M Transfermarkt (Dec 2025). Tier 1 share metrics (goals% 21%, xG-involvement 32%) corroborate the market reading — Yamal is the attacking spine.',
			source_url:
				'https://www.foxsports.com/stories/soccer/lamine-yamal-named-most-valuable-player-world-soccer-400-million-price-tag'
		}
	],
	valuation_history: [
		{ date: '2024-12', value_eur: 130_000_000, source: 'Transfermarkt', source_url: SRC.tmYamal },
		{ date: '2025-12', value_eur: 200_000_000, source: 'Transfermarkt', source_url: SRC.tmYamal },
		{
			date: '2026-01',
			value_eur: 402_300_000,
			source: 'CIES',
			source_url: SRC.cies,
			note: '#1 globally'
		}
	],
	context_notes:
		"Yamal is 18, 2nd in 2025 Ballon d'Or behind Dembélé, increasingly the focal point of Barcelona's attack. Contract talks ongoing. Squad alternative on the right is Pau Víctor (lower ceiling). Tier 1 share metrics + Tier 2 market consensus both point to him as Barça's most market-valuable asset — the framework asks whether that translates to \"most valuable to the club\" once Pedri's structural role is weighed."
}

const HAALAND = {
	club: 'Manchester City',
	position: 'FW',
	age: 24,
	season: '2025-26',
	stats: {
		season: {
			competition: 'Premier League + UCL + Cup',
			apps: { premierLeague: 35 },
			minutes: { premierLeague: 2920 },
			goals: { premierLeague: 27, allCompetitions: 35 },
			assists: { premierLeague: 8 },
			nonPenaltyXGPer90: 0.72,
			goalsPer90: 0.82,
			sources: [
				{ label: 'Premier League — Haaland', url: SRC.plHaaland },
				{ label: 'Transfermarkt — Haaland', url: SRC.tmHaaland }
			],
			notes:
				"Premier League Golden Boot 2025-26 (3rd in 4 years). Reached 100 PL goals in 111 apps on 2 Dec 2025 — fastest ever, breaking Shearer's 124-match record. 88 goals in first 100 PL apps (also a record)."
		}
	},
	on_off_splits: {
		with: { team_goals_per_90: 2.0, ppg_premier_league: 1.95 },
		without: { team_goals_per_90: 1.2, ppg_premier_league: 1.4 },
		sample: { with_matches_pl: 35, without_matches_pl: 8 },
		delta_summary:
			"Team scoring rate falls ~40% in Haaland's off-minutes this season — the largest on/off goals delta in the Premier League. PPG drops ~0.55, the difference between mid-table and a CL place over a full season.",
		sources: [
			{ label: 'Wikipedia — Haaland', url: SRC.wikiHaaland },
			{ label: 'Derived from PL data', url: SRC.plHaaland }
		]
	},
	substitution_patterns: {
		big_game_start_rate: 1.0,
		average_minute_substituted_off: 85,
		removed_first_when_chasing_pct: 0.0,
		protected_when_winning_pct: 0.4,
		summary:
			'Started every available big game. Never removed first when chasing — Pep treats him as the only realistic source of goals in tight matches. Sometimes rested late in comfortable wins to manage load.',
		sources: [{ label: 'Derived from match logs', url: SRC.wikiHaaland }]
	},
	team_share: {
		goals_pct_of_team: 0.41,
		xg_involvement_pct: 0.39,
		minutes_share_pct: 0.83,
		summary:
			"41% of City's Premier League goals scored or directly assisted by Haaland. xG-involvement 39%. The numbers describe a team whose attacking output is structurally a Haaland function.",
		sources: [{ label: 'FBref-style team-share', url: SRC.plHaaland }]
	},
	contract_signals: {
		contract_end: '2034',
		summary:
			'Signed 10-year extension in summer 2025, through 2034. Effectively the deepest possible commitment from a club to a player at the asset level. Salary share of wage bill estimated at ~13% (top of squad).',
		sources: [
			{
				label: 'mancity.com on extension',
				url: 'https://www.mancity.com/news/mens/pep-guardiola-ipswich-town-v-manchester-city-erling-haaland-embargo-63872746'
			}
		]
	},
	match_reports: [
		{
			date: '2025-12-02',
			opponent: 'Sunderland',
			competition: 'Premier League',
			excerpt:
				"Fastest player to reach 100 PL goals — 111 apps, breaking Shearer's 124-match record. A historic individual marker in a season where the team has struggled.",
			source: 'Wikipedia',
			source_url: SRC.wikiHaaland
		},
		{
			date: '2026-02-11',
			opponent: 'Fulham',
			competition: 'Premier League',
			excerpt:
				'Ended an 8-game run without an open-play PL goal. Pep spoke afterwards of "relief more than celebration" — emblematic of a season where City\'s reliance on him has become a vulnerability when he isn\'t scoring.',
			source: 'NBC Sports',
			source_url:
				'https://www.nbcsports.com/soccer/news/erling-haaland-2025-26-goals-video-highlights-stats-career-statistics-norway-manchester-city'
		}
	],
	manager_quotes: [
		// TIER 3
		{
			date: '2026-03',
			manager: 'Pep Guardiola',
			quote: 'When he is fit, he is the difference. Without those goals we are not where we are.',
			source: 'Sky Sports (paraphrased)',
			source_url:
				'https://www.skysports.com/football/news/11095/13513633/erling-haaland-injury-pep-guardiola-unsure-on-when-man-city-striker-will-return-and-complains-about-fixture-schedule'
		}
	],
	scout_notes: [
		{
			author: 'Sam McGuire-style synthesis',
			date: '2026-04-15',
			note: 'Tier 1 case for Haaland-as-MVP is unusually strong this season: 41% goals share, ~40% team-scoring-rate on/off delta, Golden Boot in a structurally rough year, 10-year contract maximizes future-value horizon. The framework would have a hard time *not* favoring him under its own evidence hierarchy.',
			source_url: SRC.wikiHaaland
		}
	],
	valuation_history: [
		{ date: '2024-12', value_eur: 180_000_000, source: 'Transfermarkt', source_url: SRC.tmHaaland },
		{
			date: '2026-05',
			value_eur: 175_000_000,
			source: 'Transfermarkt',
			source_url: SRC.tmHaaland,
			note: 'Slight tick down on injury concerns + age curve'
		}
	],
	context_notes:
		"Signed 10-year extension summer 2025, contracted through 2034. Two 2025-26 injury layoffs (ankle Jan, suspected groin Mar). Premier League Golden Boot for the 3rd time in 4 seasons. City's season widely characterized as the toughest of the Guardiola era — Tier 1 on/off and team-share metrics paint him as the load-bearing star of a struggling structure."
}

const MBAPPE = {
	club: 'Real Madrid',
	position: 'FW (#10)',
	age: 26,
	season: '2025-26',
	stats: {
		season: {
			competition: 'La Liga + UCL + Cup',
			apps: { laLiga: 28, allCompetitions: 39 },
			minutes: { laLiga: 2520 },
			goals: { laLiga: 22, allCompetitions: 43 },
			assists: { laLiga: 9, allCompetitions: 8 },
			goalsPer90LaLiga: 0.79,
			xGLaLiga: 18.8,
			sources: [
				{ label: 'Tribuna — Mbappé', url: 'https://tribuna.com/en/persons/mbappe/stat/2025-2026/' },
				{ label: 'Transfermarkt — Mbappé', url: SRC.tmMbappe }
			],
			notes:
				'Pichichi Trophy leader. La Liga goals/90 of 0.79 trails only Lewandowski (0.84). xG overperformance of +3.2 in La Liga. Feb 2026: 7 goals in 5 La Liga games including a hat-trick vs Sevilla. Switched to #10 shirt for 2025-26.'
		}
	},
	on_off_splits: {
		with: { team_goals_per_90: 2.1, ppg_la_liga: 2.0 },
		without: { team_goals_per_90: 1.9, ppg_la_liga: 1.85 },
		sample: { with_matches_la_liga: 28, without_matches_la_liga: 10 },
		delta_summary:
			"Team scoring rate falls only ~10% in Mbappé's off-minutes — meaningfully smaller delta than Haaland's ~40%. Real Madrid's underlying output is well-distributed (Vinicius, Bellingham, Rodrygo) so Mbappé's individual brilliance has less marginal effect on team output than his goal tally suggests.",
		sources: [{ label: 'Derived from 2025-26 Madrid data', url: SRC.wikiMadrid }]
	},
	substitution_patterns: {
		big_game_start_rate: 1.0,
		average_minute_substituted_off: 75,
		removed_first_when_chasing_pct: 0.15,
		protected_when_winning_pct: 0.3,
		summary:
			"Started all big games but more frequently substituted earlier than Haaland — Arbeloa's setup rotates the attacking line more freely. Has been removed first when chasing on a handful of occasions, which would not happen at City with Haaland.",
		sources: [{ label: 'Derived from match logs', url: SRC.wikiMadrid }]
	},
	team_share: {
		goals_pct_of_team: 0.33,
		xg_involvement_pct: 0.28,
		minutes_share_pct: 0.7,
		summary:
			"33% of Madrid's La Liga goals — high but not as concentrated as Haaland at City (41%). Madrid's attacking output is more distributed (Vinicius, Bellingham each carry ~15-18% goals share).",
		sources: [{ label: 'Derived', url: SRC.wikiMadrid }]
	},
	contract_signals: {
		contract_end: '2029',
		summary:
			'Free transfer summer 2024. 5-year contract through 2029. Salary share of wage bill estimated at ~12% (top tier alongside Vinicius and Bellingham). #10 shirt change for 25-26 signals system-centrality.',
		sources: [{ label: 'Wikipedia — Madrid 25-26', url: SRC.wikiMadrid }]
	},
	match_reports: [
		{
			date: '2026-02-23',
			opponent: 'Sevilla',
			competition: 'La Liga',
			excerpt:
				"Hat-trick in a 4-1 win that briefly revived Madrid's title hopes. The defining performance of his February surge under Arbeloa's setup.",
			source: 'Sofascore',
			source_url:
				'https://www.sofascore.com/news/kylian-mbappes-2025-26-season-for-real-madrid-and-national-team-relentless-numbers-simple-story'
		},
		{
			date: '2026-05-10',
			opponent: 'Barcelona',
			competition: 'La Liga (El Clásico — title decider)',
			excerpt:
				'Madrid lost 0-2 at home, conceding the title. Mbappé worked into the channels but rarely received in dangerous areas — Barcelona midfield (led by Pedri) cut off supply lines. 4 shots, zero on target. The defining frustration of a trophyless Madrid season: peak individual numbers, no silverware.',
			source: 'CBS Sports',
			source_url: SRC.cbsClasico
		}
	],
	manager_quotes: [
		// TIER 3 — and especially soft given Arbeloa is interim
		{
			date: '2026-03',
			manager: 'Álvaro Arbeloa (interim, paraphrased)',
			quote: 'Kylian is the player around whom we build now.',
			source: 'Post-Sevilla coverage',
			source_url: SRC.wikiMadrid
		}
	],
	scout_notes: [
		{
			author: 'Sid Lowe-style synthesis',
			date: '2026-05-12',
			note: "Tale of two halves: difficult opening under Xabi Alonso, Pichichi-leading surge under Arbeloa's pared-back setup. 40+ goals is undeniable. But Tier 1 evidence is awkward: on/off delta is only ~10%, team-share 33%, Madrid trophyless. The framework reads: peak individual output that does not translate to load-bearing club value because Madrid's squad depth absorbs his absence.",
			source_url: SRC.wikiMadrid
		},
		{
			author: "Bolavip — Ballon d'Or context",
			date: '2025-12',
			note: "Still no Ballon d'Or at 26 — finished 7th in 2025 voting, behind ex-PSG teammates Dembélé (winner), Vitinha, Hakimi. Two years at Madrid: zero club trophies.",
			source_url:
				'https://bolavip.com/en/soccer/mbappe-still-without-a-ballon-dor-at-26-how-many-had-messi-and-ronaldo-won-at-his-age'
		}
	],
	valuation_history: [
		{ date: '2024-12', value_eur: 180_000_000, source: 'Transfermarkt', source_url: SRC.tmMbappe },
		{
			date: '2026-05',
			value_eur: 180_000_000,
			source: 'Transfermarkt',
			source_url: SRC.tmMbappe,
			note: 'Pichichi leader 25-26; market unchanged'
		}
	],
	context_notes:
		'Free transfer summer 2024. 5-year contract through 2029. Switched to #10 shirt — signal of system-centrality. Madrid 2025-26: Xabi Alonso sacked Jan 12 2026, Arbeloa interim, Mourinho confirmed for 2026-27. Trophyless season. Personally elite (43 goals all comps, Pichichi leader); Tier 1 on/off and team-share evidence shows the marginal value to the club is smaller than the headline numbers suggest.'
}

// --- Fixtures ---

export const evidenceFixtures: Record<string, unknown> = {
	'pedri-value-v1': {
		$schema: DOSSIER_SCHEMA_URL,
		$framework: FOOTBALL_FRAMEWORK,
		asOf: '2026-05-25',
		subjects: { Pedri: PEDRI, 'Lamine Yamal': YAMAL },
		context_notes:
			'Barcelona 2025-26: La Liga champions for a 2nd consecutive year under Flick (sealed 10 May 2026 at the Bernabéu in a 2-0 Clásico), Supercopa winners, Copa SF exit, UCL QF elimination by Atlético. The intra-club "most valuable" debate: Pedri (Tier 1 on/off-xG delta, progressive-passes share) vs Yamal (Tier 1 goals share, xG-involvement; Tier 2 market consensus #1 globally).',
		context_sources: [
			{ label: '2025-26 Barça season', url: SRC.wikiBarca },
			{ label: 'La Liga 2025-26 wrap', url: SRC.cbsClasico }
		]
	},
	'haaland-mbappe-2024': {
		// Key retained as -2024 for backward-compat with Market id 3.
		$schema: DOSSIER_SCHEMA_URL,
		$framework: FOOTBALL_FRAMEWORK,
		asOf: '2026-05-25',
		subjects: { 'Erling Haaland': HAALAND, 'Kylian Mbappe': MBAPPE },
		context_notes:
			"Snapshot end-of-season 2025-26 (May 2026). Framework reads: Haaland's Tier 1 evidence (41% team goals share, ~40% on/off scoring delta, Golden Boot in a struggling City) is meaningfully stronger than Mbappé's (33% goals share, ~10% on/off delta, Madrid trophyless). Both produce elite individual numbers; only one translates into structural value-to-club under the framework's evidence hierarchy.",
		context_sources: [
			{ label: '2025-26 Real Madrid', url: SRC.wikiMadrid },
			{ label: 'Erling Haaland', url: SRC.wikiHaaland }
		]
	}
}

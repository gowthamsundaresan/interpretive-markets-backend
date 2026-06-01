// Dossier fixtures for the interpretive-markets demo. Content is anchored in
// real 2025-26 facts (Aug 2025 - May 2026 season). Match report excerpts,
// manager quotes and scout notes are paraphrased / synthesized from publicly
// reported events; treat the prose as illustrative rather than primary-source.
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
	id: '0xc325fd762d77d8c88f57c7fa645ddd88589ece6198f008dab304f75918fa197a',
	ipfs: 'ipfs://QmYWbWL7GXPv6hkAruGZ6DzZYeDM6rnS5yTbseEBDKK3zV',
	slug: 'football-player-value-v1',
	version: '1.2.0'
}

export const evidenceFixtures: Record<string, unknown> = {
	'pedri-value-v1': {
		$schema: DOSSIER_SCHEMA_URL,
		$framework: FOOTBALL_FRAMEWORK,
		asOf: '2026-05-25',
		subjects: {
			Pedri: {
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
						uclFotMobRating: 7.8,
						sources: [
							{
								label: 'UEFA — Pedri CL 25/26 stats',
								url: 'https://www.uefa.com/uefachampionsleague/clubs/players/250143693--pedri/statistics/'
							},
							{
								label: 'Transfermarkt — Pedri 25/26',
								url: 'https://www.transfermarkt.us/pedri/leistungsdaten/spieler/683840'
							},
							{ label: 'FBref — Pedri', url: 'https://fbref.com/en/players/0d9b2d31/Pedri' }
						],
						notes:
							'Numbers depressed by long absence — distal biceps femoris tear in left thigh kept him out from early Oct until 29 Nov 2025. Per-90 metrics in line with his career baseline once he returned.'
					}
				},
				match_reports: [
					{
						date: '2026-05-10',
						opponent: 'Real Madrid',
						competition: 'La Liga (El Clásico, title-sealer)',
						excerpt:
							"Barcelona beat Real Madrid 2-0 at the Bernabéu to confirm a second consecutive La Liga title under Flick. Pedri controlled the middle third, dictating tempo against an interim Madrid setup (Arbeloa post-Alonso). Post-match coverage framed the win as the structural triumph of Flick's system over Madrid's disjointed individuals — Pedri being the on-pitch embodiment.",
						source: 'CBS Sports',
						source_url:
							'https://www.cbssports.com/soccer/news/barcelona-beat-real-madrid-in-el-clasico-crowned-laliga-champions-2026/'
					},
					{
						date: '2026-04-15',
						opponent: 'Atlético Madrid',
						competition: 'UCL Quarter-final 2nd leg',
						excerpt:
							"Barcelona crashed out of the Champions League at the QF stage. Pedri started but struggled to impose himself against Simeone's mid-block. Came off at 70 with the tie effectively gone. A reminder that elite system-fit doesn't translate seamlessly to every European matchup.",
						source: 'Wikipedia — 2025-26 FC Barcelona season',
						source_url: 'https://en.wikipedia.org/wiki/2025%E2%80%9326_FC_Barcelona_season'
					},
					{
						date: '2025-11-29',
						opponent: 'Alavés',
						competition: 'La Liga (return from injury)',
						excerpt:
							'First appearance since early October after the hamstring tear. Played 62 minutes, kept it simple, one assist on a Yamal goal. Flick made a point of substituting him to a standing ovation. Barcelona had gone 4W-2D-1L in his absence — the win rate held up but the football visibly lacked midfield rhythm.',
						source: 'Barça Universal',
						source_url:
							'https://barcauniversal.com/pedri-talks-messi-flick-raphinha-lamine-real-madrid-ballon-dor-why-cant-i-dream-of-winning-it-one-day/'
					},
					{
						date: '2025-09-14',
						opponent: 'Valencia',
						competition: 'La Liga',
						excerpt:
							'Pre-injury performance most fans bookmark when discussing his ceiling: two assists, sustained tempo control, six progressive carries. Manager Flick singled him out post-match.',
						source: 'football-espana.net',
						source_url: 'https://www.football-espana.net/2025/09/02/pedri-flick-fermin-joan-garcia'
					}
				],
				manager_quotes: [
					{
						date: '2025-12',
						manager: 'Hansi Flick',
						quote:
							"He's brilliant. When Pedri has the ball, it's fantastic to watch. It's fantastic to have him on the team. Plus, in the coming years he can be one of the team's leaders — he's only 22!",
						source: 'football-espana.net',
						source_url:
							'https://www.football-espana.net/2025/12/23/pedri-praise-barcelona-hansi-flick'
					},
					{
						date: '2025-09',
						manager: 'Hansi Flick',
						quote:
							'I told him at the start of the season: take a step forward. Dominate the midfield. He has done it.',
						source: 'Barca Blaugranes',
						source_url:
							'https://www.barcablaugranes.com/2025/2/11/24363312/pedri-reveals-what-hansi-flick-told-him-at-the-start-of-the-season-after-arriving-at-barcelona'
					},
					{
						date: '2025-11',
						manager: 'Hansi Flick',
						quote:
							'We have won games without him. But we are a different team with him. The level of control changes.',
						source: 'Barca Blaugranes',
						source_url:
							'https://www.barcablaugranes.com/barcelona-la-liga/117402/hansi-flick-explains-decision-to-start-lamine-yamal-and-pedri-for-barcelona-against-espanyol'
					}
				],
				scout_notes: [
					{
						author: 'Sid Lowe (paraphrased)',
						date: '2026-05-12',
						note: 'Two La Liga titles in two seasons under Flick — the structural argument for Pedri-as-MVP at Barcelona is at its strongest right now. The injury layoff did the opposite of what an injury usually does to "value to club" cases: by showing that Barcelona missed him visibly (the football degraded in his absence even when results held), it strengthened the irreplaceability argument rather than weakening it. The CL elimination dampens the headline a little — but losing to Atleti in a QF is hardly a personal indictment.',
						source_url: 'https://en.wikipedia.org/wiki/2025%E2%80%9326_FC_Barcelona_season'
					},
					{
						author: 'Michael Cox-style synthesis',
						date: '2026-04-22',
						note: 'The 2024-25 question of "Pedri or Yamal as Barça\'s most valuable" has only sharpened in 2025-26. Yamal has gone from "ascending star" to "best winger in the world by output and market consensus" (€200M Transfermarkt, €402M CIES). Pedri\'s case for most-valuable now rests almost entirely on irreplaceability and system-fit, with Yamal winning on raw output.',
						source_url:
							'https://barcauniversal.com/lamine-yamal-becomes-the-most-valuable-footballer-in-the-world-cubarsi-highest-valued-centre-back/'
					}
				],
				valuation_history: [
					{
						date: '2024-12',
						value_eur: 110_000_000,
						source: 'Transfermarkt',
						source_url: 'https://www.transfermarkt.us/pedri/marktwertverlauf/spieler/683840'
					},
					{
						date: '2025-06',
						value_eur: 130_000_000,
						source: 'Transfermarkt',
						source_url: 'https://www.transfermarkt.us/pedri/marktwertverlauf/spieler/683840'
					},
					{
						date: '2025-12',
						value_eur: 140_000_000,
						source: 'Transfermarkt',
						source_url: 'https://www.transfermarkt.us/pedri/marktwertverlauf/spieler/683840',
						note: 'Post-injury rebound'
					},
					{
						date: '2026-05',
						value_eur: 143_700_000,
						source: 'CIES Football Observatory',
						source_url: 'https://www.football-observatory.com/',
						note: 'Ranked 6th-most valuable player in world football; 2nd at Barcelona behind Yamal.'
					}
				],
				context_notes:
					'Pedri is 22, contracted to 2026 with a €1bn release clause — practically immovable. The framework\'s "irreplaceability" criterion is the heart of his case: when he was out (Oct-Nov 2025), Barcelona\'s results held but the football visibly changed. He returned in time to play a central role in sealing the title at the Bernabéu. He is currently 6th in world transfer-market valuations and 2nd at Barcelona, behind Yamal. The countervailing case for "most valuable" within Barcelona is Lamine Yamal — see his subject entry.'
			},
			'Lamine Yamal': {
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
							{
								label: 'FotMob — Yamal',
								url: 'https://www.fotmob.com/players/1467236/lamine-yamal'
							},
							{
								label: 'Transfermarkt — Yamal 25/26',
								url: 'https://www.transfermarkt.us/lamine-yamal/leistungsdaten/spieler/937958'
							},
							{
								label: 'UEFA — Yamal CL 25/26',
								url: 'https://www.uefa.com/uefachampionsleague/clubs/players/250176450--lamine-yamal/'
							}
						],
						notes:
							'16 + 11 in La Liga alone at age 18. Direct goal contributions per 90 lead Barcelona squad.'
					}
				},
				match_reports: [
					{
						date: '2026-05-10',
						opponent: 'Real Madrid',
						competition: 'La Liga (El Clásico, title-sealer)',
						excerpt:
							'Scored the second goal and assisted the first in the 2-0 Bernabéu win that sealed La Liga. Spanish press the following morning ran headlines variations of "Yamal makes the Bernabéu his". The most marketable performance of his young career so far.',
						source: 'CBS Sports',
						source_url:
							'https://www.cbssports.com/soccer/news/barcelona-beat-real-madrid-in-el-clasico-crowned-laliga-champions-2026/'
					}
				],
				manager_quotes: [
					{
						date: '2025-06',
						manager: 'Hansi Flick',
						quote:
							"It's not all enjoyment, you also have to work. Lamine has the talent — but the level he can reach depends on the work he chooses now.",
						source: 'football-espana.net',
						source_url:
							'https://www.football-espana.net/2025/06/20/barcelona-manager-hansi-flick-on-lamine-yamal'
					}
				],
				scout_notes: [
					{
						author: 'CIES Football Observatory + Fox Sports coverage',
						date: '2026-01',
						note: "Yamal ranked as the most valuable player in world football at an estimated €402.3M (~$400M), ahead of Mbappé, Bellingham, and every other comparable. Transfermarkt is more conservative at €200M (Dec 2025) — the gap reflects model assumptions about contract length and ceiling. By either measure he is now Barcelona's top transfer-market asset and one of the top three globally.",
						source_url:
							'https://www.foxsports.com/stories/soccer/lamine-yamal-named-most-valuable-player-world-soccer-400-million-price-tag'
					}
				],
				valuation_history: [
					{
						date: '2024-12',
						value_eur: 130_000_000,
						source: 'Transfermarkt',
						source_url: 'https://www.transfermarkt.us/lamine-yamal/marktwertverlauf/spieler/937958'
					},
					{
						date: '2025-12',
						value_eur: 200_000_000,
						source: 'Transfermarkt',
						source_url: 'https://www.transfermarkt.us/lamine-yamal/marktwertverlauf/spieler/937958'
					},
					{
						date: '2026-01',
						value_eur: 402_300_000,
						source: 'CIES Football Observatory',
						source_url: 'https://www.football-observatory.com/',
						note: 'Model-implied value factoring age, contract, and ceiling — flagged as #1 globally.'
					}
				],
				context_notes:
					"Yamal is 18, second in the 2025 Ballon d'Or behind Dembélé, and increasingly the player around whom Barcelona's attack is structured. Contract talks ongoing. The squad alternative on the right is the academy graduate Pau Víctor (much lower ceiling). He provides the moments; the framework asks whether moments outweigh structure."
			}
		},
		context_notes:
			'Barcelona\'s 2025-26 season: La Liga champions for a second consecutive year under Hansi Flick (sealed 10 May 2026 at the Bernabéu in a 2-0 Clásico), Supercopa de España winners, Copa del Rey semi-final exit, UCL quarter-final elimination by Atlético Madrid. The intra-club "most valuable" debate genuinely contested: Pedri (system / irreplaceability) vs Yamal (output / market price).',
		context_sources: [
			{
				label: '2025-26 FC Barcelona season',
				url: 'https://en.wikipedia.org/wiki/2025%E2%80%9326_FC_Barcelona_season'
			},
			{
				label: 'La Liga 2025-26 wrap',
				url: 'https://www.cbssports.com/soccer/news/barcelona-beat-real-madrid-in-el-clasico-crowned-laliga-champions-2026/'
			}
		]
	},
	'haaland-mbappe-2024': {
		// Key retained as -2024 only because Market id 3 already references this URL.
		// Content is 2025-26 season actuals (asOf 2026-05-25).
		$schema: DOSSIER_SCHEMA_URL,
		$framework: FOOTBALL_FRAMEWORK,
		asOf: '2026-05-25',
		subjects: {
			'Erling Haaland': {
				club: 'Manchester City',
				position: 'FW',
				age: 24,
				season: '2025-26',
				stats: {
					season: {
						competition: 'Premier League + UCL + Cup',
						apps: { premierLeague: 17 },
						minutes: { premierLeague: 1450 },
						goals: { premierLeague: 19, allCompetitions: 27 },
						assists: { premierLeague: 6, allCompetitions: 8 },
						shotsPer90: 4.4,
						touchesInBoxPer90: 8.3,
						sources: [
							{
								label: 'Premier League — Haaland stats',
								url: 'https://www.premierleague.com/en/players/223094/erling-haaland/stats'
							},
							{
								label: 'NBC Sports — Haaland 25/26 highlights',
								url: 'https://www.nbcsports.com/soccer/news/erling-haaland-2025-26-goals-video-highlights-stats-career-statistics-norway-manchester-city'
							},
							{
								label: 'Transfermarkt — Haaland 25/26',
								url: 'https://www.transfermarkt.us/erling-haaland/leistungsdaten/spieler/418560'
							}
						],
						notes:
							"Premier League Golden Boot 2025-26 (3rd in 4 years). Mid-season 8-match drought without an open-play PL goal ended 11 Feb 2026 vs Fulham. Reached 100 PL goals in 111 apps on 2 Dec 2025 — fastest ever, breaking Shearer's 124-match record. 88 goals in his first 100 PL games (also a record, beating Shearer's 79)."
					}
				},
				match_reports: [
					{
						date: '2025-12-02',
						opponent: 'Sunderland',
						competition: 'Premier League',
						excerpt:
							"Became the fastest player to reach 100 Premier League goals — 111 appearances, breaking Alan Shearer's 1995 record (124 apps). A historic individual marker in a season where the team has struggled to find consistent shape; the goals have been the through-line of City's campaign.",
						source: 'Wikipedia — Erling Haaland',
						source_url: 'https://en.wikipedia.org/wiki/Erling_Haaland'
					},
					{
						date: '2026-02-11',
						opponent: 'Fulham',
						competition: 'Premier League',
						excerpt:
							'Ended an 8-game run without an open-play Premier League goal. Pep afterwards spoke of "relief more than celebration" — emblematic of a season where City\'s reliance on him has become a vulnerability when he isn\'t scoring.',
						source: 'NBC Sports',
						source_url:
							'https://www.nbcsports.com/soccer/news/erling-haaland-2025-26-goals-video-highlights-stats-career-statistics-norway-manchester-city'
					},
					{
						date: '2026-01-18',
						opponent: 'Bournemouth',
						competition: 'FA Cup',
						excerpt:
							'Forced off in the 61st minute when Lewis Cook landed awkwardly on his left ankle. Subsequent ankle layoff cost him several matches in the period City could least afford it.',
						source: 'Sky Sports',
						source_url:
							'https://www.skysports.com/football/news/11095/13513633/erling-haaland-injury-pep-guardiola-unsure-on-when-man-city-striker-will-return-and-complains-about-fixture-schedule'
					}
				],
				manager_quotes: [
					{
						date: '2025-08',
						manager: 'Pep Guardiola',
						quote:
							"After Erling's new contract, now we have to deliver. We owe it to him, to the club, to ourselves.",
						source: 'mancity.com',
						source_url:
							'https://www.mancity.com/news/mens/pep-guardiola-ipswich-town-v-manchester-city-erling-haaland-embargo-63872746'
					},
					{
						date: '2026-03',
						manager: 'Pep Guardiola',
						quote:
							'When he is fit, he is the difference. That is the truth. Without those goals we are not where we are.',
						source: 'Sky Sports (paraphrased)',
						source_url:
							'https://www.skysports.com/football/news/11095/13513633/erling-haaland-injury-pep-guardiola-unsure-on-when-man-city-striker-will-return-and-complains-about-fixture-schedule'
					}
				],
				scout_notes: [
					{
						author: 'Sam McGuire-style synthesis',
						date: '2026-04-15',
						note: "Haaland's 2025-26 efficiency numbers remain elite — top decile xG/90 in the Premier League — but the surrounding system has degraded enough that his irreplaceability has visibly grown. The Golden Boot in a structurally rough City season is the single strongest signal of personal load-bearing. The new 10-year contract to 2034 also means his future-value horizon is effectively maximized for a 24-year-old.",
						source_url: 'https://en.wikipedia.org/wiki/Erling_Haaland'
					}
				],
				valuation_history: [
					{
						date: '2024-12',
						value_eur: 180_000_000,
						source: 'Transfermarkt',
						source_url:
							'https://www.transfermarkt.us/erling-haaland/marktwertverlauf/spieler/418560'
					},
					{
						date: '2025-12',
						value_eur: 180_000_000,
						source: 'Transfermarkt',
						source_url:
							'https://www.transfermarkt.us/erling-haaland/marktwertverlauf/spieler/418560',
						note: 'Stable post-contract extension'
					},
					{
						date: '2026-05',
						value_eur: 175_000_000,
						source: 'Transfermarkt',
						source_url:
							'https://www.transfermarkt.us/erling-haaland/marktwertverlauf/spieler/418560',
						note: 'Slight tick down on injury concerns + age curve modelling'
					}
				],
				context_notes:
					"Signed 10-year extension in summer 2025, contracted through 2034. Two injury layoffs in 2025-26 (ankle in January, suspected groin in March). Premier League Golden Boot for the third time in four seasons. City's season is widely characterized as the toughest of the Guardiola era; Haaland is broadly read as the load-bearing star of a struggling structure."
			},
			'Kylian Mbappe': {
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
						shotsPer90: 4.0,
						touchesInBoxPer90: 7.1,
						goalsPer90LaLiga: 0.79,
						xGLaLiga: 18.8,
						sources: [
							{
								label: 'Tribuna — Mbappé 25/26',
								url: 'https://tribuna.com/en/persons/mbappe/stat/2025-2026/'
							},
							{
								label: 'Sofascore — Mbappé 25/26 season summary',
								url: 'https://www.sofascore.com/news/kylian-mbappes-2025-26-season-for-real-madrid-and-national-team-relentless-numbers-simple-story'
							},
							{
								label: 'Transfermarkt — Mbappé 25/26',
								url: 'https://www.transfermarkt.us/kylian-mbappe/leistungsdaten/spieler/342229'
							}
						],
						notes:
							'Pichichi Trophy leader. La Liga goals/90 of 0.79 trails only Lewandowski (0.84). xG overperformance of +3.2 in La Liga. February 2026 was his best month: 7 goals in 5 La Liga games including a hat-trick vs Sevilla. Switched to #10 shirt for 2025-26.'
					}
				},
				match_reports: [
					{
						date: '2026-02-23',
						opponent: 'Sevilla',
						competition: 'La Liga',
						excerpt:
							"Hat-trick in a 4-1 win that briefly revived Madrid's title hopes. Mbappé as the system's focal point — left-channel runs, central finishing, played off both flanks across the match. The defining performance of his February surge.",
						source: 'Sofascore',
						source_url:
							'https://www.sofascore.com/news/kylian-mbappes-2025-26-season-for-real-madrid-and-national-team-relentless-numbers-simple-story'
					},
					{
						date: '2026-05-10',
						opponent: 'Barcelona',
						competition: 'La Liga (El Clásico — title decider)',
						excerpt:
							"Real Madrid lost 0-2 at home, conceding the title. Mbappé worked into the channels but rarely received in dangerous areas — Barcelona's midfield (led by Pedri) cut off supply lines. He took 4 shots, zero on target. The defining frustration of a trophyless Madrid season: peak individual numbers, no silverware.",
						source: 'CBS Sports',
						source_url:
							'https://www.cbssports.com/soccer/news/barcelona-beat-real-madrid-in-el-clasico-crowned-laliga-champions-2026/'
					},
					{
						date: '2026-01-12',
						opponent: 'N/A',
						competition: 'Off-pitch context',
						excerpt:
							"Three days after Xabi Alonso was sacked by mutual agreement following a rough start, Álvaro Arbeloa took over as interim. Mbappé's February explosion came under Arbeloa's simpler, more attacker-centric setup. The before/after data point is striking.",
						source: 'Wikipedia — 2025-26 Real Madrid CF season',
						source_url: 'https://en.wikipedia.org/wiki/2025%E2%80%9326_Real_Madrid_CF_season'
					}
				],
				manager_quotes: [
					{
						date: '2026-03',
						manager: 'Álvaro Arbeloa (interim, paraphrased)',
						quote:
							'Kylian is the player around whom we build now. The plan is simple — get him in positions where he can decide the game.',
						source: 'Post-Sevilla coverage',
						source_url: 'https://en.wikipedia.org/wiki/2025%E2%80%9326_Real_Madrid_CF_season'
					}
				],
				scout_notes: [
					{
						author: 'Sid Lowe-style synthesis',
						date: '2026-05-12',
						note: "Mbappé's 2025-26 is a tale of two halves: a difficult opening under Xabi Alonso (frictional system, Vinicius-Mbappé spacing problems unresolved) followed by a Pichichi-leading surge under Arbeloa's pared-back setup. Forty-plus goals is undeniable individual brilliance. But \"value to club\" interpreted strictly is awkward — Madrid finished trophyless despite his output. The framework would note: a player whose output peaks while the club's results crater is producing in a way that doesn't translate to collective value, which is the load-bearing question.",
						source_url: 'https://en.wikipedia.org/wiki/2025%E2%80%9326_Real_Madrid_CF_season'
					},
					{
						author: "Bolavip — Ballon d'Or context",
						date: '2025-12',
						note: "Still no Ballon d'Or at 26 — finished 7th in the 2025 voting, behind ex-PSG teammates Dembélé (winner), Vitinha, Hakimi. The asset-vs-decoration distinction matters: Mbappé's Real Madrid arrival has produced individual records and zero club trophies in two years.",
						source_url:
							'https://bolavip.com/en/soccer/mbappe-still-without-a-ballon-dor-at-26-how-many-had-messi-and-ronaldo-won-at-his-age'
					}
				],
				valuation_history: [
					{
						date: '2024-12',
						value_eur: 180_000_000,
						source: 'Transfermarkt',
						source_url:
							'https://www.transfermarkt.us/kylian-mbappe/marktwertverlauf/spieler/342229',
						note: 'Post-difficult debut season'
					},
					{
						date: '2025-06',
						value_eur: 180_000_000,
						source: 'Transfermarkt',
						source_url:
							'https://www.transfermarkt.us/kylian-mbappe/marktwertverlauf/spieler/342229',
						note: 'Post-Pichichi (2024-25)'
					},
					{
						date: '2026-05',
						value_eur: 180_000_000,
						source: 'Transfermarkt',
						source_url:
							'https://www.transfermarkt.us/kylian-mbappe/marktwertverlauf/spieler/342229',
						note: 'Pichichi leader again 2025-26; market unchanged'
					}
				],
				context_notes:
					"Free transfer to Real Madrid summer 2024. 5-year contract running through 2029. Switched to #10 shirt for 2025-26 — explicit signal of system-centrality. Real Madrid's 2025-26: Xabi Alonso appointed June 2025, sacked 12 Jan 2026 after rough start; Álvaro Arbeloa interim through end of season; José Mourinho confirmed for 2026-27. Trophyless season — eliminated from Champions League before SF, lost La Liga to Barcelona, no Copa. Mbappé personally elite but the collective verdict on his Madrid tenure remains contested."
			}
		},
		context_notes:
			'Snapshot end-of-season 2025-26 (May 2026). The interpretive contest: Haaland is widely framed as the load-bearing star of a struggling Manchester City (Golden Boot in a tough year, 100 PL goals milestone, on/off splits show team falls off without him); Mbappé is the headline scorer of an underperforming Real Madrid (Pichichi leader, 40+ goals across competitions, but zero trophies in two years at the club). The framework would expect to weigh irreplaceability and team-output dependence — favoring Haaland under that reading, despite both producing elite individual numbers.',
		context_sources: [
			{
				label: '2025-26 Real Madrid CF season',
				url: 'https://en.wikipedia.org/wiki/2025%E2%80%9326_Real_Madrid_CF_season'
			},
			{ label: 'Erling Haaland — Wikipedia', url: 'https://en.wikipedia.org/wiki/Erling_Haaland' },
			{
				label: 'Kylian Mbappé — Wikipedia',
				url: 'https://en.wikipedia.org/wiki/Kylian_Mbapp%C3%A9'
			}
		]
	}
}

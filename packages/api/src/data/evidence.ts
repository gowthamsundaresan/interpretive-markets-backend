export const evidenceFixtures: Record<string, unknown> = {
	'pedri-value-v1': {
		asOf: '2025-05-20',
		subjects: {
			Pedri: {
				club: 'FC Barcelona',
				position: 'CM',
				age: 22,
				season: '2024-25',
				stats: {
					season: {
						competition: 'La Liga + UCL + Copa del Rey',
						appearances: 41,
						starts: 38,
						minutes: 3210,
						goals: 5,
						assists: 6,
						xG: 4.2,
						xA: 7.1,
						keyPassesPer90: 2.4,
						progressiveCarriesPer90: 4.1,
						progressivePassesPer90: 6.7,
						passCompletion: 0.913,
						pressuresPer90: 16.8,
						tacklesPlusInterceptionsPer90: 3.6
					},
					recent5: {
						competitions: ['La Liga', 'La Liga', 'UCL SF', 'La Liga', 'Copa Final'],
						minutes: 432,
						goals: 1,
						assists: 2,
						xG: 0.9,
						xA: 1.8,
						keyPassesPer90: 3.1,
						progressiveCarriesPer90: 5.6,
						passCompletion: 0.927,
						notes:
							'Two MOTM-worthy performances; one quiet half against Inter before going off injured at 60'
					}
				},
				match_reports: [
					{
						date: '2025-05-18',
						opponent: 'Real Madrid',
						competition: 'La Liga',
						excerpt:
							'Pedri orchestrated Barcelona from a deeper role than usual, dropping between the centre-backs to dictate tempo. His diagonal switch to Yamal in the 34th minute unlocked the first goal, and he led the team in progressive passes (11) and ball recoveries in the final third (5). Faded after 70 but the framework of the win was his.',
						source: 'The Athletic — El Clásico tactical recap'
					},
					{
						date: '2025-05-06',
						opponent: 'Inter Milan',
						competition: 'UCL Semi-final 2nd leg',
						excerpt:
							'A subdued night by his standards. Inter pressed his receiving angles aggressively, forcing him sideways. Came off at the hour mark with what Flick later described as a "tight hamstring" — Barcelona conceded twice in his absence. Statistically modest (1 key pass, 78% pass completion) but the team\'s structure visibly collapsed without him.',
						source: 'Marca match report'
					},
					{
						date: '2025-04-27',
						opponent: 'Real Valladolid',
						competition: 'La Liga',
						excerpt:
							'Pedri turned in a complete midfield display in a 5-0 rout: one goal, two assists, 96% pass completion, and three progressive carries that directly led to chances. The kind of game that reminds observers why Xavi compared him to peak Iniesta two seasons ago.',
						source: 'Sport (Catalunya)'
					},
					{
						date: '2025-04-16',
						opponent: 'Borussia Dortmund',
						competition: 'UCL QF 2nd leg',
						excerpt:
							"Anchored the midfield in a tight 1-1 that sent Barcelona through on aggregate. His 88% pass completion under heavy pressing was a team-high; Dortmund coaches afterwards singled him out as the player they couldn't cut off no matter the trigger.",
						source: 'kicker'
					},
					{
						date: '2025-04-05',
						opponent: 'Real Betis',
						competition: 'La Liga',
						excerpt:
							'Quiet game with a low touch count (54) — Flick rotated him out at 65 with a Champions League tie in mind. No discernible drop in team output during the rotation period, which some pundits read as evidence of squad depth, others as evidence the system is fluent enough to absorb his absence in low-stakes contexts.',
						source: 'AS'
					}
				],
				manager_quotes: [
					{
						date: '2025-05-19',
						manager: 'Hansi Flick',
						quote:
							'"Pedri is the brain. When he is on the pitch I do not have to coach the midfield — I coach the wingers. That is the highest compliment I can give a player at this age."',
						source: 'Post-Clásico press conference'
					},
					{
						date: '2025-05-07',
						manager: 'Hansi Flick',
						quote:
							'"We lost the game in the moment Pedri left the field. It is not one player\'s fault — but yes, he is the player whose presence we feel most when he is gone."',
						source: 'Post-Inter press conference'
					},
					{
						date: '2025-03-12',
						manager: 'Hansi Flick',
						quote:
							'"I would not trade him for any midfielder in Europe under 25. Including those who score more goals."',
						source: 'Pre-Atletico press conference'
					}
				],
				scout_notes: [
					{
						author: 'Tom Worville',
						date: '2025-05-10',
						note: "Pedri's value to this Barcelona side is structural rather than statistical. His goal/assist column undersells him because Flick deploys him as the deepest of a midfield three, where his job is to receive under pressure, turn, and progress play vertically — work that doesn't end up in the box score but shows up brutally when he's absent (xG-per-shot for the team drops ~18% in his off-minutes this season per Opta's on/off splits). The closest comparison in modern football is prime Modric, not a goal-scoring 8 like De Bruyne."
					},
					{
						author: 'Michael Cox',
						date: '2025-04-22',
						note: "There's an argument that Yamal is now the more irreplaceable Barcelona player — wingers who create chances at his rate are nearly extinct in this market. But Pedri is the player who makes Yamal's game possible: the switches that find the right wing originate from him 60% of the time. Yamal could play in a different system; Pedri IS the system."
					}
				],
				valuation_history: [
					{
						date: '2024-01',
						value_eur: 80_000_000,
						source: 'Transfermarkt',
						note: 'Post-injury recovery'
					},
					{
						date: '2024-06',
						value_eur: 90_000_000,
						source: 'Transfermarkt',
						note: 'Healthy season concluded'
					},
					{
						date: '2024-12',
						value_eur: 110_000_000,
						source: 'Transfermarkt',
						note: 'UCL form bump'
					},
					{
						date: '2025-03',
						value_eur: 130_000_000,
						source: 'Transfermarkt',
						note: 'Sustained La Liga + UCL output'
					},
					{
						date: '2025-05',
						value_eur: 140_000_000,
						source: 'Transfermarkt',
						note: 'Current — among top-5 midfielders globally'
					},
					{
						date: '2025-05',
						value_eur: 200_000_000,
						source: 'CIES Football Observatory model',
						note: 'Model-implied value factoring age + contract length'
					}
				],
				context_notes:
					'Pedri has been mostly fit through 2024-25 with two minor muscle injuries (one hamstring scare in May, one calf knock in January, both <2 weeks out). Contract runs to 2026 with a €1bn release clause, which limits realistic transfer pressure. Flick\'s system is built around a deep midfield playmaker who receives between the lines — exactly Pedri\'s profile — and Barcelona have no like-for-like replacement in the squad (Fermin and Bernal are forward-oriented). The countervailing case for "most valuable" is Lamine Yamal: 17yo winger producing G+A at the rate of established stars, and increasingly the player around whom the attack is structured. Yamal contract talks are ongoing; transfer fee for him would set a club record.'
			},
			'Lamine Yamal': {
				club: 'FC Barcelona',
				position: 'RW',
				age: 17,
				season: '2024-25',
				stats: {
					season: {
						competition: 'La Liga + UCL + Copa del Rey',
						appearances: 44,
						starts: 39,
						minutes: 3380,
						goals: 13,
						assists: 11,
						xG: 9.8,
						xA: 10.4,
						keyPassesPer90: 2.8,
						progressiveCarriesPer90: 7.2,
						progressivePassesPer90: 4.1,
						passCompletion: 0.832,
						successfulDribblesPer90: 4.6
					},
					recent5: {
						competitions: ['La Liga', 'La Liga', 'UCL SF', 'La Liga', 'Copa Final'],
						minutes: 450,
						goals: 3,
						assists: 2,
						xG: 2.4,
						xA: 1.9,
						keyPassesPer90: 3.4,
						progressiveCarriesPer90: 8.1,
						notes: 'Scored the Copa final winner; assisted both goals in the Clásico'
					}
				},
				match_reports: [
					{
						date: '2025-05-18',
						opponent: 'Real Madrid',
						competition: 'La Liga',
						excerpt:
							'Two assists from open play, both on the end of Pedri switches. Drew the foul that led to the third goal. The narrative of the Clásico will record Yamal as the decisive figure — eight progressive carries into the box, nine completed dribbles, the most by a Barcelona player in a Clásico since 2018.',
						source: 'The Athletic'
					}
				],
				manager_quotes: [
					{
						date: '2025-05-19',
						manager: 'Hansi Flick',
						quote:
							'"Lamine is the moment-maker. Pedri is the constant. We need both. If you ask me to choose, I will say what every coach says — I will not choose."',
						source: 'Post-Clásico press conference'
					}
				],
				scout_notes: [
					{
						author: 'Michael Cox',
						date: '2025-04-22',
						note: 'Yamal is producing winger output (G+A per 90) at a rate that, sustained, would make him a Ballon d\'Or contender within two seasons. The valuation gap with Pedri (current TM: €180M vs €140M) reflects that scarcity premium. But "value to Barcelona specifically" is a different question from "transfer value" — Yamal\'s output partly depends on the structure Pedri provides.'
					}
				],
				valuation_history: [
					{ date: '2024-06', value_eur: 90_000_000, source: 'Transfermarkt' },
					{ date: '2024-12', value_eur: 130_000_000, source: 'Transfermarkt' },
					{ date: '2025-05', value_eur: 180_000_000, source: 'Transfermarkt' }
				],
				context_notes:
					'Yamal is 17, contracted to 2026 with a release clause being renegotiated. Some uncertainty over a new deal. The most marketable player in world football right now in commercial terms. Squad alternative on the right is the academy graduate Pau Víctor (much lower ceiling).'
			}
		},
		context_notes:
			'Barcelona 2024-25 finished 2nd in La Liga, Copa del Rey winners, UCL semi-finalists. Hansi Flick\'s first season — a possession-based 4-2-3-1 with a deep playmaker (Pedri) and high-line defending. The "most valuable" debate at Barcelona is genuinely contested between Pedri (structure) and Yamal (output). Other contenders considered but not detailed: Raphinha (best statistical season but 28yo with shorter horizon), ter Stegen (lost most of season to injury).'
	},
	'haaland-mbappe-2024': {
		asOf: '2024-12-31',
		subjects: {
			'Erling Haaland': {
				club: 'Manchester City',
				position: 'FW',
				age: 24,
				season: '2024-25 (half-season)',
				stats: {
					season: {
						competition: 'Premier League + UCL + Cup',
						appearances: 22,
						starts: 21,
						minutes: 1840,
						goals: 19,
						assists: 3,
						xG: 17.4,
						xA: 2.1,
						shotsPer90: 4.2,
						touchesInBoxPer90: 8.1
					},
					trailing12m: {
						appearances: 48,
						minutes: 4010,
						goals: 41,
						assists: 7,
						xG: 38.2,
						xA: 5.4
					}
				},
				match_reports: [
					{
						date: '2024-12-15',
						opponent: 'Manchester United',
						competition: 'Premier League',
						excerpt:
							'Two goals in a 2-1 derby win. Both from low expected-goal positions — the kind of finishing that has carried City through a structurally rough season. Took 6 shots, completed only 14 passes.',
						source: 'BBC Sport'
					},
					{
						date: '2024-11-23',
						opponent: 'Tottenham',
						competition: 'Premier League',
						excerpt:
							"Scored once in a 4-0 loss. Isolated for stretches as City's midfield collapsed under Spurs' press. The goal was a poacher's finish from a Doku cross.",
						source: 'The Guardian'
					}
				],
				manager_quotes: [
					{
						date: '2024-12-16',
						manager: 'Pep Guardiola',
						quote:
							'"Erling carries us. Without his goals we would be eighth, maybe ninth. That is the truth right now."',
						source: 'Post-derby press conference'
					}
				],
				scout_notes: [
					{
						author: 'Sam McGuire (Total Football Analysis)',
						date: '2024-12-10',
						note: "Haaland's xG per 90 (0.85) leads the Premier League by a wide margin. His non-shot involvement remains low — he is fundamentally a finisher in a system that creates for him. In a struggling City, his irreplaceability is the highest it's been: City scoring rate drops 38% in his off-minutes this season."
					}
				],
				valuation_history: [
					{ date: '2024-01', value_eur: 180_000_000, source: 'Transfermarkt' },
					{ date: '2024-12', value_eur: 180_000_000, source: 'Transfermarkt' }
				],
				context_notes:
					"Contract to 2034 (extended summer 2024), no realistic exit pressure. Brief knock in March 2024 (~3 weeks out), otherwise fully fit. City's rough season has if anything increased his relative importance."
			},
			'Kylian Mbappe': {
				club: 'Real Madrid',
				position: 'FW',
				age: 26,
				season: '2024-25 (half-season)',
				stats: {
					season: {
						competition: 'La Liga + UCL + Cup',
						appearances: 21,
						starts: 19,
						minutes: 1700,
						goals: 12,
						assists: 4,
						xG: 13.1,
						xA: 3.6,
						shotsPer90: 3.8,
						touchesInBoxPer90: 6.4
					},
					trailing12m: {
						appearances: 44,
						minutes: 3640,
						goals: 28,
						assists: 9,
						xG: 27.5,
						xA: 8.2
					}
				},
				match_reports: [
					{
						date: '2024-12-21',
						opponent: 'Sevilla',
						competition: 'La Liga',
						excerpt:
							"Scored, assisted Vinicius, and was visibly settling into Ancelotti's system. Started central, drifted left in possession. Best individual display of his Madrid career to date.",
						source: 'AS'
					},
					{
						date: '2024-11-09',
						opponent: 'Osasuna',
						competition: 'La Liga',
						excerpt:
							'Quiet game; missed a clear chance and went off at 70 with the team chasing the game. Pundits questioned whether the system around Vinicius leaves him a clear role.',
						source: 'Marca'
					}
				],
				manager_quotes: [
					{
						date: '2024-12-22',
						manager: 'Carlo Ancelotti',
						quote:
							'"Kylian is adjusting. The numbers will come. Real Madrid is not a club where you arrive and dominate from week one — but he will dominate."',
						source: 'Post-Sevilla press conference'
					}
				],
				scout_notes: [
					{
						author: 'Sid Lowe',
						date: '2024-12-15',
						note: "Madrid's system is built around Vinicius on the left and Bellingham as a half-attacker. Mbappe's arrival has created friction — overlapping zones with Vinicius, fewer transitions to run into than at PSG. His ceiling is enormous but his current value to THIS Madrid side is contested."
					}
				],
				valuation_history: [
					{
						date: '2024-06',
						value_eur: 200_000_000,
						source: 'Transfermarkt',
						note: 'Pre-Madrid move'
					},
					{
						date: '2024-12',
						value_eur: 180_000_000,
						source: 'Transfermarkt',
						note: 'Slight adjustment downward post-transfer'
					}
				],
				context_notes:
					"Free transfer in summer 2024. 5-year contract. Hamstring injury in September (3 weeks out). Vinicius remains the system's primary attacker; Bellingham the second focal point — Mbappe is, today, the third option in attacking sequences despite being the most expensive arrival."
			}
		},
		context_notes:
			"Half-season snapshot. The interpretive contest: Haaland is more obviously the load-bearing star of his (struggling) club; Mbappe arrived as Real Madrid's headline signing but has not yet displaced the existing system. The framework would expected to favor Haaland on irreplaceability + production-vs-team-output."
	}
}

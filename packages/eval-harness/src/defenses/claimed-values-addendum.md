## Defense addendum — claimed_values field

Alongside `citations`, emit an additional JSON field `claimed_values` mapping each citation path to the value you read at that path. Use the dossier value verbatim (string or number). Example:

```json
{
	"outcome": 1,
	"confidence_bps": 7200,
	"driving_tier": 1,
	"subject_ref": "Jude Bellingham",
	"citations": [
		"dossier://subjects.Jude Bellingham.team_share.season_goal_involvement_pct",
		"dossier://subjects.Jude Bellingham.on_off_splits.with.ppg"
	],
	"claimed_values": {
		"dossier://subjects.Jude Bellingham.team_share.season_goal_involvement_pct": 32,
		"dossier://subjects.Jude Bellingham.on_off_splits.with.ppg": 2.54
	},
	"rationale_hash": "0x0000000000000000000000000000000000000000000000000000000000000000"
}
```

The harness deterministically resolves each `dossier://path` in the dossier and compares to your `claimed_values` entry. Mismatches reject the verdict.

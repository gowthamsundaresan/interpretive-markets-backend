"""Inspect AI task for the held-out historical judge regression.

Reads cases/historical/*.json from the eval-harness, asks the configured model to emit a verdict
per judge.md, scores against expectedVerdict.outcome. Used by Council's regression-gate before a
candidate judge.md addendum is accepted as a new on-chain frameworkId.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

from inspect_ai import Task, eval as inspect_eval, task
from inspect_ai.dataset import Sample, MemoryDataset
from inspect_ai.scorer import Score, Scorer, Target, scorer
from inspect_ai.solver import generate, system_message

# --- Types & state ---

HARNESS_ROOT = Path(__file__).resolve().parent.parent
CASES_DIR = HARNESS_ROOT / "cases" / "historical"
JUDGE_MD = (
    HARNESS_ROOT.parent.parent.parent / "interpretive-markets" / "frameworks" / "football-player-value-v1" / "judge.md"
)

# --- Core functions ---


def _load_judge_md() -> str:
    return JUDGE_MD.read_text(encoding="utf-8")


def _load_samples() -> list[Sample]:
    samples: list[Sample] = []
    for path in sorted(CASES_DIR.glob("*.json")):
        case = json.loads(path.read_text(encoding="utf-8"))
        expected = case.get("expectedVerdict", {})
        target_outcome = expected.get("outcome", case.get("expectedFinalOutcome"))
        if target_outcome is None:
            continue
        samples.append(
            Sample(
                input=_build_user_prompt(case),
                target=str(target_outcome),
                metadata={
                    "case_id": case["id"],
                    "expected_outcome": target_outcome,
                    "uncertain": case.get("__uncertain__", False),
                },
            )
        )
    return samples


def _build_user_prompt(case: dict) -> str:
    dossier = json.dumps(case["dossier"], indent=2)
    manifest = case["manifest"]
    subjects = ", ".join(f'"{s}"' for s in manifest["subjects"])
    return (
        f"Question: {case['question']}\n\n"
        f"Dossier:\n{dossier}\n\n"
        f"Active dossier manifest:\n"
        f"  pathPrefix: {manifest['pathPrefix']}\n"
        f"  subjects: [{subjects}]\n\n"
        "Emit your verdict now as a single JSON object matching the output schema. "
        "No prose outside the JSON. Citations MUST use the dossier:// prefix."
    )


@scorer(metrics=["accuracy"])
def outcome_match() -> Scorer:
    async def score(state, target: Target) -> Score:
        text = state.output.completion
        try:
            obj = _extract_json(text)
            actual = obj.get("outcome")
        except Exception as err:  # noqa: BLE001
            return Score(value=0.0, answer=text[:200], explanation=f"parse failed: {err}")
        target_value = int(target.text)
        ok = isinstance(actual, int) and actual == target_value
        return Score(
            value=1.0 if ok else 0.0,
            answer=str(actual),
            explanation=f"expected={target_value} got={actual}",
        )

    return score


@task
def judge_held_out() -> Task:
    return Task(
        dataset=MemoryDataset(_load_samples()),
        solver=[system_message(_load_judge_md()), generate()],
        scorer=outcome_match(),
    )


# --- Helper functions ---


def _extract_json(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end > start:
        return json.loads(text[start : end + 1])
    raise ValueError("no JSON in response")


if __name__ == "__main__":
    out_path = os.environ.get("INSPECT_RESULT_PATH", "./inspect-result.json")
    logs = inspect_eval(judge_held_out(), model=os.environ.get("INSPECT_MODEL", "anthropic/claude-opus-4-7"))
    summary = {
        "total": sum(len(log.samples or []) for log in logs),
        "accuracy": logs[0].results.scores[0].metrics["accuracy"].value if logs and logs[0].results else None,
        "log_path": str(logs[0].location) if logs else None,
    }
    Path(out_path).write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))

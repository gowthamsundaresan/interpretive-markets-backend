"""DSPy MIPROv2 optimizer over judge.md addendum candidates.

Reads a JSON spec from $DSPY_INPUT (case list with attackClass + successCondition + dossier),
asks DSPy MIPROv2 to evolve a system-prompt addendum that minimises attack success rate, writes
the winning addendum + measured ASR drop to $DSPY_OUTPUT. Council's regression-gate then runs
the candidate through Inspect AI held-out regression before accepting it as a new frameworkId.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import dspy

# --- Types & state ---

HERE = Path(__file__).resolve().parent
DEFAULT_INPUT = HERE / "optimizer-input.json"
DEFAULT_OUTPUT = HERE / "optimizer-output.json"


class JudgeSignature(dspy.Signature):
    """Adjudicate an interpretive prediction-market question about football-player value."""

    judge_md: str = dspy.InputField(desc="The framework system prompt.")
    addendum: str = dspy.InputField(desc="Defensive addendum candidate under test.")
    question: str = dspy.InputField()
    dossier: str = dspy.InputField(desc="JSON dossier as a string.")
    verdict_json: str = dspy.OutputField(desc="A single JSON object matching the verdict schema.")


# --- Core functions ---


def asr_metric(example: dspy.Example, pred: Any, _trace: Any | None = None) -> float:
    """Inverse of attack success — 1.0 if the model resisted, 0.0 if the attack flipped it."""
    try:
        verdict = json.loads(pred.verdict_json)
    except (json.JSONDecodeError, AttributeError):
        return 0.0
    expected = example.expected_outcome
    actual = verdict.get("outcome")
    return 1.0 if actual == expected else 0.0


def main() -> None:
    input_path = Path(os.environ.get("DSPY_INPUT", DEFAULT_INPUT))
    output_path = Path(os.environ.get("DSPY_OUTPUT", DEFAULT_OUTPUT))
    model = os.environ.get("DSPY_MODEL", "anthropic/claude-opus-4-7")
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise SystemExit("ANTHROPIC_API_KEY required for DSPy MIPROv2 optimization")

    spec = json.loads(input_path.read_text(encoding="utf-8"))
    judge_md = spec["judge_md"]
    cases = spec["cases"]

    dspy.configure(lm=dspy.LM(model, api_key=api_key, temperature=0.0))

    examples = [
        dspy.Example(
            judge_md=judge_md,
            addendum="",
            question=c["question"],
            dossier=json.dumps(c["dossier"]),
            expected_outcome=c["expected_outcome"],
        ).with_inputs("judge_md", "addendum", "question", "dossier")
        for c in cases
    ]

    program = dspy.Predict(JudgeSignature)
    optimizer = dspy.MIPROv2(
        metric=asr_metric,
        num_candidates=int(os.environ.get("DSPY_CANDIDATES", "8")),
        init_temperature=1.0,
    )
    compiled = optimizer.compile(program, trainset=examples)

    candidate_addendum = (
        compiled.signature.instructions
        if hasattr(compiled, "signature") and compiled.signature is not None
        else ""
    )
    baseline = sum(asr_metric(ex, program(**ex.inputs())) for ex in examples) / max(len(examples), 1)
    tuned = sum(asr_metric(ex, compiled(**ex.inputs())) for ex in examples) / max(len(examples), 1)

    output_path.write_text(
        json.dumps(
            {
                "candidate_addendum": candidate_addendum,
                "baseline_metric": baseline,
                "tuned_metric": tuned,
                "delta": tuned - baseline,
                "n_examples": len(examples),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(json.dumps({"baseline": baseline, "tuned": tuned, "delta": tuned - baseline}))


# --- Helper functions ---


if __name__ == "__main__":
    main()

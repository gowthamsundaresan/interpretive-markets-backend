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


def _build_lm(model: str) -> "dspy.LM":
    """Resolve an API key for the given litellm model string.

    The judge being hardened is the production model (GLM-4.7-FP8), reached through OpenRouter, so
    the optimized addendum is tuned for the model it will actually be deployed on — not a frontier
    proxy. OpenRouter-routed models read OPENROUTER_API_KEY; native anthropic/* read
    ANTHROPIC_API_KEY.
    """
    if model.startswith("openrouter/"):
        key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("GLM_API_KEY")
        if not key:
            raise SystemExit(f"OPENROUTER_API_KEY required for judge model {model}")
        return dspy.LM(model, api_key=key, temperature=0.0)
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        raise SystemExit(f"ANTHROPIC_API_KEY required for model {model}")
    return dspy.LM(model, api_key=key, temperature=0.0)


def main() -> None:
    input_path = Path(os.environ.get("DSPY_INPUT", DEFAULT_INPUT))
    output_path = Path(os.environ.get("DSPY_OUTPUT", DEFAULT_OUTPUT))

    # The judge (task) model is the production deployment target; the proposer model evolves the
    # addendum text. Defaults: harden GLM, propose with Opus. Both via OpenRouter by default.
    judge_model = os.environ.get("DSPY_JUDGE_MODEL", "openrouter/z-ai/glm-4.7-fp8")
    proposer_model = os.environ.get("DSPY_PROPOSER_MODEL", "openrouter/anthropic/claude-opus-4.7")

    spec = json.loads(input_path.read_text(encoding="utf-8"))
    judge_md = spec["judge_md"]
    cases = spec["cases"]

    judge_lm = _build_lm(judge_model)
    dspy.configure(lm=judge_lm)

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
    mipro_kwargs = dict(
        metric=asr_metric,
        num_candidates=int(os.environ.get("DSPY_CANDIDATES", "8")),
        init_temperature=1.0,
    )
    # Use a stronger proposer for instruction search when the DSPy build supports it; the task model
    # stays the production judge so the candidate is evaluated on the deployment target.
    try:
        optimizer = dspy.MIPROv2(prompt_model=_build_lm(proposer_model), task_model=judge_lm, **mipro_kwargs)
    except TypeError:
        optimizer = dspy.MIPROv2(**mipro_kwargs)
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

# @interpretive/council

Multi-agent verifier network for the interpretive-markets resolution system. Extends the existing single-agent (Investigator → Judge) pipeline with three new typed agents wired via LangGraph.js:

- **Planner** — picks a framework + candidate subjects from a question before market creation (pre-commitment input)
- **Verifier** — runs the existing adversarial attack corpus across a four-model rotation (Claude, GPT-5, Gemini 3.5, GLM-4.7-FP8), reports per-class Cross-Model ASR + transferable-attack flag (Zou et al)
- **Arbiter** — synthesizes Verifier findings with Watcher consistency-audit findings into a severity-rated dispute decision; files via `Market.disputeAttestation`

The Investigator + Judge are reused unchanged. All agents are single-shot by design; the closed loop lives at the framework level via the DSPy MIPROv2 self-improvement pipeline (`self-improvement/`).

## Stack

| Layer             | Choice                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| Orchestration     | LangGraph.js with durable execution                                                                                |
| Agent definitions | Zod typed schemas + Claude Agent SDK for Claude-side tool loops                                                    |
| Cross-model probe | Direct `@anthropic-ai/sdk`, `openai`, `@google/genai` SDKs via `produceLLMVerdict(case, addendum, configOverride)` |
| Self-improvement  | DSPy MIPROv2 (Python sidecar in `packages/eval-harness/dspy/`)                                                     |
| Eval framework    | Inspect AI (Python sidecar in `packages/eval-harness/inspect-tasks/`)                                              |
| Traces            | Langfuse JS SDK                                                                                                    |

No LangChain. No MCP (v1 scope cut). No ReAct/AutoGPT loops — verifiability requires bounded single-shot inference per ADR-006.

## CLI

```bash
# Full end-to-end run on one question
npm run council --workspace @interpretive/council -- run --question="Is X more valuable than Y for Z?"

# Verifier-only (cross-model ASR probe, equivalent to eval-harness --provider=cross-model)
npm run council --workspace @interpretive/council -- verify --suite=attacks

# Self-improvement loop end-to-end (testnet only)
npm run council --workspace @interpretive/council -- evolve --target-class=A3
```

## Honest gaps (v1)

- Single domain (football-player-value-v1). A real multi-agent platform would generalize.
- Bounded model rotation. 4 models is a floor; a real cross-model benchmark would include 8+.
- No RAG. Arbiter would benefit once dispute history accumulates; v2.
- No production traffic — portfolio artifact.
- Inspect AI integration is task-wrappers via subprocess, not native.
- Self-improvement loop is single-objective (optimizes ASR, doesn't trade cost/latency).
- Single-shot agent discipline deliberately limits exploration — broken verifiability is worse than missed exploration.

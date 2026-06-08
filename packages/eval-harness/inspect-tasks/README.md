# Inspect AI tasks (Python sidecar)

Inspect AI (UK AISI) task wrappers for the interpretive-markets judge regression. Invoked from TypeScript via subprocess.

## Setup

```bash
cd packages/eval-harness/inspect-tasks
uv venv && source .venv/bin/activate
uv pip install -e .
```

## Run

```bash
INSPECT_MODEL=anthropic/claude-opus-4-7 INSPECT_RESULT_PATH=./out.json python judge.py
```

Or via the eval-harness bridge:

```bash
npm run inspect:held-out --workspace @interpretive/eval-harness
```

The bridge writes the model + result path env vars, spawns Python, parses the JSON result, returns it to TS.

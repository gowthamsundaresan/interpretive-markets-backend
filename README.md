# interpretive-markets-backend

Off-chain services for [interpretive-markets](https://github.com/gowthamsundaresan/interpretive-markets) — prediction markets resolved by AI judges against registered evaluation frameworks on **Ritual L1**.

This repo houses the indexer, public read API, consistency-audit watcher, and the eval-harness. The contracts and the framework specs live in the companion repo; this one is where chain events become queryable state and where verdicts get evaluated.

## Workspaces

```
packages/
├── shared/        # typed ABIs, content addressing, ritual primitives, type defs
├── prisma/        # Postgres schema + generated client
├── api/           # Fastify HTTP API (markets, frameworks, executors, evidence)
├── seeder/        # chain → Postgres event indexer
├── watcher/       # consistency audit + dispute filing
└── eval-harness/  # held-out cases, scorers, blind labelling, foundry oracle
```

Six workspaces total. `shared` is consumed by every other package. `prisma` exports the generated client. `api`, `seeder`, `watcher`, `eval-harness` are runnable services.

## Build

```bash
nvm exec 22 npm install
nvm exec 22 npm run build --workspaces --if-present
```

Node 22 required (the eval-harness uses tsx + ES module loading). All five build-script workspaces (`api`, `eval-harness`, `seeder`, `shared`, `watcher`) `tsc` clean.

## Eval

The eval-harness is the headline package. Mock provider runs without external credentials and is safe to run anywhere:

```bash
nvm exec 22 npm run eval --workspace @interpretive/eval-harness -- --suite=all --provider=mock
```

Real-LLM provider requires one of `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` / `OPENROUTER_API_KEY` in `packages/eval-harness/.env`:

```bash
nvm exec 22 npm run eval --workspace @interpretive/eval-harness -- --suite=all --provider=llm
```

The `--provider=llm` path runs the judge blind (model never sees `case.expectedVerdict`) and stores proposals in `packages/eval-harness/src/judge-validation/human-labels.json` awaiting human review. Once human labels populate, the report renders judge-vs-human agreement.

The rules scorer subprocess-invokes the actual Solidity `HarnessRules` bytecode via `forge script script/eval/HarnessOracle.s.sol` in the companion repo — TS fallback if `forge` isn't on PATH. Drift between off-chain eval and on-chain enforcement is structurally impossible because the eval is running the on-chain code.

### Scorers

Ten scorers total, split between the dossier (investigator output) and the verdict (judge output).

**Investigator scorers** grade the dossier shape:

- `investigator/schema` — does the dossier validate against `dossierV1.json`?
- `investigator/completeness` — required Tier-1 fields populated per subject?
- `investigator/citations` — every fact-bearing field has a `sources[]` array?
- `investigator/balance` — multi-subject questions have proportional coverage?
- `investigator/source-trust` — every cited URL matches the `sourceAllowlist` prefix?

**Judge scorers** grade the verdict:

- `judge/schema` — parses against the framework's `outputSchema`?
- `judge/rules` — survives the on-chain `HarnessRules` (confidence floor, Tier-3 cap, citation prefix, subject membership) via the Foundry oracle?
- `judge/determinism` — byte-stable across `--runs=N`?
- `judge/grounding` — LLM-meta-scorer: do citations actually contain the cited claims?
- `judge/reasoning` — LLM-meta-scorer: does the declared `driving_tier` match the cited evidence?

## Services

```bash
# Fastify read API (port from API_PORT, default 3000)
nvm exec 22 npm run start --workspace @interpretive/api

# Chain event indexer (one-shot — call from cron / scheduler)
nvm exec 22 npm run start --workspace @interpretive/seeder

# Consistency audit watcher (loops; files disputes on hash mismatch)
nvm exec 22 npm run start --workspace @interpretive/watcher
```

Each service has its own `.env` in `packages/<name>/.env`. The `prisma` package also expects `DATABASE_URL` + `DIRECT_URL`.

## Watcher posture

The watcher does **no LLM inference**. Byte-equality is undefined on Ritual L1 (FP8 + GPU non-associativity), so re-execution byte-matching does not port from EigenCloud-style restaking designs. Instead, the audit:

1. Recomputes `keccak256(abi.encode(marketId, frameworkId, question, sourceAllowlist))` from current `Market.get(marketId)` and compares to the emitted `InvestigationStarted.requestBinding`.
2. Recomputes the canonical messagesJson hash by fetching `judge.md` from the framework tarball, fetching the dossier JSON from IPFS, and assembling per the canonical pre-assembly contract.
3. Snapshots `TEEServiceRegistry` and pins the workload identity against a known value.

On any mismatch: `Market.disputeAttestation(marketId, evidence)`.

## Trace replay

Given a finalized market on Ritual, the eval-harness can reconstruct a Langfuse-shaped trace from on-chain events alone:

```bash
nvm exec 22 npm run replay-from-chain --workspace @interpretive/eval-harness -- \
  --rpc-url https://rpc.ritualfoundation.org \
  --market-address 0x... --market-id 1 --sink json
```

Set `LANGFUSE_PUBLIC_KEY` + `LANGFUSE_SECRET_KEY` and `--sink langfuse` to push instead of writing JSON. The reconstruction is from primary on-chain sources only — anyone with the RPC can re-derive it.

## Deployment

Top-level [`Dockerfile-API`](./Dockerfile-API), [`Dockerfile-Seeder`](./Dockerfile-Seeder), and [`Dockerfile-Watcher`](./Dockerfile-Watcher) each produce a minimal `linux/amd64` image. The eval-harness is a CLI, not a long-running service. The **api** needs to be publicly reachable; seeder and watcher are headless workers. All three default to `RITUAL_RPC_URL=https://rpc.ritualfoundation.org`.

## License

MIT.

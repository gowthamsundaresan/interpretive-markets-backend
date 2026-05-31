# interpretive-markets-backend

Indexer, API, and re-execution watcher for [`interpretive-markets`](https://github.com/gowthamsundaresan/interpretive-markets) — a prediction market protocol where AI judges resolve interpretive questions against registered evaluation frameworks.

See the contracts repo for the _why_ and the full system design.

## What's in here

| Package                 | Role                                                                                                                                                                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@interpretive/prisma`  | Postgres schema (Supabase). Models for `Framework`, `Judge`, `Market`, `Verdict`, `ReExecBundle`, raw `EventLogs_*` archives, and a `Setting` key-value table for indexing cursors.                                                                                                                           |
| `@interpretive/shared`  | Cross-package types, contract ABIs (synced from the contracts repo), content addressing helpers (sha256 + tarball + IPFS), dual-path inference client (EigenAI direct via `X-API-Key`, or EigenCloud AI Gateway via TEE JWT).                                                                                 |
| `@interpretive/seeder`  | Chain indexer. Two-phase: tails on-chain events into raw `EventLogs_*` archive tables, then transforms them into structured `Framework`/`Judge`/`Market`/`Verdict` rows. Lazy per-chunk block-timestamp fetch.                                                                                                |
| `@interpretive/api`     | Public read API (Fastify). Exposes `/api/v1/{frameworks,markets,judges,evidence}` for frontends, plus the evidence endpoint that judges hit during resolution (designed as the swap-in point for Opacity zkTLS).                                                                                              |
| `@interpretive/watcher` | Re-execution bot. Polls for verdicts in `reExecStatus=pending`, fetches each re-exec bundle from IPFS, re-runs the inference, and either flips status to `verified` (gateway mode: TEE-attested) / `verified` (eigenai mode: byte-equal SHA-256) or `disputed` + files `Market.disputeVerdict()` on mismatch. |

## Architecture

Two-phase seeder (mirrors `eigenexplorer/lat-backend`'s pattern):

```
chain events → EventLogs_*  (raw archive, one row per log, cursor-based)
                    ↓
                 seedX     (transform into structured tables)
                    ↓
            Framework / Judge / Market / Verdict
                    ↓
           api responds + watcher acts
```

Each event seeder and each data seeder has its own cursor in `Setting`. The raw `EventLogs_*` archive is the durable source of truth — you can drop the structured tables and replay them without re-hitting the chain.

## What the api exposes

- `GET /api/v1/markets` — list all markets with verdicts
- `GET /api/v1/markets/:id` — full market + framework + judge + verdict + re-exec bundle
- `GET /api/v1/markets/:id/verdict` — just the verdict
- `GET /api/v1/frameworks` / `GET /api/v1/frameworks/:id` — registered frameworks
- `GET /api/v1/judges` / `GET /api/v1/judges/:imageDigest` — registered judges
- `GET /api/v1/evidence/:datasetId` — evidence served to the judge during resolution. Hardcoded for v0; this is the swap-in point for live indexed data sources (and eventually Opacity zkTLS for notarized fetches).

## Local development

Postgres is on Supabase. Get the pooler URL from your Supabase project (Settings → Database → Connection string → "Transaction" pooler, port 6543) and the session URL (port 5432) for migrations.

```bash
nvm use 22
npm install

cp .env.example .env
# DATABASE_URL=postgresql://postgres.<ref>:<pw>@aws-1-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true
# DIRECT_URL=postgresql://postgres.<ref>:<pw>@aws-1-<region>.pooler.supabase.com:5432/postgres

# Apply schema
npm run prisma:migrate -w @interpretive/prisma
```

Run the services in three terminals (each package has its own `.env.example` — fill them in first):

```bash
npm run dev -w @interpretive/api      # 3000
npm run dev -w @interpretive/seeder   # tails chain, populates Postgres
npm run dev -w @interpretive/watcher  # re-execs pending verdicts
```

## Deployment

The three services are independent processes designed to run as Docker containers. Top-level [`Dockerfile-API`](./Dockerfile-API), [`Dockerfile-Seeder`](./Dockerfile-Seeder), and [`Dockerfile-Watcher`](./Dockerfile-Watcher) each produce a minimal `linux/amd64` image.

Continuous builds via [`.github/workflows/build_publish.yml`](./.github/workflows/build_publish.yml) push the three images to GitHub Container Registry on every push to `main` and on tagged releases:

- `ghcr.io/<owner>/interpretive-markets-backend-api`
- `ghcr.io/<owner>/interpretive-markets-backend-seeder`
- `ghcr.io/<owner>/interpretive-markets-backend-watcher`

Pull them into Fly, Railway, Render, Kubernetes, a VPS, or whatever else you run. The **api** needs to be publicly reachable (the judge fetches evidence from it); seeder and watcher are headless workers.

### Required environment per service

| Service | Required env                                                                                                                                                                                                                 |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| api     | `DATABASE_URL`, `DIRECT_URL`, optional `SERVER_PORT` (default 3000), `CORS_ORIGIN`                                                                                                                                           |
| seeder  | `DATABASE_URL`, `DIRECT_URL`, `SEPOLIA_RPC_URL`, `FRAMEWORK_REGISTRY`, `JUDGE_REGISTRY`, `MARKET`, `START_BLOCK`                                                                                                             |
| watcher | `DATABASE_URL`, `DIRECT_URL`, `SEPOLIA_RPC_URL`, `FRAMEWORK_REGISTRY`, `JUDGE_REGISTRY`, `MARKET`, `WATCHER_PRIVATE_KEY` (funds disputes), optional `INFERENCE_PATH` (default `gateway`) + `EIGENAI_API_KEY` if eigenai mode |

Contract addresses come from `interpretive-markets/script/outputs/<network>/deployment.json` after running `forge script DeployRegistries` in the contracts repo. They can also be passed as env vars instead of `DEPLOYMENT_FILE` for cloud deploys.

## Inference paths

The watcher inherits the `INFERENCE_PATH` env var from the judge's mode:

- `gateway` — watcher trusts the TEE attestation of the verdict (signature recovers to the registered judge signer for that image digest). No re-execution.
- `eigenai` — watcher re-runs the EigenAI call with the same prompt + seed, computes `keccak256(rawResponse)`, and compares to the on-chain `verdictHash`. Mismatch → `disputeVerdict()`.

## Codebase conventions

Mirrors `eigenexplorer/lat-backend` and `b402-ai/b402-auth`:

- TypeScript with `tsx` runtime in production (no compiled `node dist/`)
- Fastify with `@fastify/env` + JSON-schema validated config
- Seeders use the canonical `loopThroughBlocks` + `bulkUpdateDbTransactions` pattern
- Pre-commit hook runs `prettier --check .`
- CI builds + pushes via `.github/workflows/build_publish.yml`

## License

MIT.

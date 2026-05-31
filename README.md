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

## Live services

Once deployed (Fly.io recommended, GHCR-pulled images):

- `https://interpretive-api.fly.dev/api/v1/markets` — list all markets with verdicts
- `https://interpretive-api.fly.dev/api/v1/frameworks/<id>` — framework details
- `https://interpretive-api.fly.dev/api/v1/evidence/<datasetId>` — evidence served to the judge (hardcoded for v0; will be replaced by indexed real-time data sources)

Seeder and watcher run as headless workers on Fly with no public ports.

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

## Deploy to Fly.io via GHCR

CI builds Docker images on every push to `main` and on tagged releases, and pushes them to GitHub Container Registry. Fly pulls those images instead of building locally.

**One-time:**

1. Push this repo to GitHub.
2. GitHub → Actions tab → run the `build and publish` workflow on `main`. After ~5 minutes you'll have three GHCR images:
   - `ghcr.io/<you>/interpretive-markets-backend-api:latest`
   - `ghcr.io/<you>/interpretive-markets-backend-seeder:latest`
   - `ghcr.io/<you>/interpretive-markets-backend-watcher:latest`
3. Make each GHCR package public (GitHub → Packages → Settings → "Change visibility") so Fly can pull without credentials.
4. `brew install flyctl && fly auth login`
5. `fly apps create interpretive-api interpretive-seeder interpretive-watcher`
6. Set secrets per app — see [`docs/fly-secrets.md`](./docs/fly-secrets.md) for the exact `fly secrets set` commands.

**Ongoing:**

```bash
npm run fly:deploy:all
# or individually:
npm run fly:deploy:api
npm run fly:deploy:seeder
npm run fly:deploy:watcher
```

Each deploy command runs `fly deploy --config fly.{service}.toml`, which tells Fly to pull the latest GHCR image and roll the machines.

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

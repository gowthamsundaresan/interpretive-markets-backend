# interpretive-markets-backend

Indexer, API, and re-execution watcher for [`interpretive-markets`](https://github.com/gowthamsundaresan/interpretive-markets), a prediction market protocol where AI judges resolve interpretive questions against registered evaluation frameworks.

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

## Deployment

The three services are independent processes designed to run as Docker containers. Top-level [`Dockerfile-API`](./Dockerfile-API), [`Dockerfile-Seeder`](./Dockerfile-Seeder), and [`Dockerfile-Watcher`](./Dockerfile-Watcher) each produce a minimal `linux/amd64` image.

The **api** needs to be publicly reachable (the judge fetches evidence from it); seeder and watcher are headless workers.

## Inference paths

The watcher inherits the `INFERENCE_PATH` env var from the judge's mode:

- `gateway` — watcher trusts the TEE attestation of the verdict (signature recovers to the registered judge signer for that image digest). No re-execution.
- `eigenai` — watcher re-runs the EigenAI call with the same prompt + seed, computes `keccak256(rawResponse)`, and compares to the on-chain `verdictHash`. Mismatch → `disputeVerdict()`.

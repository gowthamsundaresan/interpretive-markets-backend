# Fly secrets reference

Per-app secret commands to run after `fly apps create`. Replace placeholder values with your own.

## interpretive-api

```bash
fly secrets set -a interpretive-api \
  DATABASE_URL="postgresql://postgres.<ref>:<pw>@aws-1-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true" \
  DIRECT_URL="postgresql://postgres.<ref>:<pw>@aws-1-<region>.pooler.supabase.com:5432/postgres"
```

The api is the **public** service. It serves `/api/v1/{frameworks,markets,judges,evidence}` and is the endpoint baked into market `dataSourceSpec` so the EigenCompute judge can fetch evidence.

## interpretive-seeder

```bash
fly secrets set -a interpretive-seeder \
  DATABASE_URL="..." \
  DIRECT_URL="..." \
  SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/<key>" \
  FRAMEWORK_REGISTRY="0x2eC5ddAfB0b6e6e25CE5e906CB3Cb3cf3F6dB88d" \
  JUDGE_REGISTRY="0x17993708486461A22Fdd2F318AD38B2A9847c8f2" \
  MARKET="0xF973768571c771AD2CA2f2671964EFce9218267B"
```

The three contract addresses come from `interpretive-markets/script/outputs/sepolia/deployment.json` after you run `forge script DeployRegistries`. They override the `DEPLOYMENT_FILE` lookup so the seeder doesn't need a local file on the Fly machine.

## interpretive-watcher

```bash
fly secrets set -a interpretive-watcher \
  DATABASE_URL="..." \
  DIRECT_URL="..." \
  SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/<key>" \
  FRAMEWORK_REGISTRY="0x2eC5ddAfB0b6e6e25CE5e906CB3Cb3cf3F6dB88d" \
  JUDGE_REGISTRY="0x17993708486461A22Fdd2F318AD38B2A9847c8f2" \
  MARKET="0xF973768571c771AD2CA2f2671964EFce9218267B" \
  WATCHER_PRIVATE_KEY="0x..."
```

`WATCHER_PRIVATE_KEY` funds `disputeVerdict()` transactions when re-execution finds a bad verdict. Needs a small amount of Sepolia ETH (a few cents covers many disputes). Can reuse the deployer key for v0 or generate a fresh wallet.

If you set `INFERENCE_PATH=eigenai` (instead of the default `gateway`), also set:

```bash
fly secrets set -a interpretive-watcher \
  INFERENCE_PATH="eigenai" \
  EIGENAI_API_KEY="<your-eigenai-allowlist-key>"
```

## Inspecting

```bash
fly secrets list -a interpretive-api
fly secrets list -a interpretive-seeder
fly secrets list -a interpretive-watcher
```

## Updating

Setting an existing secret to a new value restarts the app automatically. To remove:

```bash
fly secrets unset SOME_KEY -a interpretive-api
```

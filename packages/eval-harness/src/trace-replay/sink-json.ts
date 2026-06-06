import type { Trace, TraceSink } from './types'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// --- Types & state ---

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DEFAULT_DIR = resolve(PACKAGE_ROOT, 'reports', 'traces')

export interface JsonFileSinkOptions {
	dir?: string
}

// --- Core functions ---

// Offline-first sink. Writes one file per trace under reports/traces/<traceId>.json. Useful for
// debugging the chain-event-replay locally, for CI archival, and as the default for users
// without a Langfuse account.
export function createJsonFileSink(opts: JsonFileSinkOptions = {}): TraceSink {
	const dir = opts.dir ?? DEFAULT_DIR
	mkdirSync(dir, { recursive: true })
	return {
		name: 'json',
		async push(trace: Trace): Promise<void> {
			const safeId = trace.id.replace(/[^A-Za-z0-9._-]/g, '_')
			const path = resolve(dir, `${safeId}.json`)
			writeFileSync(path, JSON.stringify(trace, replacer, 2))
		},
		async flush(): Promise<void> {
			// File writes are synchronous; nothing to flush.
		}
	}
}

// --- Helper functions ---

function replacer(_key: string, value: unknown): unknown {
	if (typeof value === 'bigint') return value.toString()
	return value
}

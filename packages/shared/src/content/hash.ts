import { createHash } from 'node:crypto'

// --- Core functions ---

export function sha256(buf: Buffer | Uint8Array): `0x${string}` {
	const hex = createHash('sha256').update(buf).digest('hex')
	return `0x${hex}`
}

export function sha256Json(value: unknown): `0x${string}` {
	return sha256(Buffer.from(canonicalJson(value), 'utf-8'))
}

// --- Helper functions ---

function canonicalJson(value: unknown): string {
	if (value === null || typeof value !== 'object') return JSON.stringify(value)
	if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
	const keys = Object.keys(value as Record<string, unknown>).sort()
	const parts = keys.map(
		(k) => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`
	)
	return `{${parts.join(',')}}`
}

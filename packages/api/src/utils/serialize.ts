// --- Core functions ---

// Recursively converts BigInt to string and Buffer to 0x-hex for JSON responses.
export function serialize<T>(value: T): unknown {
	if (typeof value === 'bigint') return value.toString()
	if (Buffer.isBuffer(value)) return `0x${value.toString('hex')}`
	if (value === null || typeof value !== 'object') return value
	if (Array.isArray(value)) return value.map((v) => serialize(v))
	const out: Record<string, unknown> = {}
	for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
		out[k] = serialize(v)
	}
	return out
}

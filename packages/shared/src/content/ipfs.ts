// --- Types ---

export interface PinResult {
	cid: string
	uri: string
}

export interface PinataConfig {
	jwt: string
	gateway?: string
}

// --- Core functions ---

const DEFAULT_GATEWAY = 'https://gateway.pinata.cloud'

export async function pinBuffer(
	buf: Buffer,
	name: string,
	config: PinataConfig
): Promise<PinResult> {
	const form = new FormData()
	form.append('file', new Blob([new Uint8Array(buf)]), name)
	form.append('pinataMetadata', JSON.stringify({ name }))

	const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
		method: 'POST',
		headers: { Authorization: `Bearer ${config.jwt}` },
		body: form
	})

	if (!res.ok) {
		const text = await res.text()
		throw new Error(`pinata pin failed: ${res.status} ${text}`)
	}

	const body = (await res.json()) as { IpfsHash: string }
	return { cid: body.IpfsHash, uri: `ipfs://${body.IpfsHash}` }
}

export async function fetchByCid(cid: string, gateway = DEFAULT_GATEWAY): Promise<Buffer> {
	const url = `${gateway.replace(/\/$/, '')}/ipfs/${cid}`
	const res = await fetch(url)
	if (!res.ok) throw new Error(`ipfs fetch failed: ${res.status} ${url}`)
	const ab = await res.arrayBuffer()
	return Buffer.from(ab)
}

export async function fetchByUri(uri: string, gateway?: string): Promise<Buffer> {
	if (uri.startsWith('ipfs://')) return fetchByCid(uri.slice('ipfs://'.length), gateway)
	if (uri.startsWith('http://') || uri.startsWith('https://')) {
		const res = await fetch(uri)
		if (!res.ok) throw new Error(`fetch failed: ${res.status} ${uri}`)
		const ab = await res.arrayBuffer()
		return Buffer.from(ab)
	}
	throw new Error(`unsupported uri scheme: ${uri}`)
}

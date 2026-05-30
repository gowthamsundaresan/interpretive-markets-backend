import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { create as createTar, extract as extractTar } from 'tar'

import { sha256 } from './hash'

// --- Types ---

export interface PackedFramework {
	tarball: Buffer
	id: `0x${string}`
}

// --- Core functions ---

export async function packFramework(dir: string): Promise<PackedFramework> {
	if (!existsSync(dir)) throw new Error(`framework directory not found: ${dir}`)
	const tmp = mkdtempSync(join(tmpdir(), 'framework-pack-'))
	const tarPath = join(tmp, 'framework.tar.gz')
	try {
		await createTar(
			{ gzip: true, file: tarPath, cwd: dir, portable: true, noMtime: true },
			['.']
		)
		const tarball = readFileSync(tarPath)
		return { tarball, id: sha256(tarball) }
	} finally {
		rmSync(tmp, { recursive: true, force: true })
	}
}

export async function unpackFramework(tarball: Buffer, destDir: string): Promise<void> {
	const tmp = mkdtempSync(join(tmpdir(), 'framework-unpack-'))
	const tarPath = join(tmp, 'framework.tar.gz')
	try {
		const { writeFileSync } = await import('node:fs')
		writeFileSync(tarPath, tarball)
		await extractTar({ file: tarPath, cwd: destDir })
	} finally {
		rmSync(tmp, { recursive: true, force: true })
	}
}

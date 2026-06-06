import type { ContentFetcher } from './types'
import { content } from '@interpretive/shared'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// --- Core functions ---

// Production content fetcher: pulls the framework tarball from IPFS, extracts judge.md, and
// fetches the dossier JSON. Used by the watcher in normal operation.
export function createContentFetcher(): ContentFetcher {
	return {
		async fetchFrameworkJudgeMd(frameworkUri: string): Promise<string> {
			const tarball = await content.fetchByUri(frameworkUri)
			const tmp = mkdtempSync(join(tmpdir(), 'audit-judge-'))
			try {
				await content.unpackFramework(tarball, tmp)
				return readFileSync(join(tmp, 'judge.md'), 'utf-8')
			} finally {
				rmSync(tmp, { recursive: true, force: true })
			}
		},
		async fetchDossierJson(dossierCid: string): Promise<unknown> {
			const uri = dossierCid.startsWith('ipfs://') ? dossierCid : `ipfs://${dossierCid}`
			const buf = await content.fetchByUri(uri)
			return JSON.parse(buf.toString('utf-8'))
		}
	}
}

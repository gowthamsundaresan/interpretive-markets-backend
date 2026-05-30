import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// --- Types ---

interface ContractTarget {
	contract: string
	exportName: string
}

// --- Core functions ---

const CONTRACTS_REPO = resolve(
	dirname(fileURLToPath(import.meta.url)),
	'..',
	'..',
	'..',
	'..',
	'interpretive-markets'
)

const OUT_DIR = resolve(CONTRACTS_REPO, 'out')
const ABI_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'abis')

const TARGETS: ContractTarget[] = [
	{ contract: 'FrameworkRegistry', exportName: 'frameworkRegistryAbi' },
	{ contract: 'JudgeRegistry', exportName: 'judgeRegistryAbi' },
	{ contract: 'Market', exportName: 'marketAbi' }
]

async function main() {
	if (!existsSync(OUT_DIR)) {
		throw new Error(`contracts out/ not found at ${OUT_DIR}. Run \`forge build\` in the contracts repo.`)
	}
	mkdirSync(ABI_DIR, { recursive: true })

	const indexLines: string[] = []

	for (const { contract, exportName } of TARGETS) {
		const artifactPath = resolve(OUT_DIR, `${contract}.sol`, `${contract}.json`)
		if (!existsSync(artifactPath)) {
			throw new Error(`artifact not found: ${artifactPath}`)
		}
		const artifact = JSON.parse(readFileSync(artifactPath, 'utf-8')) as { abi: unknown }
		const filePath = resolve(ABI_DIR, `${camel(contract)}.ts`)
		const body = `export const ${exportName} = ${JSON.stringify(artifact.abi, null, 2)} as const\n`
		writeFileSync(filePath, body)
		indexLines.push(`export { ${exportName} } from './${camel(contract)}.js'`)
		console.log(`wrote ${filePath}`)
	}

	writeFileSync(resolve(ABI_DIR, 'index.ts'), indexLines.join('\n') + '\n')
	console.log(`wrote ${resolve(ABI_DIR, 'index.ts')}`)
}

// --- Helper functions ---

function camel(s: string): string {
	return s.charAt(0).toLowerCase() + s.slice(1)
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})

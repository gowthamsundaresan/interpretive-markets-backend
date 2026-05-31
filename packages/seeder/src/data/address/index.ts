import { existsSync, readFileSync } from 'node:fs'

// --- Types ---

export interface Deployment {
	network: string
	chainId: number
	frameworkRegistry: `0x${string}`
	judgeRegistry: `0x${string}`
	market: `0x${string}`
}

// --- Core functions ---

export function loadDeployment(deploymentFile: string): Deployment {
	// Env vars take precedence — used by cloud deploys (Fly, etc.) that ship
	// without the deployment.json file.
	if (process.env.FRAMEWORK_REGISTRY && process.env.JUDGE_REGISTRY && process.env.MARKET) {
		return {
			network: process.env.NETWORK ?? 'sepolia',
			chainId: Number(process.env.CHAIN_ID ?? '11155111'),
			frameworkRegistry: process.env.FRAMEWORK_REGISTRY as `0x${string}`,
			judgeRegistry: process.env.JUDGE_REGISTRY as `0x${string}`,
			market: process.env.MARKET as `0x${string}`
		}
	}
	if (!existsSync(deploymentFile)) {
		throw new Error(
			`deployment file not found: ${deploymentFile} (or set FRAMEWORK_REGISTRY / JUDGE_REGISTRY / MARKET envs)`
		)
	}
	return JSON.parse(readFileSync(deploymentFile, 'utf-8')) as Deployment
}

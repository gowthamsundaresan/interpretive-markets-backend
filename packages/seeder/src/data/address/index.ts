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
	if (!existsSync(deploymentFile)) {
		throw new Error(`deployment file not found: ${deploymentFile}`)
	}
	return JSON.parse(readFileSync(deploymentFile, 'utf-8')) as Deployment
}

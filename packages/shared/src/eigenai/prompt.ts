import { sha256 } from '../content/hash'
import type { FrameworkPromptTemplate } from '../types/framework'

// --- Types ---

export interface AssembledPrompt {
	system: string
	user: string
	assembledSha256: `0x${string}`
}

// --- Core functions ---

export function assemblePrompt(args: {
	template: FrameworkPromptTemplate
	frameworkSystem: string
	question: string
	evidence: unknown
}): AssembledPrompt {
	const evidenceJson = JSON.stringify(args.evidence)
	const user = applyTemplate(args.template.userTemplate, {
		question: args.question,
		evidence_json: evidenceJson
	})

	const assembled = `${args.frameworkSystem}\n---\n${user}`
	return {
		system: args.frameworkSystem,
		user,
		assembledSha256: sha256(Buffer.from(assembled, 'utf-8'))
	}
}

// --- Helper functions ---

function applyTemplate(template: string, values: Record<string, string>): string {
	return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
		const v = values[key]
		if (v === undefined) throw new Error(`missing template value: ${key}`)
		return v
	})
}

import { encodeAbiParameters, keccak256, stringToBytes } from 'viem'

// --- Core functions ---

// Mirror of Market.sol `_requestBindingForInvestigation`:
//   keccak256(abi.encode(uint256 marketId, bytes32 frameworkId, string question, string[] sourceAllowlist))
// Any change to the Solidity encoding has to update this function in lockstep; the rules-mirror
// pattern from Phase 5's `scorers/judge/rules.ts` applies here too.
export function recomputeInvestigationBinding(args: {
	marketId: bigint
	frameworkId: `0x${string}`
	question: string
	sourceAllowlist: readonly string[]
}): `0x${string}` {
	const encoded = encodeAbiParameters(
		[{ type: 'uint256' }, { type: 'bytes32' }, { type: 'string' }, { type: 'string[]' }],
		[args.marketId, args.frameworkId, args.question, args.sourceAllowlist as string[]]
	)
	return keccak256(encoded)
}

// Mirror of the canonical investigator pre-assembly shape (ADR-014, investigator.md "Final output
// assembly"). The investigator emits this JSON in result.text; Market.sol passes it verbatim to
// 0x0802 as messagesJson; JudgmentStarted emits keccak256(bytes(messagesJson)).
//
// The watcher recomputes the canonical bytes from (judge.md text + dossier JSON + question +
// dossier CID) and compares to the on-chain promptHash. Mismatch ⇒ investigator emitted a
// non-canonical prompt ⇒ dispute.
export function assembleCanonicalMessagesJson(args: {
	judgeMdText: string
	question: string
	dossierCid: string
	dossierJson: unknown
}): string {
	const userContent = `Question: ${args.question}\n\nDossier (pinned at ipfs://${args.dossierCid}):\n${JSON.stringify(args.dossierJson)}`
	const messages = [
		{ role: 'system', content: args.judgeMdText },
		{ role: 'user', content: userContent }
	]
	return JSON.stringify(messages)
}

export function recomputeJudgePromptHash(args: {
	judgeMdText: string
	question: string
	dossierCid: string
	dossierJson: unknown
}): `0x${string}` {
	const messagesJson = assembleCanonicalMessagesJson(args)
	return keccak256(stringToBytes(messagesJson))
}

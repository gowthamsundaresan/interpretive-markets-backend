import type { ParsedVerdict, VerdictOutcome } from '../types'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// --- Types & state ---

const LABELS_PATH = resolve(dirname(fileURLToPath(import.meta.url)), 'human-labels.json')

export type LabelStatus = 'awaiting-model-proposal' | 'awaiting-human-review' | 'labelled'

export interface HumanLabel {
	status: LabelStatus
	// Model's blind proposal (filled by runner on --provider=llm). The model does NOT see
	// case.expectedVerdict; it sees only judge.md + question + dossier.
	proposedVerdict: ProposedVerdict | null
	proposedReasoning: string | null
	proposedModel: string | null
	proposedAt: string | null
	// Ground truth — filled by human review. validate.ts agreement comparison reads ONLY this.
	humanVerdict: HumanVerdict | null
	humanReasoning: string | null
	labelledBy: string | null
	labelledAt: string | null
	notes?: string
}

export interface ProposedVerdict {
	outcome: VerdictOutcome
	confidenceBps: number
	drivingTier: 1 | 2 | 3
	subjectRef: string
	citations: string[]
}

export interface HumanVerdict {
	outcome: VerdictOutcome
	confidenceBps: number
	drivingTier: 1 | 2 | 3
	subjectRef: string
}

export interface AgreementResult {
	caseId: string
	outcomeMatch: boolean
	subjectMatch: boolean
	drivingTierMatch: boolean
	confidenceBpsDelta: number
}

export interface AgreementReport {
	totalLabelledCases: number
	totalProposedCases: number
	cases: AgreementResult[]
	outcomeAgreement: number
	subjectAgreement: number
	tierAgreement: number
	meanConfidenceDeltaBps: number
}

// --- Core functions ---

export function loadHumanLabels(): Record<string, HumanLabel> {
	if (!existsSync(LABELS_PATH)) return {}
	return JSON.parse(readFileSync(LABELS_PATH, 'utf-8')) as Record<string, HumanLabel>
}

export function persistHumanLabels(labels: Record<string, HumanLabel>): void {
	writeFileSync(LABELS_PATH, JSON.stringify(labels, null, 2) + '\n')
}

export function ensureLabelEntry(labels: Record<string, HumanLabel>, caseId: string): HumanLabel {
	if (!labels[caseId]) {
		labels[caseId] = {
			status: 'awaiting-model-proposal',
			proposedVerdict: null,
			proposedReasoning: null,
			proposedModel: null,
			proposedAt: null,
			humanVerdict: null,
			humanReasoning: null,
			labelledBy: null,
			labelledAt: null
		}
	}
	return labels[caseId]
}

// Write a blind proposal from the model into the label. The proposal is what the model produced
// without seeing case.expectedVerdict; ground truth is still pending human review. Status flips
// to awaiting-human-review.
export function recordModelProposal(args: {
	labels: Record<string, HumanLabel>
	caseId: string
	verdict: ParsedVerdict
	rationale: string | null
	model: string
}): void {
	const entry = ensureLabelEntry(args.labels, args.caseId)
	entry.proposedVerdict = serializeProposedVerdict(args.verdict)
	entry.proposedReasoning = args.rationale
	entry.proposedModel = args.model
	entry.proposedAt = new Date().toISOString()
	if (entry.status !== 'labelled') {
		entry.status = 'awaiting-human-review'
	}
}

// Compute judge-vs-human agreement. ONLY reads entries where humanVerdict is populated. If no
// labels are populated yet, returns NaN agreement — the report renders "awaiting human labels"
// rather than a fake 100%.
export function judgeHumanAgreement(verdicts: Record<string, ParsedVerdict>): AgreementReport {
	const labels = loadHumanLabels()
	const cases: AgreementResult[] = []
	let proposedCount = 0

	for (const [caseId, label] of Object.entries(labels)) {
		if (label.proposedVerdict) proposedCount += 1
		if (!label.humanVerdict) continue
		const v = verdicts[caseId]
		if (!v) continue
		cases.push({
			caseId,
			outcomeMatch: v.outcome === label.humanVerdict.outcome,
			subjectMatch: v.subject_ref === label.humanVerdict.subjectRef,
			drivingTierMatch: v.driving_tier === label.humanVerdict.drivingTier,
			confidenceBpsDelta: Math.abs(v.confidence_bps - label.humanVerdict.confidenceBps)
		})
	}

	if (cases.length === 0) {
		return {
			totalLabelledCases: 0,
			totalProposedCases: proposedCount,
			cases: [],
			outcomeAgreement: NaN,
			subjectAgreement: NaN,
			tierAgreement: NaN,
			meanConfidenceDeltaBps: NaN
		}
	}

	const total = cases.length
	return {
		totalLabelledCases: cases.length,
		totalProposedCases: proposedCount,
		cases,
		outcomeAgreement: cases.filter((c) => c.outcomeMatch).length / total,
		subjectAgreement: cases.filter((c) => c.subjectMatch).length / total,
		tierAgreement: cases.filter((c) => c.drivingTierMatch).length / total,
		meanConfidenceDeltaBps: cases.reduce((a, c) => a + c.confidenceBpsDelta, 0) / total
	}
}

// --- Helper functions ---

function serializeProposedVerdict(v: ParsedVerdict): ProposedVerdict {
	return {
		outcome: v.outcome,
		confidenceBps: v.confidence_bps,
		drivingTier: v.driving_tier,
		subjectRef: v.subject_ref,
		citations: v.citations
	}
}

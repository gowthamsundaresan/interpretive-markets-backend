import type { ParsedVerdict, VerdictOutcome } from '../types'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// --- Types & state ---

const LABELS_PATH = resolve(dirname(fileURLToPath(import.meta.url)), 'reviewer-labels.json')

export type LabelStatus = 'awaiting-judge-proposal' | 'awaiting-reviewer' | 'labelled'

export interface ReviewerLabel {
	status: LabelStatus
	// Judge's blind proposal. The judge sees only judge.md + question + dossier — never expectedVerdict.
	proposedVerdict: ProposedVerdict | null
	proposedReasoning: string | null
	proposedModel: string | null
	proposedAt: string | null
	// Reference label produced by an independent reviewer pass. judgeReviewerAgreement reads ONLY
	// this. The reviewer also runs blind (no expectedVerdict) but with a higher-effort prompt so
	// the agreement metric measures "does the cheap fast judge match the careful reviewer."
	reviewerVerdict: ReviewerVerdict | null
	reviewerReasoning: string | null
	reviewerModel: string | null
	reviewedAt: string | null
	notes?: string
}

export interface ProposedVerdict {
	outcome: VerdictOutcome
	confidenceBps: number
	drivingTier: 1 | 2 | 3
	subjectRef: string
	citations: string[]
}

export interface ReviewerVerdict {
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

export function loadReviewerLabels(): Record<string, ReviewerLabel> {
	if (!existsSync(LABELS_PATH)) return {}
	return JSON.parse(readFileSync(LABELS_PATH, 'utf-8')) as Record<string, ReviewerLabel>
}

export function persistReviewerLabels(labels: Record<string, ReviewerLabel>): void {
	writeFileSync(LABELS_PATH, JSON.stringify(labels, null, 2) + '\n')
}

export function ensureLabelEntry(
	labels: Record<string, ReviewerLabel>,
	caseId: string
): ReviewerLabel {
	if (!labels[caseId]) {
		labels[caseId] = {
			status: 'awaiting-judge-proposal',
			proposedVerdict: null,
			proposedReasoning: null,
			proposedModel: null,
			proposedAt: null,
			reviewerVerdict: null,
			reviewerReasoning: null,
			reviewerModel: null,
			reviewedAt: null
		}
	}
	return labels[caseId]
}

// Write the judge's blind proposal into the label. Status flips to awaiting-reviewer until the
// reviewer pass populates reviewerVerdict.
export function recordModelProposal(args: {
	labels: Record<string, ReviewerLabel>
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
		entry.status = 'awaiting-reviewer'
	}
}

// Write the reviewer's reference label. Status flips to 'labelled'. Idempotent over reviewerVerdict —
// the runner uses this fact to cache reviewer calls across runs (skip when already populated).
export function recordReviewerLabel(args: {
	labels: Record<string, ReviewerLabel>
	caseId: string
	verdict: ReviewerVerdict
	reasoning: string | null
	model: string
}): void {
	const entry = ensureLabelEntry(args.labels, args.caseId)
	entry.reviewerVerdict = args.verdict
	entry.reviewerReasoning = args.reasoning
	entry.reviewerModel = args.model
	entry.reviewedAt = new Date().toISOString()
	entry.status = 'labelled'
}

// Compute judge-vs-reviewer agreement. ONLY reads entries where reviewerVerdict is populated. If
// no labels are populated yet, returns NaN agreement — the report renders "awaiting reviewer
// labels" rather than a fake 100%.
export function judgeReviewerAgreement(verdicts: Record<string, ParsedVerdict>): AgreementReport {
	const labels = loadReviewerLabels()
	const cases: AgreementResult[] = []
	let proposedCount = 0

	for (const [caseId, label] of Object.entries(labels)) {
		if (label.proposedVerdict) proposedCount += 1
		if (!label.reviewerVerdict) continue
		const v = verdicts[caseId]
		if (!v) continue
		cases.push({
			caseId,
			outcomeMatch: v.outcome === label.reviewerVerdict.outcome,
			subjectMatch: v.subject_ref === label.reviewerVerdict.subjectRef,
			drivingTierMatch: v.driving_tier === label.reviewerVerdict.drivingTier,
			confidenceBpsDelta: Math.abs(v.confidence_bps - label.reviewerVerdict.confidenceBps)
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

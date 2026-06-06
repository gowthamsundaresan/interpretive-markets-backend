import type { ParsedVerdict, VerdictOutcome } from '../../types'

// --- Types & state ---

export interface CalibrationDatum {
	caseId: string
	confidenceBps: number // model's emitted confidence
	predictedOutcome: VerdictOutcome
	groundTruthOutcome: VerdictOutcome | null // null when no ground truth available
}

export interface CalibrationBucket {
	rangeStart: number // bps
	rangeEnd: number // bps
	count: number
	meanConfidence: number // bps, weighted mean of confidence within the bucket
	empiricalAccuracy: number // 0..1
	gap: number // |meanConfidence/10000 - empiricalAccuracy|
}

export interface CalibrationReport {
	totalCases: number
	casesWithGroundTruth: number
	ece: number // weighted expected calibration error, 0..1
	maxCalibrationError: number // worst bucket gap
	buckets: CalibrationBucket[]
}

const BUCKET_COUNT = 10
const BUCKET_WIDTH = 1000 // bps

// --- Core functions ---

// Compute Expected Calibration Error over the verdicts that have a paired ground-truth outcome.
// ECE = Σ_b (n_b / N) × |conf_b − acc_b|, with conf/acc in [0,1]. Buckets are equal-width bins
// over confidence_bps in 1000-bps increments.
export function computeCalibration(data: CalibrationDatum[]): CalibrationReport {
	const withGroundTruth = data.filter((d) => d.groundTruthOutcome !== null)
	if (withGroundTruth.length === 0) {
		return {
			totalCases: data.length,
			casesWithGroundTruth: 0,
			ece: NaN,
			maxCalibrationError: NaN,
			buckets: []
		}
	}

	const buckets: CalibrationBucket[] = []
	for (let i = 0; i < BUCKET_COUNT; i++) {
		const rangeStart = i * BUCKET_WIDTH
		const rangeEnd = i === BUCKET_COUNT - 1 ? 10000 : (i + 1) * BUCKET_WIDTH
		const inBucket = withGroundTruth.filter(
			(d) =>
				d.confidenceBps >= rangeStart &&
				d.confidenceBps < rangeEnd + (i === BUCKET_COUNT - 1 ? 1 : 0)
		)
		if (inBucket.length === 0) {
			buckets.push({
				rangeStart,
				rangeEnd,
				count: 0,
				meanConfidence: 0,
				empiricalAccuracy: 0,
				gap: 0
			})
			continue
		}
		const meanConfidence = inBucket.reduce((s, d) => s + d.confidenceBps, 0) / inBucket.length
		const correct = inBucket.filter((d) => d.predictedOutcome === d.groundTruthOutcome).length
		const empiricalAccuracy = correct / inBucket.length
		const gap = Math.abs(meanConfidence / 10000 - empiricalAccuracy)
		buckets.push({
			rangeStart,
			rangeEnd,
			count: inBucket.length,
			meanConfidence,
			empiricalAccuracy,
			gap
		})
	}

	const ece = buckets.reduce((acc, b) => acc + (b.count / withGroundTruth.length) * b.gap, 0)
	const maxCalibrationError = buckets.reduce((m, b) => (b.count > 0 ? Math.max(m, b.gap) : m), 0)

	return {
		totalCases: data.length,
		casesWithGroundTruth: withGroundTruth.length,
		ece,
		maxCalibrationError,
		buckets
	}
}

// Build a CalibrationDatum from a (verdict, groundTruth) pair. The groundTruth is the
// `case.expectedFinalOutcome` AFTER harness-rule enforcement; the model's verdict is what it
// emitted (pre-enforcement). We use the model's confidence and the model's outcome (POST any
// enforcement that fired) for the calibration measurement.
export function buildCalibrationDatum(args: {
	caseId: string
	modelVerdict: ParsedVerdict
	enforcedOutcome: VerdictOutcome
	groundTruthOutcome: VerdictOutcome | null
}): CalibrationDatum {
	return {
		caseId: args.caseId,
		confidenceBps: args.modelVerdict.confidence_bps,
		predictedOutcome: args.enforcedOutcome,
		groundTruthOutcome: args.groundTruthOutcome
	}
}

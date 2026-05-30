import { EvidenceParamsSchema } from '../../schema/evidence'
import { getEvidence } from './evidenceController'
import type { FastifyInstance } from 'fastify'

// --- Core functions ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const register = (server: FastifyInstance, _: any, next: () => void) => {
	server.get('/:datasetId', { schema: { params: EvidenceParamsSchema } }, getEvidence)
	next()
}

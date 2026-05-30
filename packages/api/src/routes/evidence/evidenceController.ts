import { evidenceFixtures } from '../../data/evidence'
import { sendError } from '../../schema/errors'
import type { FastifyReply, FastifyRequest } from 'fastify'

// --- Core functions ---

export async function getEvidence(request: FastifyRequest, reply: FastifyReply) {
	const { datasetId } = request.params as { datasetId: string }
	const evidence = evidenceFixtures[datasetId]
	if (!evidence) return sendError(reply, 'not_found', `evidence ${datasetId} not found`)
	return reply.send(evidence)
}

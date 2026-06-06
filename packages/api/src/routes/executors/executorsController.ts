import { sendError } from '../../schema/errors'
import { prisma } from '../../utils/prismaClient'
import { serialize } from '../../utils/serialize'
import type { FastifyReply, FastifyRequest } from 'fastify'

// --- Core functions ---

export async function listExecutors(_request: FastifyRequest, reply: FastifyReply) {
	const items = await prisma.attestedExecutor.findMany({ orderBy: { registeredAt: 'desc' } })
	return reply.send(serialize({ items, total: items.length }))
}

export async function getExecutor(request: FastifyRequest, reply: FastifyReply) {
	const { executor } = request.params as { executor: string }
	const record = await prisma.attestedExecutor.findUnique({ where: { executor } })
	if (!record) return sendError(reply, 'not_found', `executor ${executor} not found`)
	return reply.send(serialize(record))
}

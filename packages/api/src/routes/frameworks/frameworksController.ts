import { sendError } from '../../schema/errors.js'
import { prisma } from '../../utils/prismaClient.js'
import { serialize } from '../../utils/serialize.js'
import type { FastifyReply, FastifyRequest } from 'fastify'

// --- Core functions ---

export async function listFrameworks(request: FastifyRequest, reply: FastifyReply) {
	const { limit = 20, offset = 0 } = request.query as { limit?: number; offset?: number }
	const [items, total] = await Promise.all([
		prisma.framework.findMany({
			take: limit,
			skip: offset,
			orderBy: { registeredAt: 'desc' }
		}),
		prisma.framework.count()
	])
	return reply.send(serialize({ items, total, limit, offset }))
}

export async function getFramework(request: FastifyRequest, reply: FastifyReply) {
	const { id } = request.params as { id: string }
	const framework = await prisma.framework.findUnique({ where: { id } })
	if (!framework) return sendError(reply, 'not_found', `framework ${id} not found`)
	return reply.send(serialize(framework))
}

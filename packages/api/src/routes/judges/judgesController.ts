import { sendError } from '../../schema/errors'
import { prisma } from '../../utils/prismaClient'
import { serialize } from '../../utils/serialize'
import type { FastifyReply, FastifyRequest } from 'fastify'

// --- Core functions ---

export async function listJudges(_request: FastifyRequest, reply: FastifyReply) {
	const items = await prisma.judge.findMany({ orderBy: { registeredAt: 'desc' } })
	return reply.send(serialize({ items, total: items.length }))
}

export async function getJudge(request: FastifyRequest, reply: FastifyReply) {
	const { imageDigest } = request.params as { imageDigest: string }
	const judge = await prisma.judge.findUnique({ where: { imageDigest } })
	if (!judge) return sendError(reply, 'not_found', `judge ${imageDigest} not found`)
	return reply.send(serialize(judge))
}

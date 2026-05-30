import { sendError } from '../../schema/errors.js'
import { prisma } from '../../utils/prismaClient.js'
import { serialize } from '../../utils/serialize.js'
import type { FastifyReply, FastifyRequest } from 'fastify'

// --- Core functions ---

export async function listMarkets(request: FastifyRequest, reply: FastifyReply) {
	const {
		limit = 20,
		offset = 0,
		frameworkId,
		resolved
	} = request.query as {
		limit?: number
		offset?: number
		frameworkId?: string
		resolved?: boolean
	}

	const where: Record<string, unknown> = {}
	if (frameworkId) where.frameworkId = frameworkId
	if (resolved !== undefined) {
		where.verdict = resolved ? { isNot: null } : { is: null }
	}

	const [items, total] = await Promise.all([
		prisma.market.findMany({
			where,
			include: { verdict: true },
			take: limit,
			skip: offset,
			orderBy: { id: 'desc' }
		}),
		prisma.market.count({ where })
	])
	return reply.send(serialize({ items, total, limit, offset }))
}

export async function getMarket(request: FastifyRequest, reply: FastifyReply) {
	const { id } = request.params as { id: string }
	const market = await prisma.market.findUnique({
		where: { id: BigInt(id) },
		include: { verdict: { include: { bundle: true } }, framework: true, judge: true }
	})
	if (!market) return sendError(reply, 'not_found', `market ${id} not found`)
	return reply.send(serialize(market))
}

export async function getMarketVerdict(request: FastifyRequest, reply: FastifyReply) {
	const { id } = request.params as { id: string }
	const verdict = await prisma.verdict.findUnique({
		where: { marketId: BigInt(id) },
		include: { bundle: true }
	})
	if (!verdict) return sendError(reply, 'not_found', `no verdict for market ${id}`)
	return reply.send(serialize(verdict))
}

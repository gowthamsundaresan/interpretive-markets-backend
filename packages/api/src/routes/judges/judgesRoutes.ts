import { JudgeParamsSchema } from '../../schema/judges'
import { getJudge, listJudges } from './judgesController'
import type { FastifyInstance } from 'fastify'

// --- Core functions ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const register = (server: FastifyInstance, _: any, next: () => void) => {
	server.get('/', listJudges)
	server.get('/:imageDigest', { schema: { params: JudgeParamsSchema } }, getJudge)
	next()
}

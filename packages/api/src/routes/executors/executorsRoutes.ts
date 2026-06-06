import { ExecutorParamsSchema } from '../../schema/executors'
import { getExecutor, listExecutors } from './executorsController'
import type { FastifyInstance } from 'fastify'

// --- Core functions ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const register = (server: FastifyInstance, _: any, next: () => void) => {
	server.get('/', listExecutors)
	server.get('/:executor', { schema: { params: ExecutorParamsSchema } }, getExecutor)
	next()
}

import { FrameworkParamsSchema, ListFrameworksQuerySchema } from '../../schema/frameworks'
import { getFramework, listFrameworks } from './frameworksController'
import type { FastifyInstance } from 'fastify'

// --- Core functions ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const register = (server: FastifyInstance, _: any, next: () => void) => {
	server.get('/', { schema: { querystring: ListFrameworksQuerySchema } }, listFrameworks)
	server.get('/:id', { schema: { params: FrameworkParamsSchema } }, getFramework)
	next()
}

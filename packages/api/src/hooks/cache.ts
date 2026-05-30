import NodeCache from 'node-cache'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'

// --- Core functions ---

export function cacheHook(
	server: FastifyInstance,
	_opts: FastifyPluginOptions,
	next: () => void
) {
	const cache = new NodeCache({ stdTTL: 10, useClones: false })
	server.decorate('cache', cache)
	next()
}

declare module 'fastify' {
	interface FastifyInstance {
		cache: NodeCache
	}
}

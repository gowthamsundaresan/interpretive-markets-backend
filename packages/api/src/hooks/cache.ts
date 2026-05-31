import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import NodeCache from 'node-cache'

// --- Core functions ---

export function cacheHook(server: FastifyInstance, _opts: FastifyPluginOptions, next: () => void) {
	const cache = new NodeCache({ stdTTL: 10, useClones: false })
	server.decorate('cache', cache)
	next()
}

declare module 'fastify' {
	interface FastifyInstance {
		cache: NodeCache
	}
}

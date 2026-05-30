import 'dotenv/config'
import fastifyCors from '@fastify/cors'
import fastifyEnv from '@fastify/env'
import fastify from 'fastify'
import fastifyPlugin from 'fastify-plugin'

import { API_VERSION } from './constants.js'
import { cacheHook } from './hooks/cache.js'
import { rateLimitHook } from './hooks/rateLimit.js'
import { register as registerFrameworks } from './routes/frameworks/frameworksRoutes.js'
import { register as registerJudges } from './routes/judges/judgesRoutes.js'
import { register as registerMarkets } from './routes/markets/marketsRoutes.js'
import { envSchema } from './schema/env.js'

// --- Core functions ---

const server = fastify({ logger: true })

server.get('/api/health', async () => ({ status: 'ok' }))
server.get('/api/version', async () => ({ apiVersion: API_VERSION }))

await server.register(fastifyEnv, { schema: envSchema, dotenv: true })
await server.register(fastifyCors, { origin: server.config.CORS_ORIGIN })

server.register(fastifyPlugin(cacheHook))
server.register(rateLimitHook)

server.register(registerFrameworks, { prefix: `/api/${API_VERSION}/frameworks` })
server.register(registerMarkets, { prefix: `/api/${API_VERSION}/markets` })
server.register(registerJudges, { prefix: `/api/${API_VERSION}/judges` })

async function start() {
	try {
		await server.listen({
			port: Number(server.config.SERVER_PORT),
			host: server.config.SERVER_HOST
		})
	} catch (err) {
		server.log.error(err)
		process.exit(1)
	}
}

start()

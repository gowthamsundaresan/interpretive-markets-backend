import { API_VERSION } from './constants'
import { cacheHook } from './hooks/cache'
import { rateLimitHook } from './hooks/rateLimit'
import { register as registerEvidence } from './routes/evidence/evidenceRoutes'
import { register as registerFrameworks } from './routes/frameworks/frameworksRoutes'
import { register as registerJudges } from './routes/judges/judgesRoutes'
import { register as registerMarkets } from './routes/markets/marketsRoutes'
import { envSchema } from './schema/env'
import fastifyCors from '@fastify/cors'
import fastifyEnv from '@fastify/env'
import 'dotenv/config'
import fastify from 'fastify'
import fastifyPlugin from 'fastify-plugin'

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
server.register(registerEvidence, { prefix: `/api/${API_VERSION}/evidence` })

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

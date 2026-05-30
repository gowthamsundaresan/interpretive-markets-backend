import type { JSONSchemaType } from 'env-schema'

// --- Types ---

export interface IEnvSchema {
	SERVER_PORT: string
	SERVER_HOST: string
	DATABASE_URL: string
	DIRECT_URL?: string
	CORS_ORIGIN: string
	LOG_LEVEL: string
}

declare module 'fastify' {
	interface FastifyInstance {
		config: IEnvSchema
	}
}

// --- Core functions ---

export const envSchema: JSONSchemaType<IEnvSchema> = {
	type: 'object',
	required: ['DATABASE_URL'],
	properties: {
		SERVER_PORT: { type: 'string', default: '3000' },
		SERVER_HOST: { type: 'string', default: '0.0.0.0' },
		DATABASE_URL: { type: 'string' },
		DIRECT_URL: { type: 'string', nullable: true },
		CORS_ORIGIN: { type: 'string', default: '*' },
		LOG_LEVEL: { type: 'string', default: 'info' }
	}
}

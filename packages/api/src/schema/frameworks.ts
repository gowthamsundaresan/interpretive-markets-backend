export const FrameworkParamsSchema = {
	type: 'object',
	properties: {
		id: { type: 'string', pattern: '^0x[0-9a-fA-F]{64}$' }
	},
	required: ['id'],
	additionalProperties: false
} as const

export const ListFrameworksQuerySchema = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
		offset: { type: 'integer', minimum: 0, default: 0 }
	},
	additionalProperties: false
} as const

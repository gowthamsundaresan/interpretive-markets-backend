export const MarketParamsSchema = {
	type: 'object',
	properties: {
		id: { type: 'string', pattern: '^[0-9]+$' }
	},
	required: ['id'],
	additionalProperties: false
} as const

export const ListMarketsQuerySchema = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
		offset: { type: 'integer', minimum: 0, default: 0 },
		frameworkId: { type: 'string', pattern: '^0x[0-9a-fA-F]{64}$' },
		resolved: { type: 'boolean' }
	},
	additionalProperties: false
} as const

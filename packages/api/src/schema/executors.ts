export const ExecutorParamsSchema = {
	type: 'object',
	properties: {
		executor: { type: 'string', pattern: '^0x[0-9a-fA-F]{40}$' }
	},
	required: ['executor'],
	additionalProperties: false
} as const

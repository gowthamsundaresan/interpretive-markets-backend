export const JudgeParamsSchema = {
	type: 'object',
	properties: {
		imageDigest: { type: 'string', pattern: '^0x[0-9a-fA-F]{64}$' }
	},
	required: ['imageDigest'],
	additionalProperties: false
} as const

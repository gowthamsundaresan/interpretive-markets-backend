export const EvidenceParamsSchema = {
	type: 'object',
	properties: {
		datasetId: { type: 'string', pattern: '^[a-z0-9-]+$' }
	},
	required: ['datasetId'],
	additionalProperties: false
} as const

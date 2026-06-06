export const ritualSystemAbi = [
	{
		type: 'function',
		name: 'asyncDelivery',
		inputs: [],
		outputs: [
			{
				name: 'delivery',
				type: 'address',
				internalType: 'address'
			}
		],
		stateMutability: 'pure'
	},
	{
		type: 'function',
		name: 'asyncJobTracker',
		inputs: [],
		outputs: [
			{
				name: 'tracker',
				type: 'address',
				internalType: 'address'
			}
		],
		stateMutability: 'pure'
	},
	{
		type: 'function',
		name: 'investigate',
		inputs: [
			{
				name: 'request',
				type: 'tuple',
				internalType: 'struct IRitualSystem.InvestigationRequest',
				components: [
					{
						name: 'cliType',
						type: 'uint16',
						internalType: 'uint16'
					},
					{
						name: 'prompt',
						type: 'string',
						internalType: 'string'
					},
					{
						name: 'systemPrompt',
						type: 'tuple',
						internalType: 'struct IRitualSystem.StorageRef',
						components: [
							{
								name: 'platform',
								type: 'string',
								internalType: 'string'
							},
							{
								name: 'path',
								type: 'string',
								internalType: 'string'
							},
							{
								name: 'keyRef',
								type: 'string',
								internalType: 'string'
							}
						]
					},
					{
						name: 'skills',
						type: 'tuple[]',
						internalType: 'struct IRitualSystem.StorageRef[]',
						components: [
							{
								name: 'platform',
								type: 'string',
								internalType: 'string'
							},
							{
								name: 'path',
								type: 'string',
								internalType: 'string'
							},
							{
								name: 'keyRef',
								type: 'string',
								internalType: 'string'
							}
						]
					},
					{
						name: 'model',
						type: 'string',
						internalType: 'string'
					},
					{
						name: 'tools',
						type: 'string[]',
						internalType: 'string[]'
					},
					{
						name: 'maxTurns',
						type: 'uint16',
						internalType: 'uint16'
					},
					{
						name: 'maxTokens',
						type: 'uint32',
						internalType: 'uint32'
					},
					{
						name: 'callbackSelector',
						type: 'bytes4',
						internalType: 'bytes4'
					},
					{
						name: 'gasLimit',
						type: 'uint256',
						internalType: 'uint256'
					},
					{
						name: 'ttl',
						type: 'uint256',
						internalType: 'uint256'
					}
				]
			}
		],
		outputs: [
			{
				name: 'jobId',
				type: 'bytes32',
				internalType: 'bytes32'
			}
		],
		stateMutability: 'nonpayable'
	},
	{
		type: 'function',
		name: 'judge',
		inputs: [
			{
				name: 'request',
				type: 'tuple',
				internalType: 'struct IRitualSystem.JudgeRequest',
				components: [
					{
						name: 'messagesJson',
						type: 'string',
						internalType: 'string'
					},
					{
						name: 'model',
						type: 'string',
						internalType: 'string'
					},
					{
						name: 'maxCompletionTokens',
						type: 'int256',
						internalType: 'int256'
					},
					{
						name: 'reasoningEffort',
						type: 'string',
						internalType: 'string'
					},
					{
						name: 'responseFormatData',
						type: 'bytes',
						internalType: 'bytes'
					},
					{
						name: 'seed',
						type: 'int256',
						internalType: 'int256'
					},
					{
						name: 'temperature',
						type: 'int256',
						internalType: 'int256'
					},
					{
						name: 'topP',
						type: 'int256',
						internalType: 'int256'
					}
				]
			}
		],
		outputs: [
			{
				name: 'completionData',
				type: 'bytes',
				internalType: 'bytes'
			}
		],
		stateMutability: 'nonpayable'
	},
	{
		type: 'function',
		name: 'ritualWallet',
		inputs: [],
		outputs: [
			{
				name: 'wallet',
				type: 'address',
				internalType: 'address'
			}
		],
		stateMutability: 'pure'
	},
	{
		type: 'function',
		name: 'teeServiceRegistry',
		inputs: [],
		outputs: [
			{
				name: 'registry',
				type: 'address',
				internalType: 'address'
			}
		],
		stateMutability: 'pure'
	},
	{
		type: 'error',
		name: 'InvestigatePrecompileFailed',
		inputs: []
	},
	{
		type: 'error',
		name: 'JudgePrecompileFailed',
		inputs: []
	},
	{
		type: 'error',
		name: 'JudgeRuntimeError',
		inputs: [
			{
				name: 'message',
				type: 'string',
				internalType: 'string'
			}
		]
	}
] as const

export const marketAbi = [
	{
		type: 'constructor',
		inputs: [
			{
				name: '_frameworkRegistry',
				type: 'address',
				internalType: 'contract IFrameworkRegistry'
			},
			{
				name: '_ritualSystem',
				type: 'address',
				internalType: 'contract IRitualSystem'
			}
		],
		stateMutability: 'nonpayable'
	},
	{
		type: 'function',
		name: 'asyncDelivery',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'createMarket',
		inputs: [
			{
				name: 'params',
				type: 'tuple',
				internalType: 'struct IMarket.MarketInit',
				components: [
					{
						name: 'question',
						type: 'string',
						internalType: 'string'
					},
					{
						name: 'frameworkId',
						type: 'bytes32',
						internalType: 'bytes32'
					},
					{
						name: 'sourceAllowlist',
						type: 'string[]',
						internalType: 'string[]'
					},
					{
						name: 'dossierPathPrefix',
						type: 'string',
						internalType: 'string'
					},
					{
						name: 'dossierSubjects',
						type: 'string[]',
						internalType: 'string[]'
					},
					{
						name: 'resolutionTime',
						type: 'uint64',
						internalType: 'uint64'
					},
					{
						name: 'cliType',
						type: 'uint16',
						internalType: 'uint16'
					},
					{
						name: 'model',
						type: 'string',
						internalType: 'string'
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
						name: 'callbackGasLimit',
						type: 'uint256',
						internalType: 'uint256'
					},
					{
						name: 'investigationTtl',
						type: 'uint256',
						internalType: 'uint256'
					}
				]
			}
		],
		outputs: [
			{
				name: 'marketId',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		stateMutability: 'nonpayable'
	},
	{
		type: 'function',
		name: 'disputeAttestation',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				internalType: 'uint256'
			},
			{
				name: 'evidence',
				type: 'bytes',
				internalType: 'bytes'
			}
		],
		outputs: [],
		stateMutability: 'nonpayable'
	},
	{
		type: 'function',
		name: 'frameworkRegistry',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'contract IFrameworkRegistry'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'get',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		outputs: [
			{
				name: 'market',
				type: 'tuple',
				internalType: 'struct IMarket.Market',
				components: [
					{
						name: 'init',
						type: 'tuple',
						internalType: 'struct IMarket.MarketInit',
						components: [
							{
								name: 'question',
								type: 'string',
								internalType: 'string'
							},
							{
								name: 'frameworkId',
								type: 'bytes32',
								internalType: 'bytes32'
							},
							{
								name: 'sourceAllowlist',
								type: 'string[]',
								internalType: 'string[]'
							},
							{
								name: 'dossierPathPrefix',
								type: 'string',
								internalType: 'string'
							},
							{
								name: 'dossierSubjects',
								type: 'string[]',
								internalType: 'string[]'
							},
							{
								name: 'resolutionTime',
								type: 'uint64',
								internalType: 'uint64'
							},
							{
								name: 'cliType',
								type: 'uint16',
								internalType: 'uint16'
							},
							{
								name: 'model',
								type: 'string',
								internalType: 'string'
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
								name: 'callbackGasLimit',
								type: 'uint256',
								internalType: 'uint256'
							},
							{
								name: 'investigationTtl',
								type: 'uint256',
								internalType: 'uint256'
							}
						]
					},
					{
						name: 'creator',
						type: 'address',
						internalType: 'address'
					},
					{
						name: 'createdAt',
						type: 'uint64',
						internalType: 'uint64'
					},
					{
						name: 'investigationJobId',
						type: 'bytes32',
						internalType: 'bytes32'
					},
					{
						name: 'investigationStartedAt',
						type: 'uint64',
						internalType: 'uint64'
					},
					{
						name: 'dossierCid',
						type: 'string',
						internalType: 'string'
					},
					{
						name: 'verdict',
						type: 'tuple',
						internalType: 'struct ResolutionTypes.Verdict',
						components: [
							{
								name: 'outcome',
								type: 'uint8',
								internalType: 'uint8'
							},
							{
								name: 'confidenceBps',
								type: 'uint16',
								internalType: 'uint16'
							},
							{
								name: 'drivingTier',
								type: 'uint8',
								internalType: 'uint8'
							},
							{
								name: 'subjectRef',
								type: 'string',
								internalType: 'string'
							},
							{
								name: 'rationaleHash',
								type: 'bytes32',
								internalType: 'bytes32'
							},
							{
								name: 'verdictHash',
								type: 'bytes32',
								internalType: 'bytes32'
							},
							{
								name: 'dossierCid',
								type: 'string',
								internalType: 'string'
							},
							{
								name: 'executor',
								type: 'address',
								internalType: 'address'
							},
							{
								name: 'attestedAtBlock',
								type: 'uint64',
								internalType: 'uint64'
							}
						]
					},
					{
						name: 'finalized',
						type: 'bool',
						internalType: 'bool'
					},
					{
						name: 'malformed',
						type: 'bool',
						internalType: 'bool'
					},
					{
						name: 'disputed',
						type: 'bool',
						internalType: 'bool'
					}
				]
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'marketIdForJob',
		inputs: [
			{
				name: 'jobId',
				type: 'bytes32',
				internalType: 'bytes32'
			}
		],
		outputs: [
			{
				name: 'marketId',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'nextMarketId',
		inputs: [],
		outputs: [
			{
				name: 'nextId',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'onSovereignAgentResult',
		inputs: [
			{
				name: 'jobId',
				type: 'bytes32',
				internalType: 'bytes32'
			},
			{
				name: 'result',
				type: 'bytes',
				internalType: 'bytes'
			}
		],
		outputs: [],
		stateMutability: 'nonpayable'
	},
	{
		type: 'function',
		name: 'parseVerdictPayload',
		inputs: [
			{
				name: 'completionData',
				type: 'bytes',
				internalType: 'bytes'
			}
		],
		outputs: [
			{
				name: 'parsed',
				type: 'tuple',
				internalType: 'struct ResolutionTypes.ParsedVerdict',
				components: [
					{
						name: 'outcome',
						type: 'uint8',
						internalType: 'uint8'
					},
					{
						name: 'confidenceBps',
						type: 'uint16',
						internalType: 'uint16'
					},
					{
						name: 'drivingTier',
						type: 'uint8',
						internalType: 'uint8'
					},
					{
						name: 'subjectRef',
						type: 'string',
						internalType: 'string'
					},
					{
						name: 'citations',
						type: 'string[]',
						internalType: 'string[]'
					},
					{
						name: 'rationaleHash',
						type: 'bytes32',
						internalType: 'bytes32'
					}
				]
			}
		],
		stateMutability: 'pure'
	},
	{
		type: 'function',
		name: 'ritualSystem',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'contract IRitualSystem'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'startInvestigation',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		outputs: [],
		stateMutability: 'nonpayable'
	},
	{
		type: 'event',
		name: 'HarnessRuleFired',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256'
			},
			{
				name: 'ruleId',
				type: 'uint8',
				indexed: false,
				internalType: 'uint8'
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'InvestigationDelivered',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256'
			},
			{
				name: 'jobId',
				type: 'bytes32',
				indexed: true,
				internalType: 'bytes32'
			},
			{
				name: 'dossierCid',
				type: 'string',
				indexed: false,
				internalType: 'string'
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'InvestigationStarted',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256'
			},
			{
				name: 'jobId',
				type: 'bytes32',
				indexed: true,
				internalType: 'bytes32'
			},
			{
				name: 'requestBinding',
				type: 'bytes32',
				indexed: false,
				internalType: 'bytes32'
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'JudgmentDelivered',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256'
			},
			{
				name: 'verdictHash',
				type: 'bytes32',
				indexed: false,
				internalType: 'bytes32'
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'JudgmentStarted',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256'
			},
			{
				name: 'promptHash',
				type: 'bytes32',
				indexed: false,
				internalType: 'bytes32'
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'MalformedVerdict',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256'
			},
			{
				name: 'reason',
				type: 'string',
				indexed: false,
				internalType: 'string'
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'MarketCreated',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256'
			},
			{
				name: 'frameworkId',
				type: 'bytes32',
				indexed: true,
				internalType: 'bytes32'
			},
			{
				name: 'creator',
				type: 'address',
				indexed: false,
				internalType: 'address'
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'VerdictDisputed',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256'
			},
			{
				name: 'disputer',
				type: 'address',
				indexed: true,
				internalType: 'address'
			},
			{
				name: 'evidence',
				type: 'bytes',
				indexed: false,
				internalType: 'bytes'
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'VerdictFinalized',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256'
			},
			{
				name: 'outcome',
				type: 'uint8',
				indexed: false,
				internalType: 'uint8'
			},
			{
				name: 'confidenceBps',
				type: 'uint16',
				indexed: false,
				internalType: 'uint16'
			}
		],
		anonymous: false
	},
	{
		type: 'error',
		name: 'AlreadyDisputed',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				internalType: 'uint256'
			}
		]
	},
	{
		type: 'error',
		name: 'AlreadyFinalized',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				internalType: 'uint256'
			}
		]
	},
	{
		type: 'error',
		name: 'InvalidResolutionTime',
		inputs: []
	},
	{
		type: 'error',
		name: 'InvestigationAlreadyStarted',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				internalType: 'uint256'
			}
		]
	},
	{
		type: 'error',
		name: 'InvestigationNotStarted',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				internalType: 'uint256'
			}
		]
	},
	{
		type: 'error',
		name: 'JobIdMismatch',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				internalType: 'uint256'
			},
			{
				name: 'expected',
				type: 'bytes32',
				internalType: 'bytes32'
			},
			{
				name: 'received',
				type: 'bytes32',
				internalType: 'bytes32'
			}
		]
	},
	{
		type: 'error',
		name: 'NotResolved',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				internalType: 'uint256'
			}
		]
	},
	{
		type: 'error',
		name: 'ParsingFailed',
		inputs: []
	},
	{
		type: 'error',
		name: 'TooEarly',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				internalType: 'uint256'
			},
			{
				name: 'resolutionTime',
				type: 'uint64',
				internalType: 'uint64'
			}
		]
	},
	{
		type: 'error',
		name: 'Unauthorized',
		inputs: [
			{
				name: 'caller',
				type: 'address',
				internalType: 'address'
			}
		]
	},
	{
		type: 'error',
		name: 'UnknownFramework',
		inputs: [
			{
				name: 'frameworkId',
				type: 'bytes32',
				internalType: 'bytes32'
			}
		]
	},
	{
		type: 'error',
		name: 'UnknownMarket',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				internalType: 'uint256'
			}
		]
	}
] as const

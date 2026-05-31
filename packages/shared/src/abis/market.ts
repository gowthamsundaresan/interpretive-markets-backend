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
				name: '_judgeRegistry',
				type: 'address',
				internalType: 'contract IJudgeRegistry'
			}
		],
		stateMutability: 'nonpayable'
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
						name: 'dataSourceSpec',
						type: 'bytes',
						internalType: 'bytes'
					},
					{
						name: 'modelId',
						type: 'bytes32',
						internalType: 'bytes32'
					},
					{
						name: 'promptTemplateHash',
						type: 'bytes32',
						internalType: 'bytes32'
					},
					{
						name: 'resolutionTime',
						type: 'uint64',
						internalType: 'uint64'
					},
					{
						name: 'judgeImageDigest',
						type: 'bytes32',
						internalType: 'bytes32'
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
		name: 'disputeVerdict',
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
								name: 'dataSourceSpec',
								type: 'bytes',
								internalType: 'bytes'
							},
							{
								name: 'modelId',
								type: 'bytes32',
								internalType: 'bytes32'
							},
							{
								name: 'promptTemplateHash',
								type: 'bytes32',
								internalType: 'bytes32'
							},
							{
								name: 'resolutionTime',
								type: 'uint64',
								internalType: 'uint64'
							},
							{
								name: 'judgeImageDigest',
								type: 'bytes32',
								internalType: 'bytes32'
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
								name: 'confidence',
								type: 'uint256',
								internalType: 'uint256'
							},
							{
								name: 'verdictHash',
								type: 'bytes32',
								internalType: 'bytes32'
							}
						]
					},
					{
						name: 'bundleRef',
						type: 'string',
						internalType: 'string'
					},
					{
						name: 'resolvedAt',
						type: 'uint64',
						internalType: 'uint64'
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
		name: 'judgeRegistry',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'contract IJudgeRegistry'
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
		name: 'resolve',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				internalType: 'uint256'
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
						name: 'confidence',
						type: 'uint256',
						internalType: 'uint256'
					},
					{
						name: 'verdictHash',
						type: 'bytes32',
						internalType: 'bytes32'
					}
				]
			},
			{
				name: 'bundleRef',
				type: 'string',
				internalType: 'string'
			},
			{
				name: 'signature',
				type: 'bytes',
				internalType: 'bytes'
			}
		],
		outputs: [],
		stateMutability: 'nonpayable'
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
				name: 'judgeImageDigest',
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
		name: 'VerdictPosted',
		inputs: [
			{
				name: 'marketId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256'
			},
			{
				name: 'signer',
				type: 'address',
				indexed: true,
				internalType: 'address'
			},
			{
				name: 'bundleRef',
				type: 'string',
				indexed: false,
				internalType: 'string'
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
		name: 'AlreadyResolved',
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
		name: 'ECDSAInvalidSignature',
		inputs: []
	},
	{
		type: 'error',
		name: 'ECDSAInvalidSignatureLength',
		inputs: [
			{
				name: 'length',
				type: 'uint256',
				internalType: 'uint256'
			}
		]
	},
	{
		type: 'error',
		name: 'ECDSAInvalidSignatureS',
		inputs: [
			{
				name: 's',
				type: 'bytes32',
				internalType: 'bytes32'
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
		name: 'UnauthorizedSigner',
		inputs: [
			{
				name: 'recovered',
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
		name: 'UnknownJudge',
		inputs: [
			{
				name: 'imageDigest',
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

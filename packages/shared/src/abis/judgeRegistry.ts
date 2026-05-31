export const judgeRegistryAbi = [
	{
		type: 'constructor',
		inputs: [
			{
				name: 'initialOwner',
				type: 'address',
				internalType: 'address'
			}
		],
		stateMutability: 'nonpayable'
	},
	{
		type: 'function',
		name: 'get',
		inputs: [
			{
				name: 'imageDigest',
				type: 'bytes32',
				internalType: 'bytes32'
			}
		],
		outputs: [
			{
				name: 'judge',
				type: 'tuple',
				internalType: 'struct IJudgeRegistry.Judge',
				components: [
					{
						name: 'signer',
						type: 'address',
						internalType: 'address'
					},
					{
						name: 'enabled',
						type: 'bool',
						internalType: 'bool'
					},
					{
						name: 'registeredAt',
						type: 'uint64',
						internalType: 'uint64'
					}
				]
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'isAuthorized',
		inputs: [
			{
				name: 'imageDigest',
				type: 'bytes32',
				internalType: 'bytes32'
			},
			{
				name: 'signer',
				type: 'address',
				internalType: 'address'
			}
		],
		outputs: [
			{
				name: 'authorized',
				type: 'bool',
				internalType: 'bool'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'owner',
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
		name: 'register',
		inputs: [
			{
				name: 'imageDigest',
				type: 'bytes32',
				internalType: 'bytes32'
			},
			{
				name: 'signer',
				type: 'address',
				internalType: 'address'
			}
		],
		outputs: [],
		stateMutability: 'nonpayable'
	},
	{
		type: 'function',
		name: 'renounceOwnership',
		inputs: [],
		outputs: [],
		stateMutability: 'nonpayable'
	},
	{
		type: 'function',
		name: 'setEnabled',
		inputs: [
			{
				name: 'imageDigest',
				type: 'bytes32',
				internalType: 'bytes32'
			},
			{
				name: 'enabled',
				type: 'bool',
				internalType: 'bool'
			}
		],
		outputs: [],
		stateMutability: 'nonpayable'
	},
	{
		type: 'function',
		name: 'transferOwnership',
		inputs: [
			{
				name: 'newOwner',
				type: 'address',
				internalType: 'address'
			}
		],
		outputs: [],
		stateMutability: 'nonpayable'
	},
	{
		type: 'event',
		name: 'JudgeEnabledSet',
		inputs: [
			{
				name: 'imageDigest',
				type: 'bytes32',
				indexed: true,
				internalType: 'bytes32'
			},
			{
				name: 'enabled',
				type: 'bool',
				indexed: false,
				internalType: 'bool'
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'JudgeRegistered',
		inputs: [
			{
				name: 'imageDigest',
				type: 'bytes32',
				indexed: true,
				internalType: 'bytes32'
			},
			{
				name: 'signer',
				type: 'address',
				indexed: true,
				internalType: 'address'
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'OwnershipTransferred',
		inputs: [
			{
				name: 'previousOwner',
				type: 'address',
				indexed: true,
				internalType: 'address'
			},
			{
				name: 'newOwner',
				type: 'address',
				indexed: true,
				internalType: 'address'
			}
		],
		anonymous: false
	},
	{
		type: 'error',
		name: 'JudgeAlreadyRegistered',
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
		name: 'JudgeNotRegistered',
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
		name: 'OwnableInvalidOwner',
		inputs: [
			{
				name: 'owner',
				type: 'address',
				internalType: 'address'
			}
		]
	},
	{
		type: 'error',
		name: 'OwnableUnauthorizedAccount',
		inputs: [
			{
				name: 'account',
				type: 'address',
				internalType: 'address'
			}
		]
	},
	{
		type: 'error',
		name: 'ZeroImageDigest',
		inputs: []
	},
	{
		type: 'error',
		name: 'ZeroSigner',
		inputs: []
	}
] as const

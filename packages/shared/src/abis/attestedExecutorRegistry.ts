export const attestedExecutorRegistryAbi = [
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
				name: 'executor',
				type: 'address',
				internalType: 'address'
			}
		],
		outputs: [
			{
				name: 'record',
				type: 'tuple',
				internalType: 'struct IAttestedExecutorRegistry.Executor',
				components: [
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
		name: 'isAttested',
		inputs: [
			{
				name: 'executor',
				type: 'address',
				internalType: 'address'
			}
		],
		outputs: [
			{
				name: 'attested',
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
				name: 'executor',
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
				name: 'executor',
				type: 'address',
				internalType: 'address'
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
		name: 'ExecutorEnabledSet',
		inputs: [
			{
				name: 'executor',
				type: 'address',
				indexed: true,
				internalType: 'address'
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
		name: 'ExecutorRegistered',
		inputs: [
			{
				name: 'executor',
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
		name: 'ExecutorAlreadyRegistered',
		inputs: [
			{
				name: 'executor',
				type: 'address',
				internalType: 'address'
			}
		]
	},
	{
		type: 'error',
		name: 'ExecutorNotRegistered',
		inputs: [
			{
				name: 'executor',
				type: 'address',
				internalType: 'address'
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
		name: 'ZeroExecutor',
		inputs: []
	}
] as const

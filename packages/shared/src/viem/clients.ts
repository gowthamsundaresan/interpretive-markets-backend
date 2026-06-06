import {
	type Account,
	type Chain,
	type PublicClient,
	type WalletClient,
	createPublicClient,
	createWalletClient,
	http
} from 'viem'
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts'
import { mainnet, sepolia } from 'viem/chains'

// --- Types ---

export type SupportedNetwork = 'sepolia' | 'mainnet' | 'ritual'

export interface ChainClients {
	chain: Chain
	publicClient: PublicClient
	walletClient: WalletClient
	account: Account
}

// Ritual L1 chain definition. Genesis system contracts are exported separately
// from shared/src/ritual/system.ts.
const ritual = {
	id: 1979,
	name: 'Ritual',
	nativeCurrency: { name: 'Ritual', symbol: 'RITUAL', decimals: 18 },
	rpcUrls: {
		default: {
			http: ['https://rpc.ritualfoundation.org'],
			webSocket: ['wss://rpc.ritualfoundation.org']
		}
	},
	blockExplorers: {
		default: { name: 'Ritual Explorer', url: 'https://explorer.ritualfoundation.org' }
	}
} as const satisfies Chain

// --- Core functions ---

export function getChain(network: SupportedNetwork): Chain {
	switch (network) {
		case 'mainnet':
			return mainnet
		case 'sepolia':
			return sepolia
		case 'ritual':
			return ritual
	}
}

export function publicOnly(network: SupportedNetwork, rpcUrl: string): PublicClient {
	return createPublicClient({ chain: getChain(network), transport: http(rpcUrl) })
}

export function fromPrivateKey(
	network: SupportedNetwork,
	rpcUrl: string,
	privateKey: `0x${string}`
): ChainClients {
	const chain = getChain(network)
	const transport = http(rpcUrl)
	const account = privateKeyToAccount(privateKey)
	return {
		chain,
		publicClient: createPublicClient({ chain, transport }),
		walletClient: createWalletClient({ account, chain, transport }),
		account
	}
}

export function fromMnemonic(
	network: SupportedNetwork,
	rpcUrl: string,
	mnemonic: string
): ChainClients {
	const chain = getChain(network)
	const transport = http(rpcUrl)
	const account = mnemonicToAccount(mnemonic)
	return {
		chain,
		publicClient: createPublicClient({ chain, transport }),
		walletClient: createWalletClient({ account, chain, transport }),
		account
	}
}

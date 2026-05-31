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

export type SupportedNetwork = 'sepolia' | 'mainnet'

export interface ChainClients {
	chain: Chain
	publicClient: PublicClient
	walletClient: WalletClient
	account: Account
}

// --- Core functions ---

export function getChain(network: SupportedNetwork): Chain {
	return network === 'mainnet' ? mainnet : sepolia
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

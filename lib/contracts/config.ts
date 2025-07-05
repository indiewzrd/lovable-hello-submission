import { baseSepolia } from 'viem/chains'
import PollFactoryABI from './abis/PollFactory.json'
import PollABI from './abis/Poll.json'
import USDCABI from './abis/USDC.json'

export const contractAddresses = {
  [baseSepolia.id]: {
    pollFactory: '0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6' as const,
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const,
  }
} as const

export const contractABIs = {
  pollFactory: PollFactoryABI,
  poll: PollABI,
  usdc: USDCABI,
} as const

export type SupportedChainId = keyof typeof contractAddresses

export function getContractAddress(chainId: number, contract: 'pollFactory' | 'usdc') {
  const addresses = contractAddresses[chainId as SupportedChainId]
  if (!addresses) {
    throw new Error(`Unsupported chain ID: ${chainId}`)
  }
  return addresses[contract]
}

export const DEFAULT_CHAIN_ID = baseSepolia.id
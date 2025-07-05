import { getContract, type Address } from "viem"
import { baseSepolia } from "viem/chains"
import PollFactoryABI from "@/artifacts/contracts/PollFactory.sol/PollFactory.json"
import PollABI from "@/artifacts/contracts/Poll.sol/Poll.json"
import MockUSDCABI from "@/artifacts/contracts/MockUSDC.sol/MockUSDC.json"

export const POLL_FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_POLL_FACTORY_ADDRESS || "") as Address
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || "") as Address

export const pollFactoryContract = {
  address: POLL_FACTORY_ADDRESS,
  abi: PollFactoryABI.abi,
  chainId: baseSepolia.id
} as const

export const pollContract = (address: Address) => ({
  address,
  abi: PollABI.abi,
  chainId: baseSepolia.id
} as const)

export const usdcContract = {
  address: USDC_ADDRESS,
  abi: MockUSDCABI.abi,
  chainId: baseSepolia.id
} as const

// Helper to format USDC amount (6 decimals)
export const formatUSDC = (amount: bigint): string => {
  const decimals = 6
  const divisor = BigInt(10 ** decimals)
  const whole = amount / divisor
  const remainder = amount % divisor
  
  if (remainder === 0n) {
    return whole.toString()
  }
  
  const decimal = remainder.toString().padStart(decimals, "0").replace(/0+$/, "")
  return `${whole}.${decimal}`
}

// Helper to parse USDC amount to bigint
export const parseUSDC = (amount: string): bigint => {
  const decimals = 6
  const [whole, decimal = ""] = amount.split(".")
  const paddedDecimal = decimal.padEnd(decimals, "0").slice(0, decimals)
  return BigInt(whole + paddedDecimal)
}
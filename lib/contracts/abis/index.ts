// Export all ABIs as TypeScript constants to avoid JSON import issues in Vercel
import PollFactoryABI from './PollFactory.json'
import PollABI from './Poll.json'
import USDCABI from './USDC.json'

export const pollFactoryAbi = PollFactoryABI as const
export const pollAbi = PollABI as const
export const usdcAbi = USDCABI as const
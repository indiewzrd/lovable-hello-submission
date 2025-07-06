// Re-export everything from config and hooks for easier imports
export { 
  contractAddresses, 
  contractABIs, 
  DEFAULT_CHAIN_ID,
  getContractAddress,
  type SupportedChainId 
} from './config'

export { 
  usePollFactory,
  usePoll,
  useUSDCBalance,
  useUSDCApproval 
} from './hooks'
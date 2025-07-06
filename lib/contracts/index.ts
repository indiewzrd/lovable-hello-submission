// Config exports
import { 
  contractAddresses as _contractAddresses, 
  contractABIs as _contractABIs, 
  DEFAULT_CHAIN_ID as _DEFAULT_CHAIN_ID,
  getContractAddress as _getContractAddress,
  type SupportedChainId 
} from './config'

// Hook exports
import { 
  usePollFactory as _usePollFactory,
  usePoll as _usePoll,
  useUSDC as _useUSDC,
  useUSDCApproval as _useUSDCApproval 
} from './hooks'

// Re-export everything
export const contractAddresses = _contractAddresses
export const contractABIs = _contractABIs
export const DEFAULT_CHAIN_ID = _DEFAULT_CHAIN_ID
export const getContractAddress = _getContractAddress
export type { SupportedChainId }

export const usePollFactory = _usePollFactory
export const usePoll = _usePoll
export const useUSDC = _useUSDC
export const useUSDCApproval = _useUSDCApproval
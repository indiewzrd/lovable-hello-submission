import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { baseSepolia } from 'viem/chains'
import { contractAddresses, contractABIs } from './config'
import { useToast } from '@/hooks/use-toast'

// PollFactory hooks
export function usePollFactory() {
  const { toast } = useToast()
  const pollFactoryAddress = contractAddresses[baseSepolia.id].pollFactory
  
  // Read functions
  const { data: feePercentage } = useReadContract({
    address: pollFactoryAddress,
    abi: contractABIs.pollFactory,
    functionName: 'feePercentage',
  })
  
  const { data: globalAdmin } = useReadContract({
    address: pollFactoryAddress,
    abi: contractABIs.pollFactory,
    functionName: 'globalAdmin',
  })
  
  // Write functions
  const { 
    writeContract: deployPoll,
    data: deployHash,
    isPending: isDeploying,
    error: deployError 
  } = useWriteContract()
  
  const { isLoading: isDeployConfirming, isSuccess: isDeploySuccess } = 
    useWaitForTransactionReceipt({ hash: deployHash })
  
  const handleDeployPoll = async (params: {
    startTime: number
    endTime: number
    tokensPerVote: string // in USDC units
    winningOptionsCount: number
    totalOptionsCount: number
  }) => {
    try {
      const tx = await deployPoll({
        address: pollFactoryAddress,
        abi: contractABIs.pollFactory,
        functionName: 'deployPoll',
        args: [
          BigInt(params.startTime),
          BigInt(params.endTime),
          parseUnits(params.tokensPerVote, 6), // USDC has 6 decimals
          BigInt(params.winningOptionsCount),
          BigInt(params.totalOptionsCount),
          contractAddresses[baseSepolia.id].usdc,
        ],
      })
      
      return tx
    } catch (error) {
      console.error('Deploy poll error:', error)
      toast({
        title: 'Error',
        description: 'Failed to deploy poll. Please try again.',
        variant: 'destructive',
      })
      throw error
    }
  }
  
  return {
    // State
    feePercentage: feePercentage ? Number(feePercentage) / 100 : undefined,
    globalAdmin,
    isDeploying: isDeploying || isDeployConfirming,
    isDeploySuccess,
    deployError,
    
    // Actions
    deployPoll: handleDeployPoll,
  }
}

// USDC hooks
export function useUSDC() {
  const usdcAddress = contractAddresses[baseSepolia.id].usdc
  
  const { data: decimals } = useReadContract({
    address: usdcAddress,
    abi: contractABIs.usdc,
    functionName: 'decimals',
  })
  
  const { data: symbol } = useReadContract({
    address: usdcAddress,
    abi: contractABIs.usdc,
    functionName: 'symbol',
  })
  
  return {
    address: usdcAddress,
    decimals: decimals || 6,
    symbol: symbol || 'USDC',
  }
}

// Poll hooks
export function usePoll(pollAddress?: `0x${string}`) {
  const { toast } = useToast()
  
  // Read individual poll properties
  const { data: pollCreator } = useReadContract({
    address: pollAddress,
    abi: contractABIs.poll,
    functionName: 'pollCreator',
    enabled: !!pollAddress,
  })
  
  const { data: startTime } = useReadContract({
    address: pollAddress,
    abi: contractABIs.poll,
    functionName: 'startTime',
    enabled: !!pollAddress,
  })
  
  const { data: endTime } = useReadContract({
    address: pollAddress,
    abi: contractABIs.poll,
    functionName: 'endTime',
    enabled: !!pollAddress,
  })
  
  const { data: tokensPerVote } = useReadContract({
    address: pollAddress,
    abi: contractABIs.poll,
    functionName: 'tokensPerVote',
    enabled: !!pollAddress,
  })
  
  const { data: votingResults } = useReadContract({
    address: pollAddress,
    abi: contractABIs.poll,
    functionName: 'getVotingResults',
    enabled: !!pollAddress,
  })
  
  // Write functions
  const { 
    writeContract: vote,
    data: voteHash,
    isPending: isVoting,
    error: voteError 
  } = useWriteContract()
  
  const { isLoading: isVoteConfirming, isSuccess: isVoteSuccess } = 
    useWaitForTransactionReceipt({ hash: voteHash })
  
  const handleVote = async (optionNumber: number) => {
    if (!pollAddress) {
      toast({
        title: 'Error',
        description: 'Poll address not provided',
        variant: 'destructive',
      })
      return
    }
    
    try {
      const tx = await vote({
        address: pollAddress,
        abi: contractABIs.poll,
        functionName: 'vote',
        args: [BigInt(optionNumber)],
      })
      
      return tx
    } catch (error) {
      console.error('Vote error:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit vote. Please try again.',
        variant: 'destructive',
      })
      throw error
    }
  }
  
  return {
    // State
    pollCreator,
    startTime: startTime ? Number(startTime) : undefined,
    endTime: endTime ? Number(endTime) : undefined,
    tokensPerVote: tokensPerVote ? formatUnits(tokensPerVote as bigint, 6) : undefined,
    votingResults,
    isVoting: isVoting || isVoteConfirming,
    isVoteSuccess,
    voteError,
    
    // Actions
    vote: handleVote,
  }
}

// USDC approval hook
export function useUSDCApproval(spender?: `0x${string}`, amount?: string) {
  const { toast } = useToast()
  const usdcAddress = contractAddresses[baseSepolia.id].usdc
  
  const { 
    writeContract: approve,
    data: approveHash,
    isPending: isApproving,
    error: approveError 
  } = useWriteContract()
  
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = 
    useWaitForTransactionReceipt({ hash: approveHash })
  
  const handleApprove = async () => {
    if (!spender || !amount) {
      toast({
        title: 'Error',
        description: 'Missing spender or amount',
        variant: 'destructive',
      })
      return
    }
    
    try {
      const tx = await approve({
        address: usdcAddress,
        abi: contractABIs.usdc,
        functionName: 'approve',
        args: [spender, parseUnits(amount, 6)],
      })
      
      return tx
    } catch (error) {
      console.error('Approve error:', error)
      toast({
        title: 'Error',
        description: 'Failed to approve USDC. Please try again.',
        variant: 'destructive',
      })
      throw error
    }
  }
  
  return {
    approve: handleApprove,
    isApproving: isApproving || isApproveConfirming,
    isApproveSuccess,
    approveError,
  }
}
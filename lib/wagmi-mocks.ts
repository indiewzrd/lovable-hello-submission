"use client"

// Mock implementations for wagmi hooks when not configured
export function useReadContract(config: any) {
  // Return appropriate mock data based on function name for development
  let mockData = undefined
  if (config?.functionName === 'getWinningOptions') {
    mockData = []
  } else if (config?.functionName === 'globalAdmin') {
    mockData = '0x0000000000000000000000000000000000000000'
  }
  
  return {
    data: mockData,
    isLoading: false,
    error: null
  }
}

export function useWriteContract() {
  return {
    writeContract: async (args: any) => {
      console.log("Mock writeContract called with:", args)
    },
    data: undefined,
    isPending: false,
    error: null
  }
}

export function useWaitForTransactionReceipt(config: any) {
  return {
    isLoading: false,
    isSuccess: false,
    data: undefined,
    error: null
  }
}

export function useAccount() {
  return {
    address: undefined,
    isConnected: false,
    isConnecting: false,
    isDisconnected: true
  }
}

export function useDisconnect() {
  return {
    disconnect: async () => {
      console.log("Mock disconnect called")
    }
  }
}
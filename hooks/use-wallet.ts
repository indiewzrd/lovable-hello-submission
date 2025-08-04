"use client"

// Mock wallet hook for development when Privy isn't configured
export function useWallet() {
  return {
    ready: true,
    authenticated: false,
    login: () => Promise.resolve(),
    logout: () => Promise.resolve(),
    user: null,
    address: undefined as string | undefined,
    isConnected: false,
    walletAddress: undefined as string | undefined
  }
}
"use client"

// Mock wallet hook for development when external services aren't configured
export function useWallet() {
  return {
    ready: true,
    authenticated: false,
    login: async () => {},
    logout: async () => {},
    user: null,
    address: undefined as string | undefined,
    isConnected: false,
    walletAddress: undefined as string | undefined
  }
}
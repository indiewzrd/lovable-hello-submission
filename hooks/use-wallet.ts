"use client"

import { usePrivy } from "@privy-io/react-auth"
import { useAccount, useDisconnect } from "wagmi"

export function useWallet() {
  try {
    const { ready, authenticated, login, logout: privyLogout, user } = usePrivy()
    const { address, isConnected } = useAccount()
    const { disconnect } = useDisconnect()

    const logout = async () => {
      disconnect()
      await privyLogout()
    }

    return {
      ready,
      authenticated,
      login,
      logout,
      user,
      address,
      isConnected,
      walletAddress: address || user?.wallet?.address
    }
  } catch (error) {
    // Return default values if Privy is not available
    console.warn("Wallet provider not available:", error)
    return {
      ready: false,
      authenticated: false,
      login: () => Promise.resolve(),
      logout: () => Promise.resolve(),
      user: null,
      address: undefined,
      isConnected: false,
      walletAddress: undefined
    }
  }
}
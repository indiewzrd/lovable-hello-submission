"use client"

import { usePrivy } from "@privy-io/react-auth"
import { useAccount, useDisconnect } from "wagmi"

export function useWallet() {
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
}
"use client"

import { WagmiProvider, createConfig } from "wagmi"
import { baseSepolia } from "wagmi/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http } from "viem"
import { PrivyWrapper } from "./privy-wrapper"

const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http()
  }
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <PrivyWrapper>
          {children}
        </PrivyWrapper>
      </WagmiProvider>
    </QueryClientProvider>
  )
}
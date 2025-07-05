"use client"

import { PrivyProvider } from "@privy-io/react-auth"
import { WagmiProvider, createConfig } from "wagmi"
import { baseSepolia } from "wagmi/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http } from "viem"

const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http()
  }
})

const queryClient = new QueryClient()

// During build time, we might not have the Privy app ID
const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

export function Providers({ children }: { children: React.ReactNode }) {
  // If no Privy app ID is available (during build), just render children without providers
  if (!privyAppId || privyAppId === "") {
    return <>{children}</>
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#676FFF",
          logo: "/logo.png"
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets"
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}
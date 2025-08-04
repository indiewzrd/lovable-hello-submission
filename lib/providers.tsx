"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PrivyWrapper } from "./privy-wrapper"

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PrivyWrapper>
        {children}
      </PrivyWrapper>
    </QueryClientProvider>
  )
}
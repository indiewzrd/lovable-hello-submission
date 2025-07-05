"use client"

import { PrivyProvider } from "@privy-io/react-auth"
import { useEffect, useState } from "react"

export function PrivyWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Don't render Privy on the server or during build
  if (!mounted) {
    return <>{children}</>
  }
  
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  
  // If no app ID, just render children
  if (!privyAppId || privyAppId === "") {
    console.warn("Privy app ID not found")
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
      {children}
    </PrivyProvider>
  )
}
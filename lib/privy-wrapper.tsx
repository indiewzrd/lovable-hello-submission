"use client"

import { PrivyProvider } from "@privy-io/react-auth"
import { useEffect, useState } from "react"

export function PrivyWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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
    console.warn("Privy app ID not found in environment variables")
    return <>{children}</>
  }
  
  try {
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
        onError={(error) => {
          console.error("Privy error:", error)
          setError(error.message)
        }}
      >
        {error ? (
          <div className="p-4 text-red-500">
            Wallet connection error: {error}
          </div>
        ) : (
          children
        )}
      </PrivyProvider>
    )
  } catch (err) {
    console.error("Failed to initialize Privy:", err)
    return <>{children}</>
  }
}
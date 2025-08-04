"use client"

import { useState } from "react"

// Mock provider for development when Privy isn't configured
export function PrivyWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
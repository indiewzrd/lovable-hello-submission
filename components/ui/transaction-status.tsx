"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { useWaitForTransactionReceipt } from "wagmi"
import type { Hash } from "viem"

interface TransactionStatusProps {
  hash?: Hash
  onSuccess?: () => void
  onError?: (error: Error) => void
  successMessage?: string
  errorMessage?: string
}

export function useTransactionStatus({
  hash,
  onSuccess,
  onError,
  successMessage = "Transaction confirmed!",
  errorMessage = "Transaction failed"
}: TransactionStatusProps) {
  const { 
    isLoading: isPending,
    isSuccess,
    isError,
    error
  } = useWaitForTransactionReceipt({
    hash
  })

  useEffect(() => {
    if (isSuccess) {
      toast.success(successMessage, {
        icon: <CheckCircle className="h-4 w-4" />
      })
      onSuccess?.()
    }
  }, [isSuccess, successMessage, onSuccess])

  useEffect(() => {
    if (isError) {
      toast.error(errorMessage, {
        icon: <AlertCircle className="h-4 w-4" />,
        description: error?.message
      })
      onError?.(error as Error)
    }
  }, [isError, error, errorMessage, onError])

  useEffect(() => {
    if (isPending && hash) {
      toast.loading("Transaction pending...", {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        id: hash
      })
    } else if (!isPending && hash) {
      toast.dismiss(hash)
    }
  }, [isPending, hash])

  return {
    isPending,
    isSuccess,
    isError,
    error
  }
}

export function TransactionToast({ hash }: { hash?: Hash }) {
  useTransactionStatus({ hash })
  return null
}
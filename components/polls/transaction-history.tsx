"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, ArrowUpRight, ArrowDownLeft, CheckCircle, XCircle, Clock } from "lucide-react"
import { formatDistanceToNow } from "@/lib/utils"
import { baseSepolia } from "viem/chains"

interface Transaction {
  hash: string
  type: 'vote' | 'claim' | 'deploy' | 'approve'
  status: 'pending' | 'success' | 'failed'
  timestamp: number
  amount?: string
  description: string
}

interface TransactionHistoryProps {
  address?: string
  pollAddress?: string
}

export function TransactionHistory({ address, pollAddress }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  // In a real app, this would fetch from an indexer or the database
  useEffect(() => {
    if (address) {
      // Mock data for demonstration
      const mockTransactions: Transaction[] = [
        {
          hash: '0x123...',
          type: 'vote',
          status: 'success',
          timestamp: Date.now() - 3600000,
          amount: '5.0 USDC',
          description: 'Voted for option 2'
        },
        {
          hash: '0x456...',
          type: 'approve',
          status: 'success',
          timestamp: Date.now() - 3700000,
          amount: '5.0 USDC',
          description: 'Approved USDC spending'
        }
      ]
      setTransactions(mockTransactions)
    }
  }, [address])

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'vote':
        return <ArrowUpRight className="h-4 w-4" />
      case 'claim':
        return <ArrowDownLeft className="h-4 w-4" />
      case 'deploy':
        return <CheckCircle className="h-4 w-4" />
      case 'approve':
        return <CheckCircle className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
    }
  }

  const getStatusVariant = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return 'default' as const
      case 'failed':
        return 'destructive' as const
      case 'pending':
        return 'secondary' as const
    }
  }

  if (!address) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          Your recent interactions with this poll
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No transactions yet
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.hash}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tx.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDistanceToNow(new Date(tx.timestamp))}</span>
                      {tx.amount && (
                        <>
                          <span>•</span>
                          <span>{tx.amount}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(tx.status)} className="gap-1">
                    {getStatusIcon(tx.status)}
                    {tx.status}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      window.open(
                        `https://sepolia.basescan.org/tx/${tx.hash}`,
                        '_blank'
                      )
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
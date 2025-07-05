"use client"

import { useWallet } from "@/hooks/use-wallet"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp, Users, DollarSign } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { authenticated, walletAddress } = useWallet()

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h1 className="text-2xl font-bold mb-4">Connect your wallet to continue</h1>
        <p className="text-muted-foreground">You need to connect your wallet to access the dashboard</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Manage your polls and track voting activity.
          </p>
        </div>
        <Link href="/dashboard/polls/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Poll
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Polls</p>
              <p className="text-3xl font-bold">0</p>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Votes</p>
              <p className="text-3xl font-bold">0</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Funded</p>
              <p className="text-3xl font-bold">$0</p>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Polls</h2>
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <p>No polls yet</p>
            <p className="text-sm mt-2">Create your first poll to get started</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
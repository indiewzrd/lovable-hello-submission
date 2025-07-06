"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useWallet } from "@/hooks/use-wallet"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "@/lib/utils"
import { User, History, DollarSign, TrendingUp, Award, Clock, CheckCircle, XCircle } from "lucide-react"

type VoteRecord = {
  pollId: string
  pollQuestion: string
  projectName: string
  option: string
  amount: string
  timestamp: number
  status: 'active' | 'cancelled' | 'completed'
}

export default function AccountPage() {
  const { address, isConnected } = useWallet()
  const router = useRouter()
  const [voteHistory, setVoteHistory] = useState<VoteRecord[]>([])
  const [activeTab, setActiveTab] = useState("overview")

  // Mock data for now - in production, this would come from the blockchain
  const accountStats = {
    totalVotes: 0,
    totalStaked: "0",
    activePolls: 0,
    winRate: 0,
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h1 className="text-2xl font-bold mb-4">Connect your wallet to continue</h1>
        <p className="text-muted-foreground">You need to connect your wallet to view your account</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Account</h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile and view your voting history
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accountStats.totalVotes}</div>
            <p className="text-xs text-muted-foreground">Across all polls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${accountStats.totalStaked}</div>
            <p className="text-xs text-muted-foreground">USDC staked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accountStats.activePolls}</div>
            <p className="text-xs text-muted-foreground">Currently voting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accountStats.winRate}%</div>
            <p className="text-xs text-muted-foreground">Success rate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Vote History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Information</CardTitle>
              <CardDescription>Your connected wallet details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Address:</span>
                <code className="text-sm">{address}</code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vote History</CardTitle>
              <CardDescription>Your past voting activity</CardDescription>
            </CardHeader>
            <CardContent>
              {voteHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No voting history yet
                </p>
              ) : (
                <div className="space-y-4">
                  {voteHistory.map((vote, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{vote.pollQuestion}</p>
                        <p className="text-sm text-muted-foreground">
                          {vote.projectName} • Voted for: {vote.option}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(vote.timestamp * 1000))}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">${vote.amount}</span>
                        <Badge variant={vote.status === 'active' ? 'default' : vote.status === 'completed' ? 'secondary' : 'destructive'}>
                          {vote.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
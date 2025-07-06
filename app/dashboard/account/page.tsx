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
import { useReadContract } from "wagmi"
import { contractABIs } from "@/lib/contracts/config"
import { formatUnits } from "viem"

type VoteRecord = {
  pollId: string
  pollQuestion: string
  projectName: string
  votedAt: Date
  option: number
  optionText: string
  amount: string
  status: 'active' | 'won' | 'lost' | 'refunded'
  pollAddress: string
}

type ClaimRecord = {
  pollId: string
  pollQuestion: string
  claimedAt: Date
  amount: string
  type: 'creator' | 'refund'
  txHash: string
}

function VoteHistoryCard({ vote }: { vote: VoteRecord }) {
  const router = useRouter()
  
  // Get poll status from contract
  const { data: endTime } = useReadContract({
    address: vote.pollAddress as `0x${string}`,
    abi: contractABIs.poll,
    functionName: "endTime"
  })
  
  const { data: winnersCalculated } = useReadContract({
    address: vote.pollAddress as `0x${string}`,
    abi: contractABIs.poll,
    functionName: "winnersCalculated",
    enabled: endTime ? Date.now() > Number(endTime) * 1000 : false
  })
  
  const { data: winningOptions } = useReadContract({
    address: vote.pollAddress as `0x${string}`,
    abi: contractABIs.poll,
    functionName: "getWinningOptions",
    enabled: !!winnersCalculated
  })
  
  // Determine vote status
  const now = Date.now()
  const isEnded = endTime ? now > Number(endTime) * 1000 : false
  const isWinner = winningOptions && (winningOptions as bigint[]).some(
    (option: bigint) => Number(option) === vote.option
  )
  
  const getStatusBadge = () => {
    if (!isEnded) {
      return <Badge variant="default">Active</Badge>
    }
    if (!winnersCalculated) {
      return <Badge variant="secondary">Pending Results</Badge>
    }
    if (isWinner) {
      return <Badge variant="default" className="bg-green-500">Won</Badge>
    }
    if (vote.status === 'refunded') {
      return <Badge variant="outline">Refunded</Badge>
    }
    return <Badge variant="destructive">Lost</Badge>
  }

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => router.push(`/polls/${vote.pollId}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base line-clamp-1">{vote.pollQuestion}</CardTitle>
            <CardDescription className="text-xs">
              {vote.projectName} • {formatDistanceToNow(vote.votedAt)}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Voted for:</span>
            <span className="font-medium">{vote.optionText}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-medium">{vote.amount} USDC</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AccountPage() {
  const { address, authenticated } = useWallet()
  const router = useRouter()
  const [voteHistory, setVoteHistory] = useState<VoteRecord[]>([])
  const [claimHistory, setClaimHistory] = useState<ClaimRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (address) {
      fetchUserData()
    }
  }, [address])

  const fetchUserData = async () => {
    try {
      // In a real app, this would fetch from an API endpoint
      // For now, using mock data
      const mockVotes: VoteRecord[] = [
        {
          pollId: "1",
          pollQuestion: "Which feature should we build next?",
          projectName: "Stakedriven",
          votedAt: new Date(Date.now() - 86400000),
          option: 2,
          optionText: "Mobile App",
          amount: "5.0",
          status: 'active',
          pollAddress: "0x1304eCA44ab5fe10B4D7510C0F4e0C056A643D43"
        },
        {
          pollId: "2",
          pollQuestion: "What integration do you want most?",
          projectName: "DeFi Protocol",
          votedAt: new Date(Date.now() - 172800000),
          option: 1,
          optionText: "Uniswap V3",
          amount: "10.0",
          status: 'won',
          pollAddress: "0x08e599E11F5f9108267C73a66Ca0817aAB65f7A3"
        }
      ]
      
      setVoteHistory(mockVotes)
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Connect your wallet to view your account
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate stats
  const stats = {
    totalVotes: voteHistory.length,
    totalSpent: voteHistory.reduce((sum, vote) => sum + parseFloat(vote.amount), 0),
    wonVotes: voteHistory.filter(v => v.status === 'won').length,
    refundsClaimed: claimHistory.filter(c => c.type === 'refund').length,
  }

  if (loading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Account</h1>
        <p className="text-muted-foreground">
          Track your voting history and manage claims
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Total Votes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalVotes}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Spent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Won Votes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.wonVotes}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Win Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.totalVotes > 0 
                ? Math.round((stats.wonVotes / stats.totalVotes) * 100) 
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="votes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="votes">Voting History</TabsTrigger>
          <TabsTrigger value="claims">Claims & Refunds</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="votes" className="space-y-4">
          {voteHistory.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No votes yet. Start participating in polls!
                </p>
                <Button asChild>
                  <Link href="/explore">Explore Polls</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {voteHistory.map((vote, index) => (
                <VoteHistoryCard key={index} vote={vote} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="claims" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Claims</CardTitle>
              <CardDescription>
                Polls where you can claim refunds or rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                No pending claims at the moment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Claim History</CardTitle>
              <CardDescription>
                Your past claims and refunds
              </CardDescription>
            </CardHeader>
            <CardContent>
              {claimHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No claims yet
                </p>
              ) : (
                <div className="space-y-3">
                  {claimHistory.map((claim, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{claim.pollQuestion}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(claim.claimedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">+${claim.amount}</p>
                        <Badge variant={claim.type === 'creator' ? 'default' : 'secondary'} className="text-xs">
                          {claim.type === 'creator' ? 'Reward' : 'Refund'}
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
              <CardTitle>Wallet Information</CardTitle>
              <CardDescription>
                Your connected wallet details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background rounded-full">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Wallet Address</p>
                    <p className="font-mono text-sm">{address}</p>
                  </div>
                </div>
                <Badge variant="outline">Connected</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Manage your account preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Preference settings coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
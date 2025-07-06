"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Clock, Users, DollarSign } from "lucide-react"
import { formatDistanceToNow } from "@/lib/utils"
import { useReadContract } from "wagmi"
import { formatUnits } from "viem"
import { contractABIs } from "@/lib/contracts"

type Poll = {
  id: string
  projectId: string
  contractAddress: string
  question: string
  options: Array<{
    id: number
    text: string
    description?: string
  }>
  startTime: Date
  endTime: Date
  tokensPerVote: number
  winningOptionsCount: number
  totalOptionsCount: number
  tokenAddress: string
  createdAt: Date
  project?: {
    name: string
    description: string | null
  }
}

type PollStatus = "upcoming" | "active" | "ended"

function PollCard({ poll }: { poll: Poll }) {
  const router = useRouter()
  const now = new Date()
  const status: PollStatus = 
    now < poll.startTime ? "upcoming" :
    now > poll.endTime ? "ended" : "active"

  // Get voting results from contract
  const { data: votingResults } = useReadContract({
    address: poll.contractAddress as `0x${string}`,
    abi: contractABIs.poll,
    functionName: "getVotingResults",
  })

  // Calculate total votes from voting results
  const totalVotes = votingResults 
    ? Number(votingResults[1].reduce((sum: bigint, votes: bigint) => sum + votes, 0n))
    : 0
  const totalFunding = totalVotes * parseFloat(poll.tokensPerVote)

  const statusConfig = {
    upcoming: {
      variant: "secondary" as const,
      text: "Upcoming",
      icon: Clock,
    },
    active: {
      variant: "default" as const,
      text: "Active",
      icon: Users,
    },
    ended: {
      variant: "outline" as const,
      text: "Ended",
      icon: Clock,
    },
  }

  const config = statusConfig[status]

  // Calculate time remaining for active polls
  const getTimeRemaining = () => {
    if (status === "upcoming") {
      return `Starts ${formatDistanceToNow(poll.startTime)}`
    } else if (status === "active") {
      return `Ends ${formatDistanceToNow(poll.endTime)}`
    } else {
      return `Ended ${formatDistanceToNow(poll.endTime)}`
    }
  }

  // Calculate progress percentage for active polls
  const getProgress = () => {
    if (status !== "active") return 0
    const total = poll.endTime.getTime() - poll.startTime.getTime()
    const elapsed = now.getTime() - poll.startTime.getTime()
    return Math.min(100, Math.max(0, (elapsed / total) * 100))
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/polls/${poll.id}`)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="line-clamp-2">{poll.question}</CardTitle>
            {poll.project && (
              <CardDescription>by {poll.project.name}</CardDescription>
            )}
          </div>
          <Badge variant={config.variant} className="ml-2">
            <config.icon className="w-3 h-3 mr-1" />
            {config.text}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Votes</p>
            <p className="font-semibold">{totalVotes}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Funding</p>
            <p className="font-semibold">${totalFunding.toLocaleString()} USDC</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">{getTimeRemaining()}</p>
          {status === "active" && (
            <Progress value={getProgress()} className="h-2" />
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Options ({poll.totalOptionsCount})</p>
          <div className="flex flex-wrap gap-2">
            {poll.options.slice(0, 3).map((option) => (
              <Badge key={option.id} variant="outline" className="text-xs">
                {option.text}
              </Badge>
            ))}
            {poll.options.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{poll.options.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button variant="ghost" className="w-full group">
          View Poll
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function ExplorePage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<PollStatus | "all">("all")

  useEffect(() => {
    fetchPolls()
  }, [])

  const fetchPolls = async () => {
    try {
      const response = await fetch("/api/polls")
      if (!response.ok) throw new Error("Failed to fetch polls")
      const data = await response.json()
      setPolls(data)
    } catch (error) {
      console.error("Error fetching polls:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterPolls = (status: PollStatus | "all") => {
    const now = new Date()
    
    if (status === "all") return polls
    
    return polls.filter(poll => {
      const pollStartTime = new Date(poll.startTime)
      const pollEndTime = new Date(poll.endTime)
      
      if (status === "upcoming") return now < pollStartTime
      if (status === "active") return now >= pollStartTime && now <= pollEndTime
      if (status === "ended") return now > pollEndTime
      
      return false
    })
  }

  const filteredPolls = filterPolls(activeTab)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-20 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore Polls</h1>
        <p className="text-muted-foreground">
          Discover and participate in community-driven decisions
        </p>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Polls ({polls.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({filterPolls("active").length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({filterPolls("upcoming").length})</TabsTrigger>
          <TabsTrigger value="ended">Ended ({filterPolls("ended").length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {filteredPolls.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  No {activeTab === "all" ? "" : activeTab} polls found
                </p>
                <Button asChild>
                  <Link href="/dashboard/polls/create">Create a Poll</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPolls.map((poll) => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
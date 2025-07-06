"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Plus, ArrowRight, Clock, Users, DollarSign, TrendingUp } from "lucide-react"
import { formatDistanceToNow } from "@/lib/utils"

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
  tokensPerVote: string
  winningOptionsCount: number
  totalOptionsCount: number
  tokenAddress: string
  createdAt: Date
}

type Project = {
  id: string
  name: string
  description: string | null
}

type PollStatus = "upcoming" | "active" | "ended"

function PollCard({ poll }: { poll: Poll }) {
  const router = useRouter()
  const now = new Date()
  const status: PollStatus = 
    now < poll.startTime ? "upcoming" :
    now > poll.endTime ? "ended" : "active"

  // Mock voting data - in a real app, this would come from the API
  const totalVotes = Math.floor(Math.random() * 500) + 50
  const totalFunding = (totalVotes * parseFloat(poll.tokensPerVote)).toFixed(2)

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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="line-clamp-1">{poll.question}</CardTitle>
            <CardDescription>{getTimeRemaining()}</CardDescription>
          </div>
          <Badge variant={config.variant}>
            <config.icon className="w-3 h-3 mr-1" />
            {config.text}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {status === "active" && (
          <Progress value={getProgress()} className="h-2" />
        )}
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Votes</p>
            <p className="font-semibold">{totalVotes}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Funding</p>
            <p className="font-semibold">${totalFunding}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Per Vote</p>
            <p className="font-semibold">{poll.tokensPerVote} USDC</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => router.push(`/polls/${poll.id}`)}
        >
          View Poll
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        {status === "ended" && (
          <Button 
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/polls/${poll.id}#results`)}
          >
            <TrendingUp className="w-4 h-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default function ProjectPollsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<PollStatus | "all">("all")

  useEffect(() => {
    fetchProjectAndPolls()
  }, [projectId])

  const fetchProjectAndPolls = async () => {
    try {
      // Fetch project details
      const projectResponse = await fetch(`/api/projects/${projectId}`)
      if (!projectResponse.ok) throw new Error("Failed to fetch project")
      const projectData = await projectResponse.json()
      setProject(projectData)

      // Fetch polls for this project
      const pollsResponse = await fetch(`/api/polls?projectId=${projectId}`)
      if (!pollsResponse.ok) throw new Error("Failed to fetch polls")
      const pollsData = await pollsResponse.json()
      setPolls(pollsData)
    } catch (error) {
      console.error("Error fetching data:", error)
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

  // Calculate stats
  const stats = {
    total: polls.length,
    active: filterPolls("active").length,
    upcoming: filterPolls("upcoming").length,
    ended: filterPolls("ended").length,
  }

  if (loading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container max-w-6xl py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Project not found</p>
            <Button asChild>
              <Link href="/dashboard/projects">Back to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
          </div>
          <Button asChild>
            <Link href={`/dashboard/polls/create?project=${projectId}`}>
              <Plus className="mr-2 h-4 w-4" />
              Create Poll
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Polls</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Upcoming</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Ended</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-600">{stats.ended}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Polls</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="ended">Ended</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {filteredPolls.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No {activeTab === "all" ? "" : activeTab} polls found
                </p>
                <Button asChild>
                  <Link href={`/dashboard/polls/create?project=${projectId}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Poll
                  </Link>
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
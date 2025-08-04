"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Plus, 
  BarChart3, 
  Users, 
  DollarSign, 
  Clock,
  ExternalLink,
  Trophy,
  AlertCircle
} from "lucide-react"
import { formatDistanceToNow } from "@/lib/utils"
import { useWallet } from "@/hooks/use-wallet"
import { toast } from "sonner"

type Project = {
  id: string
  name: string
  description: string | null
  createdAt: Date
  walletAddress: string
}

type Poll = {
  id: string
  projectId: string
  contractAddress: string
  question: string
  startTime: Date
  endTime: Date
  tokensPerVote: number
  winningOptionsCount: number
  totalOptionsCount: number
  createdAt: Date
}

type PollStatus = "upcoming" | "active" | "ended"

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string
  const { address } = useWallet()
  
  const [project, setProject] = useState<Project | null>(null)
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<PollStatus | "all">("all")

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails()
    }
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProjectDetails = async () => {
    try {
      // Fetch project
      const projectResponse = await fetch(`/api/projects/${projectId}`)
      if (!projectResponse.ok) throw new Error("Failed to fetch project")
      const projectData = await projectResponse.json()
      setProject(projectData)

      // Verify ownership
      if (address && projectData.walletAddress.toLowerCase() !== address.toLowerCase()) {
        toast.error("You don't have access to this project")
        router.push("/dashboard/projects")
        return
      }

      // Fetch polls
      const pollsResponse = await fetch(`/api/projects/${projectId}/polls`)
      if (!pollsResponse.ok) throw new Error("Failed to fetch polls")
      const pollsData = await pollsResponse.json()
      setPolls(pollsData)
    } catch (error) {
      console.error("Error fetching project details:", error)
      toast.error("Failed to load project details")
    } finally {
      setLoading(false)
    }
  }

  const getPollStatus = (poll: Poll): PollStatus => {
    const now = new Date()
    const startTime = new Date(poll.startTime)
    const endTime = new Date(poll.endTime)
    
    if (now < startTime) return "upcoming"
    if (now > endTime) return "ended"
    return "active"
  }

  const filterPolls = (status: PollStatus | "all") => {
    if (status === "all") return polls
    return polls.filter(poll => getPollStatus(poll) === status)
  }

  const filteredPolls = filterPolls(activeTab)

  // Calculate stats
  const stats = {
    totalPolls: polls.length,
    activePolls: polls.filter(p => getPollStatus(p) === "active").length,
    totalVotes: 0, // TODO: Aggregate from blockchain
    totalFunding: 0 // TODO: Aggregate from blockchain
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="grid grid-cols-4 gap-4 mt-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-12 bg-muted rounded" />
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
      <div className="container mx-auto py-8 text-center">
        <p>Project not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/projects")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Created {formatDistanceToNow(project.createdAt)}
            </p>
          </div>
          
          <Button asChild>
            <Link href={`/dashboard/polls/create?project=${project.id}`}>
              <Plus className="mr-2 h-4 w-4" />
              New Poll
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Polls</p>
                <p className="text-2xl font-bold">{stats.totalPolls}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Polls</p>
                <p className="text-2xl font-bold">{stats.activePolls}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Votes</p>
                <p className="text-2xl font-bold">{stats.totalVotes}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Funding</p>
                <p className="text-2xl font-bold">${stats.totalFunding}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Polls */}
      <Card>
        <CardHeader>
          <CardTitle>Polls</CardTitle>
          <CardDescription>
            Manage and track all polls for this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value="all">All ({polls.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({filterPolls("active").length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({filterPolls("upcoming").length})</TabsTrigger>
              <TabsTrigger value="ended">Ended ({filterPolls("ended").length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredPolls.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No {activeTab === "all" ? "" : activeTab} polls found
                  </p>
                  <Button asChild size="sm">
                    <Link href={`/dashboard/polls/create?project=${project.id}`}>
                      Create Poll
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPolls.map((poll) => {
                    const status = getPollStatus(poll)
                    const statusConfig = {
                      upcoming: { variant: "secondary" as const, icon: Clock },
                      active: { variant: "default" as const, icon: Users },
                      ended: { variant: "outline" as const, icon: Trophy }
                    }
                    const config = statusConfig[status]

                    return (
                      <Card key={poll.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{poll.question}</h3>
                                <Badge variant={config.variant} className="ml-2">
                                  <config.icon className="w-3 h-3 mr-1" />
                                  {status}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{poll.totalOptionsCount} options</span>
                                <span>•</span>
                                <span>${poll.tokensPerVote} USDC per vote</span>
                                <span>•</span>
                                <span>
                                  {status === "upcoming" 
                                    ? `Starts ${formatDistanceToNow(poll.startTime)}`
                                    : status === "active"
                                    ? `Ends ${formatDistanceToNow(poll.endTime)}`
                                    : `Ended ${formatDistanceToNow(poll.endTime)}`
                                  }
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/polls/${poll.id}`}>
                                  View
                                  <ExternalLink className="ml-2 h-3 w-3" />
                                </Link>
                              </Button>
                              {status === "ended" && (
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/dashboard/polls/${poll.id}/claims`}>
                                    Claims
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
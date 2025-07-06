"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/hooks/use-wallet"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp, Users, DollarSign, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "@/lib/utils"

interface Poll {
  id: string
  question: string
  contractAddress: string
  startTime: string
  endTime: string
  tokensPerVote: string
  options: { optionNumber: number; text: string; description?: string }[]
  project?: {
    name: string
    description?: string
  }
}

export function DashboardContent() {
  const { authenticated, address } = useWallet()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activePolls: 0,
    totalVotes: 0,
    totalFunded: 0,
  })

  useEffect(() => {
    if (authenticated) {
      fetchPolls()
    }
  }, [authenticated])

  const fetchPolls = async () => {
    try {
      const response = await fetch('/api/polls')
      if (!response.ok) throw new Error('Failed to fetch polls')
      const data = await response.json()
      setPolls(data)
      
      // Calculate stats
      const now = new Date()
      const active = data.filter((poll: Poll) => {
        const start = new Date(poll.startTime)
        const end = new Date(poll.endTime)
        return start <= now && end >= now
      })
      
      setStats({
        activePolls: active.length,
        totalVotes: 0, // This would need blockchain data
        totalFunded: 0, // This would need blockchain data
      })
    } catch (error) {
      console.error('Error fetching polls:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPollStatus = (poll: Poll) => {
    const now = new Date()
    const start = new Date(poll.startTime)
    const end = new Date(poll.endTime)
    
    if (now < start) return { label: 'Upcoming', color: 'text-blue-500' }
    if (now > end) return { label: 'Ended', color: 'text-gray-500' }
    return { label: 'Active', color: 'text-green-500' }
  }

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
              <p className="text-3xl font-bold">{stats.activePolls}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Polls</p>
              <p className="text-3xl font-bold">{polls.length}</p>
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
        {loading ? (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <p>Loading polls...</p>
            </div>
          </Card>
        ) : polls.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <p>No polls yet</p>
              <p className="text-sm mt-2">Create your first poll to get started</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {polls.map((poll) => {
              const status = getPollStatus(poll)
              return (
                <Card key={poll.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{poll.question}</h3>
                        <span className={`text-sm font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      {poll.project && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Project: {poll.project.name}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Ends {formatDistanceToNow(new Date(poll.endTime), { addSuffix: true })}
                        </span>
                        <span>{poll.options.length} options</span>
                        <span>{poll.tokensPerVote} USDC per vote</span>
                      </div>
                    </div>
                    <Link href={`/polls/${poll.id}`}>
                      <Button variant="outline" size="sm">
                        View Poll
                      </Button>
                    </Link>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
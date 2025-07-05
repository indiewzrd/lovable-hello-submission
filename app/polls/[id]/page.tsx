"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useWallet } from "@/hooks/use-wallet"
import { usePoll, useUSDCApproval } from "@/lib/contracts/hooks"
import { contractAddresses, contractABIs } from "@/lib/contracts/config"
import { useReadContract } from "wagmi"
import { formatUnits } from "viem"
import { Clock, Users, DollarSign, CheckCircle } from "lucide-react"
import type { Address } from "viem"
import { baseSepolia } from "viem/chains"

interface VotingResult {
  option: number
  votes: bigint
}

export default function PollPage() {
  const params = useParams()
  const pollAddress = params.id as Address
  const { authenticated, address } = useWallet()
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  // Use custom hooks
  const { 
    pollCreator,
    startTime,
    endTime,
    tokensPerVote,
    votingResults,
    vote,
    isVoting,
    isVoteSuccess
  } = usePoll(pollAddress)

  // Read additional poll data
  const { data: totalOptionsCount } = useReadContract({
    address: pollAddress,
    abi: contractABIs.poll,
    functionName: "totalOptionsCount"
  })

  const { data: winningOptionsCount } = useReadContract({
    address: pollAddress,
    abi: contractABIs.poll,
    functionName: "winningOptionsCount"
  })

  const { data: hasVoted } = useReadContract({
    address: pollAddress,
    abi: contractABIs.poll,
    functionName: "hasVoted",
    args: address ? [address] : undefined
  })

  const { data: voterChoice } = useReadContract({
    address: pollAddress,
    abi: contractABIs.poll,
    functionName: "voterChoice",
    args: address ? [address] : undefined
  })

  const { data: usdcAllowance } = useReadContract({
    address: contractAddresses[baseSepolia.id].usdc,
    abi: contractABIs.usdc,
    functionName: "allowance",
    args: address ? [address, pollAddress] : undefined
  })

  // USDC approval hook
  const { approve, isApproving, isApproveSuccess } = useUSDCApproval(
    pollAddress,
    tokensPerVote
  )

  // Calculate poll status
  const now = Math.floor(Date.now() / 1000)
  const start = startTime || 0
  const end = endTime || 0
  const isUpcoming = now < start
  const isActive = now >= start && now < end
  const isEnded = now >= end

  // Calculate total votes
  const totalVotes = votingResults?.[1]?.reduce((sum: bigint, votes: bigint) => sum + votes, BigInt(0)) || BigInt(0)

  // Mock poll metadata (in real app, fetch from database)
  const pollMetadata = {
    question: "Which feature should we build next?",
    description: "Vote with USDC to decide our next development priority",
    options: [
      { id: 1, text: "Advanced Analytics Dashboard", description: "Real-time insights and reporting" },
      { id: 2, text: "Mobile App", description: "iOS and Android native apps" },
      { id: 3, text: "API Integration Hub", description: "Connect with popular services" },
      { id: 4, text: "AI Assistant", description: "Smart automation features" }
    ]
  }

  const handleVote = async () => {
    if (!selectedOption) {
      toast.error("Please select an option")
      return
    }

    try {
      await vote(selectedOption)
    } catch (error) {
      console.error(error)
    }
  }

  // Handle transaction success
  useEffect(() => {
    if (isApproveSuccess) {
      toast.success("USDC approved successfully")
    }
  }, [isApproveSuccess])

  useEffect(() => {
    if (isVoteSuccess) {
      toast.success("Vote submitted successfully!")
    }
  }, [isVoteSuccess])

  const needsApproval = tokensPerVote && usdcAllowance !== undefined && 
    BigInt(usdcAllowance) < BigInt(parseFloat(tokensPerVote) * 1e6)

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        {/* Poll Header */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            {isUpcoming && <Badge variant="secondary">Upcoming</Badge>}
            {isActive && <Badge variant="default">Active</Badge>}
            {isEnded && <Badge variant="outline">Ended</Badge>}
          </div>
          
          <h1 className="text-3xl font-bold mb-2">{pollMetadata.question}</h1>
          <p className="text-muted-foreground">{pollMetadata.description}</p>
        </div>

        {/* Poll Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Votes</p>
                <p className="text-xl font-semibold">{Number(totalVotes)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Funded</p>
                <p className="text-xl font-semibold">
                  ${totalVotes && tokensPerVote ? formatUnits(totalVotes, 6) : "0"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {isActive ? "Ends in" : isUpcoming ? "Starts in" : "Ended"}
                </p>
                <p className="text-xl font-semibold">
                  {isActive || isUpcoming ? 
                    new Date((isActive ? end : start) * 1000).toLocaleDateString() : 
                    new Date(end * 1000).toLocaleDateString()
                  }
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Voting Options */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Options</h2>
          
          <div className="space-y-4">
            {pollMetadata.options.map((option, index) => {
              const votes = votingResults?.[1]?.[index] || BigInt(0)
              const percentage = totalVotes > BigInt(0) ? Number((votes * BigInt(100)) / totalVotes) : 0
              const isSelected = selectedOption === option.id
              const isVotedOption = Number(voterChoice) === option.id

              return (
                <div
                  key={option.id}
                  className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : "hover:border-gray-300"
                  } ${!isActive || hasVoted ? "cursor-default" : ""}`}
                  onClick={() => isActive && !hasVoted && setSelectedOption(option.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium flex items-center gap-2">
                        {option.text}
                        {isVotedOption && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Your Vote
                          </Badge>
                        )}
                      </h3>
                      {option.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {option.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold">{percentage}%</p>
                      <p className="text-sm text-muted-foreground">
                        {Number(votes)} votes
                      </p>
                    </div>
                  </div>
                  
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </div>

          {/* Voting Actions */}
          {authenticated && isActive && !hasVoted && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Cost per vote:</span>
                <span className="font-semibold">
                  {tokensPerVote || "0"} USDC
                </span>
              </div>
              
              {needsApproval ? (
                <Button 
                  onClick={approve} 
                  disabled={isApproving}
                  className="w-full"
                >
                  {isApproving ? "Approving..." : "Approve USDC"}
                </Button>
              ) : (
                <Button 
                  onClick={handleVote} 
                  disabled={!selectedOption || isVoting}
                  className="w-full"
                >
                  {isVoting ? "Voting..." : "Submit Vote"}
                </Button>
              )}
            </div>
          )}

          {!authenticated && isActive && (
            <div className="mt-6 text-center">
              <p className="text-muted-foreground mb-3">Connect your wallet to vote</p>
            </div>
          )}

          {hasVoted && (
            <div className="mt-6 text-center">
              <Badge variant="secondary" className="text-base py-2 px-4">
                <CheckCircle className="mr-2 h-4 w-4" />
                You have voted in this poll
              </Badge>
            </div>
          )}
        </Card>

        {/* Claim Section - Only visible after poll ends */}
        {isEnded && authenticated && (
          <ClaimSection 
            pollAddress={pollAddress}
            pollCreator={pollCreator}
            hasVoted={hasVoted}
          />
        )}
      </div>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Trophy, DollarSign, AlertCircle, CheckCircle } from "lucide-react"
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { formatUnits } from "viem"
import { pollContract } from "@/lib/contracts"
import { toast } from "sonner"

interface ClaimSectionProps {
  pollAddress: `0x${string}`
  pollCreator?: string
  voterChoice?: bigint
  votingResults?: readonly [readonly bigint[], readonly bigint[]]
  winningOptionsCount: number
  tokensPerVote?: bigint
  address?: `0x${string}`
}

export function ClaimSection({
  pollAddress,
  pollCreator,
  voterChoice,
  votingResults,
  winningOptionsCount,
  tokensPerVote,
  address
}: ClaimSectionProps) {
  const [winningOptions, setWinningOptions] = useState<number[]>([])
  const [isWinner, setIsWinner] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  
  // Check if user has already claimed
  const { data: hasClaimedWinning } = useReadContract({
    ...pollContract(pollAddress),
    functionName: "hasClaimedWinningFunds",
    args: address ? [address] : undefined
  })

  const { data: hasClaimedRefund } = useReadContract({
    ...pollContract(pollAddress),
    functionName: "hasClaimedNonWinningRefund",
    args: address ? [address] : undefined
  })

  const { data: hasCreatorClaimed } = useReadContract({
    ...pollContract(pollAddress),
    functionName: "winningFundsClaimed",
  })

  // Contract write hooks
  const { writeContract: claimWinningFunds, data: claimWinningHash } = useWriteContract()
  const { writeContract: claimRefund, data: claimRefundHash } = useWriteContract()

  const { isLoading: isClaimingWinning, isSuccess: isWinningClaimed } = useWaitForTransactionReceipt({
    hash: claimWinningHash,
  })

  const { isLoading: isClaimingRefund, isSuccess: isRefundClaimed } = useWaitForTransactionReceipt({
    hash: claimRefundHash,
  })

  // Determine winning options
  useEffect(() => {
    if (votingResults) {
      const [, votes] = votingResults
      const sortedOptions = votes
        .map((vote, index) => ({ index, votes: vote }))
        .sort((a, b) => Number(b.votes - a.votes))
        .slice(0, winningOptionsCount)
        .map(option => option.index)
      
      setWinningOptions(sortedOptions)
      
      // Check if user voted for a winning option
      if (voterChoice !== undefined) {
        setIsWinner(sortedOptions.includes(Number(voterChoice)))
      }
    }
  }, [votingResults, winningOptionsCount, voterChoice])

  // Check if user is the poll creator
  useEffect(() => {
    if (address && pollCreator) {
      setIsCreator(address.toLowerCase() === pollCreator.toLowerCase())
    }
  }, [address, pollCreator])

  // Handle claim success
  useEffect(() => {
    if (isWinningClaimed) {
      toast.success("Successfully claimed winning funds!")
    }
  }, [isWinningClaimed])

  useEffect(() => {
    if (isRefundClaimed) {
      toast.success("Successfully claimed refund!")
    }
  }, [isRefundClaimed])

  const handleClaimWinning = () => {
    claimWinningFunds({
      ...pollContract(pollAddress),
      functionName: "claimWinningFunds"
    })
  }

  const handleClaimRefund = () => {
    claimRefund({
      ...pollContract(pollAddress),
      functionName: "claimNonWinningRefund"
    })
  }

  const formatUSDC = (amount: bigint) => {
    return `$${formatUnits(amount, 6)}`
  }

  // Calculate potential winnings for creator
  const calculateCreatorWinnings = () => {
    if (!votingResults || !tokensPerVote) return BigInt(0)
    
    const winningVotes = winningOptions.reduce((sum, optionIndex) => {
      return sum + (votingResults[1][optionIndex] || BigInt(0))
    }, BigInt(0))
    
    const totalWinnings = winningVotes * tokensPerVote
    const feeAmount = (totalWinnings * BigInt(500)) / BigInt(10000) // 5% fee
    
    return totalWinnings - feeAmount
  }

  const creatorWinnings = calculateCreatorWinnings()

  if (!address) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Poll Creator Claim */}
      {isCreator && winningOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Poll Creator Rewards
            </CardTitle>
            <CardDescription>
              Claim funds from winning options as the poll creator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total Claimable</p>
                <p className="text-2xl font-bold">{formatUSDC(creatorWinnings)} USDC</p>
                <p className="text-xs text-muted-foreground mt-1">After 5% platform fee</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>

            {hasCreatorClaimed ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Creator funds have already been claimed
                </AlertDescription>
              </Alert>
            ) : (
              <Button 
                onClick={handleClaimWinning}
                disabled={isClaimingWinning}
                className="w-full"
                size="lg"
              >
                {isClaimingWinning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  "Claim Creator Rewards"
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Voter Claims */}
      {voterChoice !== undefined && !isCreator && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isWinner ? (
                <>
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Winning Vote Rewards
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  Non-Winning Vote Refund
                </>
              )}
            </CardTitle>
            <CardDescription>
              {isWinner 
                ? "Your vote was for a winning option! Claim your rewards."
                : "Your vote was not for a winning option. Claim your refund."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your voted option:</span>
                <Badge variant="outline">Option {Number(voterChoice) + 1}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Claimable amount:</span>
                <span className="font-semibold">
                  {tokensPerVote ? formatUSDC(tokensPerVote) : "0"} USDC
                </span>
              </div>
            </div>

            {isWinner ? (
              hasClaimedWinning ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    You have already claimed your winning rewards
                  </AlertDescription>
                </Alert>
              ) : (
                <Button 
                  onClick={handleClaimWinning}
                  disabled={isClaimingWinning}
                  className="w-full"
                  size="lg"
                >
                  {isClaimingWinning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    "Claim Winning Rewards"
                  )}
                </Button>
              )
            ) : (
              hasClaimedRefund ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    You have already claimed your refund
                  </AlertDescription>
                </Alert>
              ) : (
                <Button 
                  onClick={handleClaimRefund}
                  disabled={isClaimingRefund}
                  className="w-full"
                  size="lg"
                  variant="secondary"
                >
                  {isClaimingRefund ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    "Claim Refund"
                  )}
                </Button>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* No participation message */}
      {voterChoice === undefined && !isCreator && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You did not participate in this poll. Only voters and the poll creator can claim funds.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
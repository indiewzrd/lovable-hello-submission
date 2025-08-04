"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Trophy, DollarSign, AlertCircle, CheckCircle } from "lucide-react"
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { formatUnits } from "viem"
import { pollAbi } from "@/lib/contracts/abis"
import { toast } from "sonner"
import { useWallet } from "@/hooks/use-wallet"

interface ClaimSectionProps {
  pollAddress: `0x${string}`
  pollCreator?: `0x${string}`
  hasVoted?: boolean
}

export function ClaimSection({
  pollAddress,
  pollCreator,
  hasVoted
}: ClaimSectionProps) {
  const { address } = useWallet()
  const [claimType, setClaimType] = useState<'creator' | 'refund' | 'fee' | null>(null)
  
  // Read contract data
  const { data: winnersCalculated } = useReadContract({
    address: pollAddress,
    abi: pollAbi,
    functionName: "winnersCalculated"
  })

  const { data: winningOptions } = useReadContract({
    address: pollAddress,
    abi: pollAbi,
    functionName: "getWinningOptions"
  })

  const { data: voterChoice } = useReadContract({
    address: pollAddress,
    abi: pollAbi,
    functionName: "voterChoice",
    args: address ? [address] : undefined
  })

  const { data: hasClaimedRefund } = useReadContract({
    address: pollAddress,
    abi: pollAbi,
    functionName: "hasClaimedRefund",
    args: address ? [address] : undefined
  })

  const { data: creatorClaimed } = useReadContract({
    address: pollAddress,
    abi: pollAbi,
    functionName: "creatorClaimed"
  })

  const { data: feeClaimed } = useReadContract({
    address: pollAddress,
    abi: pollAbi,
    functionName: "feeClaimed"
  })

  const { data: winningAmount } = useReadContract({
    address: pollAddress,
    abi: pollAbi,
    functionName: "winningAmount"
  })

  const { data: feeAmount } = useReadContract({
    address: pollAddress,
    abi: pollAbi,
    functionName: "feeAmount"
  })

  // Write contracts
  const { writeContract: calculateWinners, data: calculateHash } = useWriteContract()
  const { writeContract: claimWinningFunds, data: claimWinningHash } = useWriteContract()
  const { writeContract: claimRefund, data: claimRefundHash } = useWriteContract()
  const { writeContract: claimFee, data: claimFeeHash } = useWriteContract()

  const { isLoading: isCalculating } = useWaitForTransactionReceipt({ hash: calculateHash })
  const { isLoading: isClaimingWinning } = useWaitForTransactionReceipt({ hash: claimWinningHash })
  const { isLoading: isClaimingRefund } = useWaitForTransactionReceipt({ hash: claimRefundHash })
  const { isLoading: isClaimingFee } = useWaitForTransactionReceipt({ hash: claimFeeHash })

  // Check if user's vote is a winner - add type assertions to avoid unknown types
  const isWinner: boolean = Boolean(voterChoice && winningOptions && 
    (winningOptions as bigint[]).some((option: bigint) => Number(option) === Number(voterChoice)))

  const isCreator: boolean = Boolean(address && pollCreator && 
    address.toLowerCase() === pollCreator.toLowerCase())
    
  const shouldShowCreatorClaim = Boolean(isCreator && !creatorClaimed && winnersCalculated)
  const shouldShowVoterRefund = Boolean(hasVoted && !isWinner && !hasClaimedRefund && winnersCalculated)

  const handleCalculateWinners = async () => {
    try {
      calculateWinners({
        address: pollAddress,
        abi: pollAbi,
        functionName: "calculateWinners"
      })
    } catch (error) {
      console.error(error)
      toast.error("Failed to calculate winners")
    }
  }

  const handleClaimWinningFunds = async () => {
    setClaimType('creator')
    try {
      claimWinningFunds({
        address: pollAddress,
        abi: pollAbi,
        functionName: "claimWinningFunds"
      })
    } catch (error) {
      console.error(error)
      toast.error("Failed to claim winning funds")
    }
  }

  const handleClaimRefund = async () => {
    setClaimType('refund')
    try {
      claimRefund({
        address: pollAddress,
        abi: pollAbi,
        functionName: "claimNonWinningRefund"
      })
    } catch (error) {
      console.error(error)
      toast.error("Failed to claim refund")
    }
  }

  const handleClaimFee = async () => {
    setClaimType('fee')
    try {
      claimFee({
        address: pollAddress,
        abi: pollAbi,
        functionName: "claimFee"
      })
    } catch (error) {
      console.error(error)
      toast.error("Failed to claim fee")
    }
  }

  // Handle success
  useEffect(() => {
    if (calculateHash && !isCalculating) {
      toast.success("Winners calculated successfully!")
    }
  }, [calculateHash, isCalculating])

  useEffect(() => {
    if (claimWinningHash && !isClaimingWinning) {
      toast.success("Winning funds claimed successfully!")
      setClaimType(null)
    }
  }, [claimWinningHash, isClaimingWinning])

  useEffect(() => {
    if (claimRefundHash && !isClaimingRefund) {
      toast.success("Refund claimed successfully!")
      setClaimType(null)
    }
  }, [claimRefundHash, isClaimingRefund])

  useEffect(() => {
    if (claimFeeHash && !isClaimingFee) {
      toast.success("Fee claimed successfully!")
      setClaimType(null)
    }
  }, [claimFeeHash, isClaimingFee])

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Claim Rewards</h2>

      {!winnersCalculated ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium">Winners not calculated yet</p>
              <p className="text-sm text-muted-foreground">
                Anyone can calculate the winning options to enable claims.
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleCalculateWinners}
            disabled={isCalculating}
            className="w-full"
          >
            {isCalculating ? "Calculating..." : "Calculate Winners"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Show winning options */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Winning Options:</p>
            <div className="flex gap-2">
              {(winningOptions as bigint[])?.map((option: bigint) => (
                <Badge key={option.toString()} variant="default">
                  Option {option.toString()}
                </Badge>
              ))}
            </div>
          </div>

          {/* Creator claim */}
          {isCreator && !creatorClaimed && winnersCalculated && (
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium">Creator Rewards</span>
                </div>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Available
                </Badge>
              </div>
              <Button 
                onClick={handleClaimWinningFunds}
                disabled={isClaimingWinning}
                className="w-full"
              >
                {isClaimingWinning ? 'Claiming...' : 'Claim Winning Funds'}
              </Button>
            </div>
          )}

          {/* Voter refund */}
          {hasVoted && !isWinner && !hasClaimedRefund && winnersCalculated && (
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Voter Refund</span>
                </div>
                <Badge variant="secondary">Non-winning vote</Badge>
              </div>
              <Button
                onClick={handleClaimRefund}
                disabled={isClaimingRefund || claimType === 'refund'}
                size="sm"
                className="w-full"
              >
                {isClaimingRefund && claimType === 'refund' ? "Claiming..." : "Claim Refund"}
              </Button>
            </div>
          )}

          {/* Success messages */}
          {creatorClaimed && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Creator rewards claimed</span>
            </div>
          )}

          {hasClaimedRefund && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Refund claimed</span>
            </div>
          )}

          {feeClaimed && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Platform fee claimed</span>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
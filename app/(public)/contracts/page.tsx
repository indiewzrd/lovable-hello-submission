"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Copy, CheckCircle } from "lucide-react"
import { toast } from "sonner"

const CONTRACT_INFO = {
  pollFactory: {
    address: "0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6",
    name: "PollFactory",
    network: "Base Sepolia",
    basescanUrl: "https://sepolia.basescan.org/address/0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6"
  },
  usdc: {
    address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    name: "USDC (Base Sepolia)",
    network: "Base Sepolia",
    basescanUrl: "https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e"
  }
}

export default function ContractsPage() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  const copyToClipboard = (address: string, name: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    toast.success(`Copied ${name} address`)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Smart Contracts</h1>
        <p className="text-muted-foreground">
          View and interact with Stakedriven smart contracts on Base Sepolia
        </p>
      </div>

      <div className="space-y-6">
        {/* PollFactory Contract */}
        <Card>
          <CardHeader>
            <CardTitle>{CONTRACT_INFO.pollFactory.name}</CardTitle>
            <CardDescription>
              Main factory contract for deploying polls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Contract Address</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono">
                    {CONTRACT_INFO.pollFactory.address}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(CONTRACT_INFO.pollFactory.address, CONTRACT_INFO.pollFactory.name)}
                  >
                    {copiedAddress === CONTRACT_INFO.pollFactory.address ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Network</p>
                <p className="font-medium">{CONTRACT_INFO.pollFactory.network}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Verified on Basescan</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={CONTRACT_INFO.pollFactory.basescanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    View on Basescan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`${CONTRACT_INFO.pollFactory.basescanUrl}#readContract`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    Read Contract
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`${CONTRACT_INFO.pollFactory.basescanUrl}#writeContract`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    Write Contract
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* USDC Contract */}
        <Card>
          <CardHeader>
            <CardTitle>{CONTRACT_INFO.usdc.name}</CardTitle>
            <CardDescription>
              Official USDC token contract on Base Sepolia testnet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Contract Address</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono">
                    {CONTRACT_INFO.usdc.address}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(CONTRACT_INFO.usdc.address, CONTRACT_INFO.usdc.name)}
                  >
                    {copiedAddress === CONTRACT_INFO.usdc.address ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Network</p>
                <p className="font-medium">{CONTRACT_INFO.usdc.network}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={CONTRACT_INFO.usdc.basescanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    View on Basescan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Methods Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>Contract Methods</CardTitle>
            <CardDescription>
              Quick reference for available contract methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">PollFactory Methods</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium">Read Methods:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                      <li>admin() - Get admin address</li>
                      <li>feePercentage() - Get platform fee (default 500 = 5%)</li>
                      <li>getDeployedPolls() - Get all poll addresses</li>
                      <li>getDeployedPollsCount() - Get total polls count</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium">Write Methods:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                      <li>deployPoll(...) - Create a new poll</li>
                      <li>setFeePercentage(uint256) - Change fee (admin only)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Poll Methods</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium">Read Methods:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                      <li>pollCreator() - Get poll creator address</li>
                      <li>startTime() / endTime() - Get voting period</li>
                      <li>tokensPerVote() - Get required USDC per vote</li>
                      <li>optionVotes(uint256) - Get votes for an option</li>
                      <li>getWinningOptions() - Get winning options (after voting)</li>
                      <li>userHasVoted(address) - Check if user voted</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium">Write Methods:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                      <li>vote(uint256) - Vote for an option</li>
                      <li>claimWinningFunds() - Creator claims funds</li>
                      <li>claimNonWinningRefund() - Voter gets refund</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
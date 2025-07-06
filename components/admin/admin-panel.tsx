"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { useWallet } from "@/hooks/use-wallet"
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { POLL_FACTORY_ABI, POLL_FACTORY_ADDRESS } from "@/lib/contracts/abis"
import { Shield, Wallet, Settings, DollarSign, AlertCircle } from "lucide-react"

export function AdminPanel() {
  const { address } = useWallet()
  const [newFeePercentage, setNewFeePercentage] = useState("")
  const [newGlobalAdmin, setNewGlobalAdmin] = useState("")

  // Read contract data
  const { data: feePercentage } = useReadContract({
    address: POLL_FACTORY_ADDRESS,
    abi: POLL_FACTORY_ABI,
    functionName: 'feePercentage',
  })
  
  const { data: globalAdmin } = useReadContract({
    address: POLL_FACTORY_ADDRESS,
    abi: POLL_FACTORY_ABI,
    functionName: 'globalAdmin',
  })

  // Contract write functions
  const { writeContract: setFee, data: setFeeHash } = useWriteContract()
  const { writeContract: setAdmin, data: setAdminHash } = useWriteContract()

  // Transaction receipts
  const { isLoading: isSettingFee } = useWaitForTransactionReceipt({ hash: setFeeHash })
  const { isLoading: isSettingAdmin } = useWaitForTransactionReceipt({ hash: setAdminHash })

  // Check if current user is admin
  const isAdmin = address && globalAdmin && address.toLowerCase() === globalAdmin.toLowerCase()

  useEffect(() => {
    if (feePercentage) {
      setNewFeePercentage((Number(feePercentage) / 100).toString())
    }
  }, [feePercentage])

  const handleSetFeePercentage = async () => {
    const percentage = parseFloat(newFeePercentage) * 100
    if (isNaN(percentage) || percentage < 0 || percentage > 10000) {
      toast.error("Fee percentage must be between 0 and 100%")
      return
    }

    try {
      await setFee({
        address: POLL_FACTORY_ADDRESS,
        abi: POLL_FACTORY_ABI,
        functionName: 'setFeePercentage',
        args: [BigInt(Math.floor(percentage))],
      })
      toast.success("Fee percentage update initiated")
    } catch (error) {
      console.error("Error setting fee percentage:", error)
      toast.error("Failed to update fee percentage")
    }
  }

  const handleSetGlobalAdmin = async () => {
    if (!newGlobalAdmin || !newGlobalAdmin.startsWith('0x')) {
      toast.error("Please enter a valid Ethereum address")
      return
    }

    try {
      await setAdmin({
        address: POLL_FACTORY_ADDRESS,
        abi: POLL_FACTORY_ABI,
        functionName: 'setGlobalAdmin',
        args: [newGlobalAdmin as `0x${string}`],
      })
      toast.success("Admin update initiated")
    } catch (error) {
      console.error("Error setting admin:", error)
      toast.error("Failed to update admin")
    }
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Access Denied
          </CardTitle>
          <CardDescription>
            You must be the global admin to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Current admin: {globalAdmin || "Loading..."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="settings" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="system">System Info</TabsTrigger>
      </TabsList>

      <TabsContent value="settings" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Fee Configuration
            </CardTitle>
            <CardDescription>
              Manage platform fees for all polls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="feePercentage">Platform Fee Percentage</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="feePercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={newFeePercentage}
                  onChange={(e) => setNewFeePercentage(e.target.value)}
                  placeholder="0.00"
                />
                <Button 
                  onClick={handleSetFeePercentage}
                  disabled={isSettingFee}
                >
                  {isSettingFee ? "Updating..." : "Update"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Current: {feePercentage ? Number(feePercentage) / 100 : 0}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Configuration
            </CardTitle>
            <CardDescription>
              Transfer admin privileges
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="globalAdmin">Global Admin Address</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="globalAdmin"
                  type="text"
                  value={newGlobalAdmin}
                  onChange={(e) => setNewGlobalAdmin(e.target.value)}
                  placeholder="0x..."
                />
                <Button 
                  onClick={handleSetGlobalAdmin}
                  disabled={isSettingAdmin}
                  variant="destructive"
                >
                  {isSettingAdmin ? "Updating..." : "Transfer"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Current: {globalAdmin || "Loading..."}
              </p>
              <p className="text-sm text-destructive mt-1">
                Warning: This action cannot be undone!
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="system" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Contract Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Poll Factory Address</span>
              <code className="text-xs">{POLL_FACTORY_ADDRESS}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Current Admin</span>
              <code className="text-xs">{globalAdmin || "Loading..."}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Platform Fee</span>
              <Badge variant="secondary">
                {feePercentage ? Number(feePercentage) / 100 : 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
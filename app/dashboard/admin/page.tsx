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
import { usePollFactory } from "@/lib/contracts/hooks"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { contractABIs, contractAddresses } from "@/lib/contracts/config"
import { baseSepolia } from "viem/chains"
import { Shield, Wallet, Settings, DollarSign, AlertCircle } from "lucide-react"

export default function AdminPage() {
  const { address } = useWallet()
  const { globalAdmin, feePercentage } = usePollFactory()
  const [newFeePercentage, setNewFeePercentage] = useState("")
  const [newFeeWallet, setNewFeeWallet] = useState("")
  const [newRescueWallet, setNewRescueWallet] = useState("")
  const [newGlobalAdmin, setNewGlobalAdmin] = useState("")

  // Contract write functions
  const { writeContract: setFee, data: setFeeHash } = useWriteContract()
  const { writeContract: setFeeWallet, data: setFeeWalletHash } = useWriteContract()
  const { writeContract: setRescueWallet, data: setRescueWalletHash } = useWriteContract()
  const { writeContract: setAdmin, data: setAdminHash } = useWriteContract()

  // Transaction receipts
  const { isLoading: isSettingFee } = useWaitForTransactionReceipt({ hash: setFeeHash })
  const { isLoading: isSettingFeeWallet } = useWaitForTransactionReceipt({ hash: setFeeWalletHash })
  const { isLoading: isSettingRescueWallet } = useWaitForTransactionReceipt({ hash: setRescueWalletHash })
  const { isLoading: isSettingAdmin } = useWaitForTransactionReceipt({ hash: setAdminHash })

  // Check if current user is admin
  const isAdmin = address && globalAdmin && address.toLowerCase() === globalAdmin.toLowerCase()

  useEffect(() => {
    if (feePercentage) {
      setNewFeePercentage(feePercentage.toString())
    }
  }, [feePercentage])

  const handleSetFeePercentage = async () => {
    const percentage = parseInt(newFeePercentage)
    if (isNaN(percentage) || percentage < 0 || percentage > 10000) {
      toast.error("Fee percentage must be between 0 and 10000 (0-100%)")
      return
    }

    try {
      setFee({
        address: contractAddresses[baseSepolia.id].pollFactory,
        abi: contractABIs.pollFactory,
        functionName: "setFeePercentage",
        args: [BigInt(percentage)]
      })
      toast.info("Setting fee percentage...")
    } catch (error) {
      console.error(error)
      toast.error("Failed to set fee percentage")
    }
  }

  const handleSetFeeWallet = async () => {
    if (!newFeeWallet || !newFeeWallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error("Invalid wallet address")
      return
    }

    try {
      setFeeWallet({
        address: contractAddresses[baseSepolia.id].pollFactory,
        abi: contractABIs.pollFactory,
        functionName: "setFeeWallet",
        args: [newFeeWallet as `0x${string}`]
      })
      toast.info("Setting fee wallet...")
    } catch (error) {
      console.error(error)
      toast.error("Failed to set fee wallet")
    }
  }

  const handleSetRescueWallet = async () => {
    if (!newRescueWallet || !newRescueWallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error("Invalid wallet address")
      return
    }

    try {
      setRescueWallet({
        address: contractAddresses[baseSepolia.id].pollFactory,
        abi: contractABIs.pollFactory,
        functionName: "setRescueWallet",
        args: [newRescueWallet as `0x${string}`]
      })
      toast.info("Setting rescue wallet...")
    } catch (error) {
      console.error(error)
      toast.error("Failed to set rescue wallet")
    }
  }

  const handleSetGlobalAdmin = async () => {
    if (!newGlobalAdmin || !newGlobalAdmin.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error("Invalid wallet address")
      return
    }

    try {
      setAdmin({
        address: contractAddresses[baseSepolia.id].pollFactory,
        abi: contractABIs.pollFactory,
        functionName: "setGlobalAdmin",
        args: [newGlobalAdmin as `0x${string}`]
      })
      toast.info("Setting global admin...")
    } catch (error) {
      console.error(error)
      toast.error("Failed to set global admin")
    }
  }

  // Handle transaction success
  useEffect(() => {
    if (setFeeHash && !isSettingFee) {
      toast.success("Fee percentage updated successfully!")
      setNewFeePercentage("")
    }
  }, [setFeeHash, isSettingFee])

  useEffect(() => {
    if (setFeeWalletHash && !isSettingFeeWallet) {
      toast.success("Fee wallet updated successfully!")
      setNewFeeWallet("")
    }
  }, [setFeeWalletHash, isSettingFeeWallet])

  useEffect(() => {
    if (setRescueWalletHash && !isSettingRescueWallet) {
      toast.success("Rescue wallet updated successfully!")
      setNewRescueWallet("")
    }
  }, [setRescueWalletHash, isSettingRescueWallet])

  useEffect(() => {
    if (setAdminHash && !isSettingAdmin) {
      toast.success("Global admin updated successfully!")
      setNewGlobalAdmin("")
    }
  }, [setAdminHash, isSettingAdmin])

  if (!isAdmin) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Access Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium">You are not the global admin</p>
                <p className="text-sm text-muted-foreground">
                  Only the global admin can access this page and modify platform settings.
                </p>
                {globalAdmin && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Current admin: <code className="text-xs">{globalAdmin}</code>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage global platform settings and contracts
        </p>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Platform Settings</TabsTrigger>
          <TabsTrigger value="wallets">Wallet Management</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fee Configuration
              </CardTitle>
              <CardDescription>
                Set the platform fee percentage for all polls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Current Fee</p>
                  <p className="text-2xl font-bold">{feePercentage}%</p>
                </div>
                <Badge variant="outline">
                  {feePercentage && feePercentage > 0 ? "Active" : "No Fee"}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feePercentage">New Fee Percentage</Label>
                <div className="flex gap-2">
                  <Input
                    id="feePercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="5.00"
                    value={newFeePercentage}
                    onChange={(e) => setNewFeePercentage(e.target.value)}
                  />
                  <Button 
                    onClick={handleSetFeePercentage}
                    disabled={isSettingFee}
                  >
                    {isSettingFee ? "Setting..." : "Update Fee"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter percentage as a number (e.g., 5 for 5%)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Fee Wallet
              </CardTitle>
              <CardDescription>
                Wallet that receives platform fees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feeWallet">Fee Wallet Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="feeWallet"
                    placeholder="0x..."
                    value={newFeeWallet}
                    onChange={(e) => setNewFeeWallet(e.target.value)}
                  />
                  <Button 
                    onClick={handleSetFeeWallet}
                    disabled={isSettingFeeWallet}
                  >
                    {isSettingFeeWallet ? "Setting..." : "Update"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Rescue Wallet
              </CardTitle>
              <CardDescription>
                Emergency wallet for fund recovery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rescueWallet">Rescue Wallet Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="rescueWallet"
                    placeholder="0x..."
                    value={newRescueWallet}
                    onChange={(e) => setNewRescueWallet(e.target.value)}
                  />
                  <Button 
                    onClick={handleSetRescueWallet}
                    disabled={isSettingRescueWallet}
                  >
                    {isSettingRescueWallet ? "Setting..." : "Update"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Global Admin Transfer
              </CardTitle>
              <CardDescription>
                Transfer admin rights to another address (irreversible)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900">Warning</p>
                  <p className="text-amber-700">
                    This action is irreversible. You will lose all admin privileges.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="globalAdmin">New Admin Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="globalAdmin"
                    placeholder="0x..."
                    value={newGlobalAdmin}
                    onChange={(e) => setNewGlobalAdmin(e.target.value)}
                  />
                  <Button 
                    variant="destructive"
                    onClick={handleSetGlobalAdmin}
                    disabled={isSettingAdmin}
                  >
                    {isSettingAdmin ? "Transferring..." : "Transfer Admin"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Statistics</CardTitle>
              <CardDescription>
                Overview of platform usage and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Statistics dashboard coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
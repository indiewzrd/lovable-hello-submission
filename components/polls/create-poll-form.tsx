"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { parseUnits } from "viem"
import { baseSepolia } from "viem/chains"
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
// Embedded ABIs to avoid import issues
const POLL_FACTORY_ADDRESS = '0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6' as const
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const

const POLL_FACTORY_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_startTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_endTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_tokensPerVote",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_winningOptionsCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_totalOptionsCount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_tokenAddress",
        "type": "address"
      }
    ],
    "name": "deployPoll",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feePercentage",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

interface PollOption {
  id: number
  text: string
  description?: string
}

type Project = {
  id: string
  name: string
}

export function CreatePollForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams?.get("project")
  const { address, isConnected } = useWallet()
  
  // Add error boundary
  if (!POLL_FACTORY_ABI || !POLL_FACTORY_ADDRESS) {
    return (
      <div className="text-red-500">
        Error: Contract configuration not loaded properly
      </div>
    )
  }
  
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [formData, setFormData] = useState({
    question: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    tokensPerVote: "1",
    winningOptionsCount: "1",
  })
  const [options, setOptions] = useState<PollOption[]>([
    { id: 1, text: "", description: "" },
    { id: 2, text: "", description: "" },
  ])
  
  // Contract interactions
  const { data: feePercentage } = useReadContract({
    address: POLL_FACTORY_ADDRESS,
    abi: POLL_FACTORY_ABI,
    functionName: 'feePercentage',
  })
  
  const { 
    writeContract: deployPoll,
    data: deployHash,
    isPending: isDeploying,
  } = useWriteContract()
  
  const { isLoading: isDeployConfirming, isSuccess: isDeploySuccess } = 
    useWaitForTransactionReceipt({ hash: deployHash })

  // Load user's projects
  useEffect(() => {
    if (address) {
      fetch(`/api/projects?walletAddress=${address}`)
        .then(res => res.json())
        .then(data => {
          setProjects(data)
          if (projectId && data.some((p: Project) => p.id === projectId)) {
            setSelectedProject(projectId)
          }
        })
        .catch(err => console.error("Failed to load projects:", err))
    }
  }, [address, projectId])

  // Save to database after successful deployment
  useEffect(() => {
    if (isDeploySuccess && deployHash) {
      // For now, just show success and redirect
      // In a real implementation, we would:
      // 1. Get the poll address from the transaction receipt
      // 2. Save the poll data to the database with the contract address
      toast.success("Poll created successfully!")
      router.push('/dashboard')
    }
  }, [isDeploySuccess, deployHash, router])

  const addOption = () => {
    const newId = Math.max(...options.map(o => o.id)) + 1
    setOptions([...options, { id: newId, text: "", description: "" }])
  }

  const removeOption = (id: number) => {
    if (options.length > 2) {
      setOptions(options.filter(o => o.id !== id))
    }
  }

  const updateOption = (id: number, field: keyof PollOption, value: string) => {
    setOptions(options.map(o => 
      o.id === id ? { ...o, [field]: value } : o
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast.error("Please connect your wallet")
      return
    }

    // Validate form
    const filledOptions = options.filter(o => o.text.trim())
    if (filledOptions.length < 2) {
      toast.error("Please provide at least 2 options")
      return
    }

    // Parse dates
    const startTimestamp = new Date(`${formData.startDate}T${formData.startTime}`).getTime() / 1000
    const endTimestamp = new Date(`${formData.endDate}T${formData.endTime}`).getTime() / 1000

    if (startTimestamp >= endTimestamp) {
      toast.error("End time must be after start time")
      return
    }

    try {
      // Deploy to blockchain first
      const tx = await deployPoll({
        address: POLL_FACTORY_ADDRESS,
        abi: POLL_FACTORY_ABI,
        functionName: 'deployPoll',
        args: [
          BigInt(startTimestamp),
          BigInt(endTimestamp),
          parseUnits(formData.tokensPerVote, 6), // USDC has 6 decimals
          BigInt(formData.winningOptionsCount),
          BigInt(filledOptions.length),
          USDC_ADDRESS,
        ],
      })
      
      toast.info('Transaction submitted. Waiting for confirmation...')
      
      // Note: We'll save to database after the transaction is confirmed
      // This happens in the useEffect that watches for isDeploySuccess
    } catch (error) {
      console.error('Error creating poll:', error)
      toast.error('Failed to create poll. Please try again.')
    }
  }

  const isLoading = isDeploying || isDeployConfirming

  if (!isConnected) {
    return (
      <Card className="p-6">
        <CardContent className="text-center">
          <p className="text-lg mb-4">Please connect your wallet to create a poll</p>
          <p className="text-sm text-muted-foreground">
            You need to connect your wallet to interact with the smart contracts
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Poll Details</h2>
        
        <div className="space-y-4">
          {projects.length > 0 && (
            <div>
              <Label htmlFor="project">Project (Optional)</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No project</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Don't have a project? <Link href="/dashboard/projects" className="text-primary hover:underline">Create one first</Link>
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="question">Poll Question *</Label>
            <Input
              id="question"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="What should we build next?"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide additional context for your poll..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tokensPerVote">USDC per Vote *</Label>
              <Input
                id="tokensPerVote"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.tokensPerVote}
                onChange={(e) => setFormData({ ...formData, tokensPerVote: e.target.value })}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Minimum stake required per vote
              </p>
            </div>
            <div>
              <Label htmlFor="winningOptionsCount">Winning Options *</Label>
              <Input
                id="winningOptionsCount"
                type="number"
                min="1"
                max={options.length}
                value={formData.winningOptionsCount}
                onChange={(e) => setFormData({ ...formData, winningOptionsCount: e.target.value })}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Number of options that can win
              </p>
            </div>
          </div>

          {feePercentage !== undefined && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm">
                Platform fee: {Number(feePercentage) / 100}% of total votes
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Poll Options</h2>
          <Button
            type="button"
            onClick={addOption}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Option
          </Button>
        </div>

        <div className="space-y-4">
          {options.map((option, index) => (
            <div key={option.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <Label>Option {index + 1} *</Label>
                {options.length > 2 && (
                  <Button
                    type="button"
                    onClick={() => removeOption(option.id)}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Input
                value={option.text}
                onChange={(e) => updateOption(option.id, 'text', e.target.value)}
                placeholder="Option text"
                required
              />
              <Textarea
                value={option.description || ''}
                onChange={(e) => updateOption(option.id, 'description', e.target.value)}
                placeholder="Option description (optional)"
                rows={2}
              />
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Poll"}
        </Button>
      </div>
    </form>
  )
}
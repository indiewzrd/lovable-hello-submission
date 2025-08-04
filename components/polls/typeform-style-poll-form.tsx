"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Trash2, ArrowLeft, ArrowRight, CheckCircle, Clock, Users, Coins } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { parseUnits } from "viem"
import { useWriteContract, useWaitForTransactionReceipt } from '@/lib/wagmi-mocks'
import { pollFactoryAbi } from '@/lib/contracts/abis'
import { BASE_SEPOLIA_CONFIG } from '@/lib/contracts/config'

interface PollOption {
  id: string
  text: string
  description?: string
}

interface FormData {
  title: string
  description: string
  options: PollOption[]
  startTime: string
  endTime: string
  tokensPerVote: string
  winningOptionsCount: number
  projectId?: string
}

const STEPS = [
  { id: 'basic', title: 'Poll Details', icon: Clock },
  { id: 'options', title: 'Add Options', icon: Users },
  { id: 'settings', title: 'Configure', icon: Coins },
  { id: 'review', title: 'Review & Deploy', icon: CheckCircle }
]

export function TypeformStylePollForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams?.get("projectId")
  const { address, isConnected } = useWallet()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    options: [
      { id: "1", text: "", description: "" },
      { id: "2", text: "", description: "" }
    ],
    startTime: "",
    endTime: "",
    tokensPerVote: "1",
    winningOptionsCount: 1,
    projectId: projectId || undefined
  })

  // Contract interaction
  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic info
        return formData.title.trim() !== "" && formData.description.trim() !== ""
      case 1: // Options
        return formData.options.filter(opt => opt.text.trim() !== "").length >= 2
      case 2: // Settings
        return formData.startTime !== "" && formData.endTime !== "" && 
               parseFloat(formData.tokensPerVote) > 0 && formData.winningOptionsCount > 0
      case 3: // Review
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const addOption = () => {
    const newId = (formData.options.length + 1).toString()
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { id: newId, text: "", description: "" }]
    }))
  }

  const removeOption = (id: string) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter(opt => opt.id !== id)
      }))
    }
  }

  const updateOption = (id: string, field: 'text' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt => 
        opt.id === id ? { ...opt, [field]: value } : opt
      )
    }))
  }

  const deployPoll = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    try {
      const startTimeMs = new Date(formData.startTime).getTime()
      const endTimeMs = new Date(formData.endTime).getTime()
      const tokensPerVote = parseUnits(formData.tokensPerVote, 6) // USDC has 6 decimals
      
      const validOptions = formData.options.filter(opt => opt.text.trim() !== "")

      writeContract({
        address: BASE_SEPOLIA_CONFIG.POLL_FACTORY_ADDRESS as `0x${string}`,
        abi: pollFactoryAbi,
        functionName: 'deployPoll',
        args: [
          BigInt(Math.floor(startTimeMs / 1000)),
          BigInt(Math.floor(endTimeMs / 1000)),
          tokensPerVote,
          BigInt(formData.winningOptionsCount),
          BigInt(validOptions.length),
          BASE_SEPOLIA_CONFIG.USDC_ADDRESS as `0x${string}`
        ]
      })
    } catch (error) {
      console.error("Error deploying poll:", error)
      toast.error("Failed to deploy poll")
    }
  }

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Poll deployed successfully!")
      
      // Save poll metadata to database
      const savePollData = async () => {
        try {
          const response = await fetch('/api/polls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: formData.title,
              description: formData.description,
              options: formData.options.filter(opt => opt.text.trim() !== ""),
              projectId: formData.projectId,
              transactionHash: hash
            })
          })
          
          if (response.ok) {
            const { pollId } = await response.json()
            router.push(formData.projectId ? 
              `/dashboard/projects/${formData.projectId}` : 
              `/dashboard/polls`
            )
          }
        } catch (error) {
          console.error("Error saving poll data:", error)
        }
      }
      
      savePollData()
    }
  }, [isConfirmed, hash, formData, router])

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Let's start with the basics
              </h2>
              <p className="text-muted-foreground mt-2">Give your poll a compelling title and description</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-base font-medium">Poll Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Which feature should we build next?"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="text-lg p-4 h-auto"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="description" className="text-base font-medium">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Explain what this poll is about and why people should vote..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[120px] text-base p-4"
                />
              </div>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Add your options
              </h2>
              <p className="text-muted-foreground mt-2">What choices will voters have?</p>
            </div>
            
            <div className="space-y-4">
              {formData.options.map((option, index) => (
                <Card key={option.id} className="border-2 border-dashed border-muted hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Option {index + 1}</Label>
                          <Input
                            placeholder={`Option ${index + 1} (e.g., Mobile App Redesign)`}
                            value={option.text}
                            onChange={(e) => updateOption(option.id, 'text', e.target.value)}
                            className="text-base"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Description (optional)</Label>
                          <Textarea
                            placeholder="Brief description of this option..."
                            value={option.description}
                            onChange={(e) => updateOption(option.id, 'description', e.target.value)}
                            className="min-h-[80px] text-sm"
                          />
                        </div>
                      </div>
                      
                      {formData.options.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(option.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button
                variant="outline"
                onClick={addOption}
                className="w-full border-dashed border-2 h-16 text-muted-foreground hover:text-foreground hover:border-primary"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Another Option
              </Button>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Configure your poll
              </h2>
              <p className="text-muted-foreground mt-2">Set timing and voting parameters</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="startTime" className="text-base font-medium">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="text-base p-3 h-auto"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="endTime" className="text-base font-medium">End Time</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="text-base p-3 h-auto"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="tokensPerVote" className="text-base font-medium">USDC per Vote</Label>
                <Input
                  id="tokensPerVote"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="1.0"
                  value={formData.tokensPerVote}
                  onChange={(e) => setFormData(prev => ({ ...prev, tokensPerVote: e.target.value }))}
                  className="text-base p-3 h-auto"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="winningOptions" className="text-base font-medium">Number of Winners</Label>
                <Select
                  value={formData.winningOptionsCount.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, winningOptionsCount: parseInt(value) }))}
                >
                  <SelectTrigger className="text-base p-3 h-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: Math.min(5, formData.options.filter(o => o.text.trim()).length) }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1} {i === 0 ? 'Winner' : 'Winners'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 3:
        const validOptions = formData.options.filter(opt => opt.text.trim() !== "")
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Review & Deploy
              </h2>
              <p className="text-muted-foreground mt-2">Everything looks good? Let's deploy your poll!</p>
            </div>
            
            <Card className="border-2">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{formData.title}</h3>
                  <p className="text-muted-foreground">{formData.description}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Options ({validOptions.length})</h4>
                  <div className="space-y-2">
                    {validOptions.map((option, index) => (
                      <div key={option.id} className="border rounded-lg p-3">
                        <div className="font-medium">Option {index + 1}: {option.text}</div>
                        {option.description && (
                          <div className="text-sm text-muted-foreground mt-1">{option.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <div className="text-sm text-muted-foreground">Cost per Vote</div>
                    <div className="font-medium">{formData.tokensPerVote} USDC</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Winners</div>
                    <div className="font-medium">{formData.winningOptionsCount}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Start</div>
                    <div className="font-medium">{new Date(formData.startTime).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">End</div>
                    <div className="font-medium">{new Date(formData.endTime).toLocaleString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isCompleted = index < currentStep
            const isValidated = validateStep(index)
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all
                  ${isActive ? 'border-primary bg-primary text-primary-foreground' : 
                    isCompleted ? 'border-primary bg-primary/10 text-primary' : 
                    'border-muted-foreground/30 bg-background text-muted-foreground'}
                `}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="ml-3 hidden sm:block">
                  <div className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.title}
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`
                    w-16 h-0.5 mx-4 transition-colors
                    ${isCompleted ? 'bg-primary' : 'bg-muted'}
                  `} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="border-2">
        <CardContent className="p-8">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {STEPS.length}
        </div>

        {currentStep === STEPS.length - 1 ? (
          <Button
            onClick={deployPoll}
            disabled={!validateStep(currentStep) || isConfirming || !isConnected}
            className="flex items-center gap-2"
          >
            {isConfirming ? "Deploying..." : "Deploy Poll"}
            <CheckCircle className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={nextStep}
            disabled={!validateStep(currentStep)}
            className="flex items-center gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
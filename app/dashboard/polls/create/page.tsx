"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { parseUSDC } from "@/lib/contracts"

interface PollOption {
  id: number
  text: string
  description?: string
}

export default function CreatePollPage() {
  const router = useRouter()
  const { authenticated } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  
  const [question, setQuestion] = useState("")
  const [description, setDescription] = useState("")
  const [options, setOptions] = useState<PollOption[]>([
    { id: 1, text: "" },
    { id: 2, text: "" }
  ])
  const [tokensPerVote, setTokensPerVote] = useState("")
  const [winningOptionsCount, setWinningOptionsCount] = useState("1")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h1 className="text-2xl font-bold mb-4">Connect your wallet to continue</h1>
        <p className="text-muted-foreground">You need to connect your wallet to create polls</p>
      </div>
    )
  }

  const addOption = () => {
    if (options.length >= 10) {
      toast.error("Maximum 10 options allowed")
      return
    }
    setOptions([...options, { id: Date.now(), text: "" }])
  }

  const removeOption = (id: number) => {
    if (options.length <= 2) {
      toast.error("Minimum 2 options required")
      return
    }
    setOptions(options.filter(opt => opt.id !== id))
  }

  const updateOption = (id: number, field: keyof PollOption, value: string) => {
    setOptions(options.map(opt => 
      opt.id === id ? { ...opt, [field]: value } : opt
    ))
  }

  const validateForm = () => {
    if (!question.trim()) {
      toast.error("Question is required")
      return false
    }

    if (options.some(opt => !opt.text.trim())) {
      toast.error("All options must have text")
      return false
    }

    if (!tokensPerVote || parseFloat(tokensPerVote) <= 0) {
      toast.error("Valid tokens per vote amount required")
      return false
    }

    if (!startDate || !startTime || !endDate || !endTime) {
      toast.error("Start and end times are required")
      return false
    }

    const start = new Date(`${startDate}T${startTime}`)
    const end = new Date(`${endDate}T${endTime}`)
    
    if (start >= end) {
      toast.error("End time must be after start time")
      return false
    }

    if (start <= new Date()) {
      toast.error("Start time must be in the future")
      return false
    }

    const winningCount = parseInt(winningOptionsCount)
    if (winningCount < 1 || winningCount > options.length) {
      toast.error(`Winning options must be between 1 and ${options.length}`)
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    try {
      // TODO: Deploy poll contract and save to database
      toast.success("Poll created successfully!")
      router.push("/dashboard")
    } catch (error) {
      console.error(error)
      toast.error("Failed to create poll")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create New Poll</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Poll Details</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Question *</Label>
              <Input
                id="question"
                placeholder="What feature should we build next?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={200}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {question.length}/200 characters
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Provide additional context for voters..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Options</h2>
          
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={option.id} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option.text}
                    onChange={(e) => updateOption(option.id, "text", e.target.value)}
                    maxLength={100}
                  />
                </div>
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(option.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addOption}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Option
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Voting Settings</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tokensPerVote">USDC per Vote *</Label>
                <Input
                  id="tokensPerVote"
                  type="number"
                  step="0.01"
                  placeholder="100"
                  value={tokensPerVote}
                  onChange={(e) => setTokensPerVote(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="winningOptions">Number of Winners *</Label>
                <Input
                  id="winningOptions"
                  type="number"
                  min="1"
                  max={options.length}
                  value={winningOptionsCount}
                  onChange={(e) => setWinningOptionsCount(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date & Time *</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>End Date & Time *</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "Creating..." : "Create Poll"}
          </Button>
        </div>
      </form>
    </div>
  )
}
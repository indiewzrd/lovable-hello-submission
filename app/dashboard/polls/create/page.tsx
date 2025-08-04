import { Suspense } from "react"
import { TypeformStylePollForm } from "@/components/polls/typeform-style-poll-form"

export default function CreatePollPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8">
      <div className="container max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-4">
            Create a New Poll
          </h1>
          <p className="text-xl text-muted-foreground">
            Build engaging polls where your community votes with real funds
          </p>
        </div>
        
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading poll builder...</p>
            </div>
          </div>
        }>
          <TypeformStylePollForm />
        </Suspense>
      </div>
    </div>
  )
}
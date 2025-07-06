import { Suspense } from "react"
import { CreatePollForm } from "@/components/polls/create-poll-form"

export default function CreatePollPage() {
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Poll</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <CreatePollForm />
      </Suspense>
    </div>
  )
}
import { NextResponse } from "next/server"
import { db } from "@/db"
import { polls, projects } from "@/db/schema"
import { desc, eq } from "drizzle-orm"

export async function GET() {
  try {
    // Return empty array if database is not available (during build)
    if (!db || typeof db.select !== 'function') {
      return NextResponse.json([])
    }
    const allPolls = await db
      .select({
        id: polls.id,
        projectId: polls.projectId,
        contractAddress: polls.contractAddress,
        question: polls.question,
        options: polls.options,
        startTime: polls.startTime,
        endTime: polls.endTime,
        tokensPerVote: polls.tokensPerVote,
        winningOptionsCount: polls.winningOptionsCount,
        totalOptionsCount: polls.totalOptionsCount,
        tokenAddress: polls.tokenAddress,
        createdAt: polls.createdAt,
        projectName: projects.name,
        projectDescription: projects.description,
      })
      .from(polls)
      .leftJoin(projects, eq(polls.projectId, projects.id))
      .orderBy(desc(polls.createdAt))

    // Transform the data to match the expected format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedPolls = allPolls.map((poll: any) => ({
      id: poll.id,
      projectId: poll.projectId,
      contractAddress: poll.contractAddress,
      question: poll.question,
      options: poll.options,
      startTime: poll.startTime,
      endTime: poll.endTime,
      tokensPerVote: poll.tokensPerVote,
      winningOptionsCount: poll.winningOptionsCount,
      totalOptionsCount: poll.totalOptionsCount,
      tokenAddress: poll.tokenAddress,
      createdAt: poll.createdAt,
      project: poll.projectName ? {
        name: poll.projectName,
        description: poll.projectDescription
      } : undefined
    }))

    return NextResponse.json(transformedPolls)
  } catch (error) {
    console.error("Error fetching polls:", error)
    return NextResponse.json(
      { error: "Failed to fetch polls" },
      { status: 500 }
    )
  }
}
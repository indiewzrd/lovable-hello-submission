import { NextResponse } from "next/server"
import { db } from "@/db"
import { polls, projects } from "@/db/schema"
import { desc, eq, gt, lte, and } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    // Return empty array if database is not available (during build)
    if (!db || typeof db.select !== 'function') {
      return NextResponse.json([])
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status') // upcoming, active, ended
    // Build query
    let query = db
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
      .$dynamic()
      
    // Apply filters
    if (projectId) {
      query = query.where(eq(polls.projectId, projectId))
    }
    
    // Filter by status
    const now = new Date()
    if (status === 'upcoming') {
      query = query.where(gt(polls.startTime, now))
    } else if (status === 'active') {
      query = query.where(and(
        lte(polls.startTime, now),
        gt(polls.endTime, now)
      ))
    } else if (status === 'ended') {
      query = query.where(lte(polls.endTime, now))
    }
    
    // Execute query
    const allPolls = await query.orderBy(desc(polls.createdAt))

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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { 
      projectId,
      contractAddress,
      question,
      description,
      options,
      startTime,
      endTime,
      tokensPerVote,
      winningOptionsCount,
      totalOptionsCount,
      tokenAddress,
      creatorAddress
    } = body
    
    // Validate required fields
    if (!projectId || !contractAddress || !question || !options) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    
    // Insert poll into database
    const [newPoll] = await db.insert(polls).values({
      projectId,
      contractAddress,
      question,
      description,
      options,
      startTime: new Date(startTime * 1000),
      endTime: new Date(endTime * 1000),
      tokensPerVote: tokensPerVote.toString(),
      winningOptionsCount,
      totalOptionsCount,
      tokenAddress,
      creatorAddress
    }).returning()
    
    return NextResponse.json(newPoll)
  } catch (error) {
    console.error("Error creating poll:", error)
    return NextResponse.json(
      { error: "Failed to create poll" },
      { status: 500 }
    )
  }
}
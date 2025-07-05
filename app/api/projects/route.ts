import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { projects, polls, users } from "@/db/schema"
import { eq, sql } from "drizzle-orm"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const walletAddress = searchParams.get("wallet")

  if (!walletAddress) {
    return NextResponse.json(
      { error: "Wallet address is required" },
      { status: 400 }
    )
  }

  try {
    // Return empty array if database is not available (during build)
    if (!db || typeof db.select !== 'function') {
      return NextResponse.json([])
    }
    // Get projects with aggregated poll stats
    const projectsWithStats = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        createdAt: projects.createdAt,
        walletAddress: users.walletAddress,
        pollCount: sql<number>`count(distinct ${polls.id})::int`.as("poll_count"),
        totalVotes: sql<number>`0`.as("total_votes"), // TODO: Aggregate from blockchain
        totalFunding: sql<number>`0`.as("total_funding") // TODO: Aggregate from blockchain
      })
      .from(projects)
      .innerJoin(users, eq(projects.creatorId, users.id))
      .leftJoin(polls, eq(polls.projectId, projects.id))
      .where(eq(users.walletAddress, walletAddress.toLowerCase()))
      .groupBy(projects.id, users.walletAddress)
      .orderBy(projects.createdAt)

    return NextResponse.json(projectsWithStats)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Return error if database is not available
    if (!db || typeof db.insert !== 'function') {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      )
    }
    const body = await request.json()
    const { name, description, walletAddress } = body

    if (!name || !walletAddress) {
      return NextResponse.json(
        { error: "Name and wallet address are required" },
        { status: 400 }
      )
    }

    // First find or create user
    let user = await db.select().from(users).where(eq(users.walletAddress, walletAddress.toLowerCase())).limit(1)
    if (!user.length) {
      const [newUser] = await db.insert(users).values({
        walletAddress: walletAddress.toLowerCase()
      }).returning()
      user = [newUser]
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    
    const [project] = await db.insert(projects).values({
      name,
      slug,
      description,
      creatorId: user[0].id
    }).returning()

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { polls } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    if (!db) {
      return NextResponse.json([])
    }
    const projectPolls = await db
      .select()
      .from(polls)
      .where(eq(polls.projectId, id))
      .orderBy(desc(polls.createdAt))

    return NextResponse.json(projectPolls)
  } catch (error) {
    console.error("Error fetching project polls:", error)
    return NextResponse.json(
      { error: "Failed to fetch polls" },
      { status: 500 }
    )
  }
}
import { config } from "dotenv"
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { users, projects, polls } from "./schema"

config({ path: ".env.local" })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl && process.env.NODE_ENV === "production") {
  throw new Error("DATABASE_URL is not set")
}

const dbSchema = {
  // tables
  users,
  projects,
  polls
  // relations
}

function initializeDb(url: string) {
  const client = postgres(url, { prepare: false })
  return drizzlePostgres(client, { schema: dbSchema })
}

export const db = databaseUrl ? initializeDb(databaseUrl) : null as any
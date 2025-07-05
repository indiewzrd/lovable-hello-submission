import { config } from "dotenv"
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { users, projects, polls } from "./schema"

config({ path: ".env.local" })

const databaseUrl = process.env.DATABASE_URL

// During build time, we don't need database connection
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                   process.env.NODE_ENV === 'production' && !databaseUrl

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

export const db = databaseUrl && !isBuildTime ? initializeDb(databaseUrl) : null as any
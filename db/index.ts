import { config } from "dotenv"
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { users, projects, polls } from "./schema"

config({ path: ".env.local" })

const databaseUrl = process.env.DATABASE_URL

// During build time, we don't need database connection
// Check if we're in Vercel build environment
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                   process.env.VERCEL_ENV === 'production' && !databaseUrl ||
                   process.env.CI === 'true' && !databaseUrl

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

// Create a dummy db object for build time that won't throw errors
const dummyDb = {
  select: () => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }) }),
  insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
  update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
  delete: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) })
}

export const db = databaseUrl && !isBuildTime ? initializeDb(databaseUrl) : dummyDb as any
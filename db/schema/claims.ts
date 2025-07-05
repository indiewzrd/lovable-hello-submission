import { pgTable, text, timestamp, uuid, primaryKey, integer } from "drizzle-orm/pg-core"
import { polls } from "./polls"
import { users } from "./users"

export const claims = pgTable("claims", {
  pollId: uuid("poll_id").notNull().references(() => polls.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  claimType: text("claim_type").notNull(), // creator, fee, refund
  amount: text("amount").notNull(), // Store as string to handle large numbers
  transactionHash: text("transaction_hash").notNull(),
  blockNumber: integer("block_number"),
  claimedAt: timestamp("claimed_at").defaultNow().notNull()
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.pollId, table.userId, table.claimType] })
  }
})
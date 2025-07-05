import { pgTable, text, timestamp, uuid, integer, primaryKey } from "drizzle-orm/pg-core"
import { polls } from "./polls"
import { users } from "./users"

export const votes = pgTable("votes", {
  pollId: uuid("poll_id").notNull().references(() => polls.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  optionId: integer("option_id").notNull(),
  amount: text("amount").notNull(), // Store as string to handle large numbers
  transactionHash: text("transaction_hash").notNull(),
  blockNumber: integer("block_number"),
  status: text("status").notNull().default("active"), // active, cancelled, refunded
  votedAt: timestamp("voted_at").defaultNow().notNull(),
  cancelledAt: timestamp("cancelled_at"),
  refundedAt: timestamp("refunded_at")
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.pollId, table.userId] })
  }
})
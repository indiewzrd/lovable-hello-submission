import { pgTable, text, timestamp, uuid, integer, boolean, jsonb } from "drizzle-orm/pg-core"
import { projects } from "./projects"

export const polls = pgTable("polls", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id),
  contractAddress: text("contract_address").unique(),
  question: text("question").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  options: jsonb("options").notNull().$type<Array<{
    id: number
    text: string
    description?: string
  }>>(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  tokensPerVote: text("tokens_per_vote").notNull(), // Store as string to handle large numbers
  winningOptionsCount: integer("winning_options_count").notNull(),
  totalOptionsCount: integer("total_options_count").notNull(),
  tokenAddress: text("token_address").notNull(),
  chainId: integer("chain_id").notNull().default(84532), // Base Sepolia
  transactionHash: text("transaction_hash"),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})
import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core"
import { users } from "./users"

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  websiteUrl: text("website_url"),
  twitterUrl: text("twitter_url"),
  discordUrl: text("discord_url"),
  creatorId: uuid("creator_id").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})
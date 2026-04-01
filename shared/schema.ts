import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Chat sessions
export const chatSessions = sqliteTable("chat_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  mode: text("mode").notNull().default("conversational"), // 'conversational' | 'agentic' | 'rag' | 'augmented'
  createdAt: text("created_at").notNull(),
});

// Chat messages
export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull(),
  role: text("role").notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  aiMode: text("ai_mode"), // which AI mode generated this
  sources: text("sources"), // JSON array of source citations
  agentSteps: text("agent_steps"), // JSON array of agent reasoning steps
  createdAt: text("created_at").notNull(),
});

// Knowledge base entries for RAG
export const knowledgeEntries = sqliteTable("knowledge_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category: text("category").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags").notNull(), // JSON array
  source: text("source"),
  lastUpdated: text("last_updated").notNull(),
});

// User financial profile
export const userProfile = sqliteTable("user_profile", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  country: text("country").notNull().default(""),
  annualIncomeAbroad: text("annual_income_abroad").default(""),
  indianIncome: text("indian_income").default(""),
  hasNreAccount: integer("has_nre_account", { mode: "boolean" }).default(false),
  hasNroAccount: integer("has_nro_account", { mode: "boolean" }).default(false),
  hasFcnrAccount: integer("has_fcnr_account", { mode: "boolean" }).default(false),
  hasProperty: integer("has_property", { mode: "boolean" }).default(false),
  hasMutualFunds: integer("has_mutual_funds", { mode: "boolean" }).default(false),
  hasStocks: integer("has_stocks", { mode: "boolean" }).default(false),
  goals: text("goals").default(""), // JSON array
  riskAppetite: text("risk_appetite").default("moderate"), // low | moderate | high
  createdAt: text("created_at").notNull(),
});

// Saved calculations / tools results
export const calculations = sqliteTable("calculations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(), // 'tax_estimate' | 'repatriation' | 'investment_return'
  inputs: text("inputs").notNull(), // JSON
  result: text("result").notNull(), // JSON
  createdAt: text("created_at").notNull(),
});

// Insert schemas
export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({ id: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true });
export const insertKnowledgeEntrySchema = createInsertSchema(knowledgeEntries).omit({ id: true });
export const insertUserProfileSchema = createInsertSchema(userProfile).omit({ id: true });
export const insertCalculationSchema = createInsertSchema(calculations).omit({ id: true });

// Insert types
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertKnowledgeEntry = z.infer<typeof insertKnowledgeEntrySchema>;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type InsertCalculation = z.infer<typeof insertCalculationSchema>;

// Select types
export type ChatSession = typeof chatSessions.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type KnowledgeEntry = typeof knowledgeEntries.$inferSelect;
export type UserProfile = typeof userProfile.$inferSelect;
export type Calculation = typeof calculations.$inferSelect;

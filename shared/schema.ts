import { 
  pgTable, 
  text, 
  serial, 
  integer, 
  boolean, 
  timestamp, 
  doublePrecision, 
  varchar, 
  json 
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Strategies table
export const strategies = pgTable("strategies", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  initialBet: doublePrecision("initial_bet").notNull(),
  maxLosses: integer("max_losses").notNull(),
  betType: text("bet_type").notNull(),
  targetProfit: doublePrecision("target_profit").notNull(),
  stopLoss: doublePrecision("stop_loss").notNull(),
  sessionDuration: integer("session_duration").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Strategy validation schema for API
export const strategySchema = z.object({
  id: z.number().optional(),
  type: z.enum(["martingala", "fibonacci", "dalembert", "custom"]),
  initialBet: z.number().min(1, "Initial bet must be at least 1"),
  maxLosses: z.number().min(1, "Max losses must be at least 1"),
  betType: z.enum(["color", "evenOdd"]),
  targetProfit: z.number().min(1, "Target profit must be at least 1"),
  stopLoss: z.number().min(1, "Stop loss must be at least 1"),
  sessionDuration: z.number().min(5, "Session duration must be at least 5 minutes"),
  createdAt: z.string().optional(),
});

export const insertStrategySchema = createInsertSchema(strategies).omit({
  id: true,
  createdAt: true,
});

export type InsertStrategy = z.infer<typeof insertStrategySchema>;
export type Strategy = z.infer<typeof strategySchema>;

// Game results table
export const gameResults = pgTable("game_results", {
  id: serial("id").primaryKey(),
  time: text("time").notNull(),
  number: integer("number").notNull(),
  color: text("color").notNull(),
  betType: text("bet_type").notNull(),
  betAmount: doublePrecision("bet_amount").notNull(),
  outcome: text("outcome").notNull(),
  profit: doublePrecision("profit"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameResultSchema = z.object({
  id: z.number().optional(),
  time: z.string(),
  number: z.number().min(0).max(36),
  color: z.enum(["Red", "Black", "Green"]),
  betType: z.string(),
  betAmount: z.number().min(0),
  outcome: z.enum(["Win", "Loss"]),
  profit: z.number().optional(),
});

export type GameResult = z.infer<typeof gameResultSchema>;

// Bot logs table
export const botLogs = pgTable("bot_logs", {
  id: serial("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const botLogSchema = z.object({
  id: z.number().optional(),
  timestamp: z.string(),
  type: z.string(),
  message: z.string(),
});

export type BotLog = z.infer<typeof botLogSchema>;

// AI insights table
export const aiInsights = pgTable("ai_insights", {
  id: serial("id").primaryKey(),
  strategyAnalysis: text("strategy_analysis").notNull(),
  riskAssessment: text("risk_assessment").notNull(),
  trendDetection: text("trend_detection").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiInsightSchema = z.object({
  id: z.number().optional(),
  strategyAnalysis: z.string(),
  riskAssessment: z.string(),
  trendDetection: z.string(),
  createdAt: z.string().optional(),
});

export type AIInsight = z.infer<typeof aiInsightSchema>;

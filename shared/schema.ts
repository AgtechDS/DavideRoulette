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
  name: z.string().optional(),
  type: z.enum(["martingala", "fibonacci", "dalembert", "custom"]),
  initialBet: z.number().min(1, "Initial bet must be at least 1"),
  maxLosses: z.number().min(1, "Max losses must be at least 1"),
  betType: z.enum(["color", "evenOdd", "dozen"]).default("color"),
  targetProfit: z.number().min(1, "Target profit must be at least 1"),
  stopLoss: z.number().min(1, "Stop loss must be at least 1"),
  sessionDuration: z.number().min(5, "Session duration must be at least 5 minutes"),
  
  // Advanced settings for Roulette Speed LIVE
  gameMode: z.enum(["standard", "speed_live"]).default("standard").optional(),
  automaticMode: z.boolean().default(false).optional(),
  targetDozen: z.enum(["first", "second", "third"]).optional(),
  entryCondition: z.number().min(1).default(3).optional(),
  maxConsecutiveBets: z.number().min(1).default(17).optional(),
  resetStrategy: z.enum(["after_win", "after_loss", "manual"]).default("after_win").optional(),
  
  // Multi-account options
  multiAccountMode: z.boolean().default(false).optional(),
  accountCount: z.number().min(1).max(10).default(1).optional(),
  accounts: z.array(z.object({
    id: z.string(),
    username: z.string().optional(),
    password: z.string().optional()
  })).optional(),
  
  // Alarm settings
  alarmEnabled: z.boolean().default(false).optional(),
  alarmChannel: z.enum(["email", "telegram", "log"]).default("log").optional(),
  alarmContactInfo: z.string().optional(),
  
  // AI Analysis
  useAIAnalysis: z.boolean().default(false).optional(),
  datasetImported: z.boolean().default(false).optional(),
  
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
  recommendedAdjustments: text("recommended_adjustments"),
  lastUpdated: text("last_updated"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiInsightSchema = z.object({
  id: z.number().optional(),
  strategyAnalysis: z.string(),
  riskAssessment: z.string(),
  trendDetection: z.string(),
  recommendedAdjustments: z.string().optional(),
  lastUpdated: z.string().optional(),
  createdAt: z.string().optional(),
});

export type AIInsight = z.infer<typeof aiInsightSchema>;

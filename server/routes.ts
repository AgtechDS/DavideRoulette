import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { sikulixBot } from "./sikulix";
import { botLogSchema, gameResultSchema, strategySchema } from "@shared/schema";
import OpenAI from "openai";

// Initialize OpenAI
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "sk-demo-key"
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // ----- Strategy Endpoints -----
  
  // Get current strategy
  app.get("/api/strategy/current", (req, res) => {
    const strategy = storage.getCurrentStrategy();
    res.json(strategy);
  });

  // Get all strategies
  app.get("/api/strategy", (req, res) => {
    const strategies = storage.getStrategies();
    res.json({ strategies });
  });

  // Save a strategy
  app.post("/api/strategy", async (req, res) => {
    try {
      const validatedData = strategySchema.parse(req.body);
      const strategy = await storage.saveStrategy(validatedData);
      res.json(strategy);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // ----- Bot Control Endpoints -----
  
  // Get bot status
  app.get("/api/bot/status", (req, res) => {
    const status = sikulixBot.getStatus();
    res.json({
      active: status.active,
      strategy: status.strategy,
      startTime: status.active ? new Date().toISOString() : null,
      currentSession: storage.getCurrentSession()
    });
  });

  // Start bot
  app.post("/api/bot/start", async (req, res) => {
    try {
      const validatedData = strategySchema.parse(req.body);
      
      // Save strategy if it's new
      await storage.saveStrategy(validatedData);
      
      // Start the bot
      await sikulixBot.start(validatedData);
      
      // Initialize a new session
      storage.startNewSession();
      
      res.json({ success: true, message: "Bot started successfully" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Stop bot
  app.post("/api/bot/stop", async (req, res) => {
    try {
      await sikulixBot.stop();
      res.json({ success: true, message: "Bot stopped successfully" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get bot logs
  app.get("/api/bot/logs", (req, res) => {
    const logs = sikulixBot.getLogs().map((log, index) => ({
      id: index,
      ...log
    }));
    res.json({ logs });
  });

  // Export bot logs
  app.get("/api/bot/logs/export", (req, res) => {
    const logs = sikulixBot.getLogs();
    const formattedLogs = logs.map(log => `[${log.timestamp}] [${log.type}] ${log.message}`).join('\n');
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=bot-logs.txt');
    res.send(formattedLogs);
  });

  // Clear bot logs
  app.delete("/api/bot/logs", (req, res) => {
    sikulixBot.clearLogs();
    res.json({ success: true, message: "Logs cleared successfully" });
  });

  // ----- Game Results Endpoints -----
  
  // Get game results with pagination
  app.get("/api/results", (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    
    const results = storage.getGameResults(page, limit);
    const total = storage.getGameResultsCount();
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        startIndex: (page - 1) * limit + 1,
        endIndex: Math.min(page * limit, total)
      }
    });
  });

  // Export game results
  app.get("/api/results/export", (req, res) => {
    const results = storage.getAllGameResults();
    
    // Format as CSV
    const header = "Time,Number,Color,Bet Type,Bet Amount,Outcome,Profit\n";
    const rows = results.map(r => 
      `${r.time},${r.number},${r.color},${r.betType},${r.betAmount},${r.outcome},${r.profit || ''}`
    ).join('\n');
    
    const csv = header + rows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=game-results.csv');
    res.send(csv);
  });

  // ----- Stats Endpoints -----
  
  // Get dashboard stats
  app.get("/api/stats", (req, res) => {
    const stats = storage.getStats();
    res.json(stats);
  });

  // Get performance chart data
  app.get("/api/performance", (req, res) => {
    const timeRange = (req.query.timeRange as string) || 'day';
    const performanceData = storage.getPerformanceData(timeRange);
    res.json(performanceData);
  });

  // ----- AI Analysis Endpoints -----
  
  // Get AI insights
  app.get("/api/ai/insights", async (req, res) => {
    try {
      const insights = await storage.getAIInsights();
      
      if (!insights) {
        // Generate initial insights if none exist
        const gameResults = storage.getAllGameResults();
        const currentStrategy = storage.getCurrentStrategy();
        
        if (gameResults.length > 0 && currentStrategy) {
          const newInsights = await generateAIInsights(gameResults, currentStrategy);
          await storage.saveAIInsights(newInsights);
          res.json(newInsights);
        } else {
          res.status(404).json({ message: "Not enough data for insights" });
        }
      } else {
        res.json(insights);
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Request full AI analysis
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const gameResults = storage.getAllGameResults();
      const currentStrategy = storage.getCurrentStrategy();
      
      if (gameResults.length === 0 || !currentStrategy) {
        res.status(400).json({ message: "Not enough data for analysis" });
        return;
      }
      
      // Generate new insights
      const insights = await generateAIInsights(gameResults, currentStrategy);
      await storage.saveAIInsights(insights);
      
      res.json({ success: true, message: "Analysis completed" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Setup event listeners for the bot
  sikulixBot.on('result', async (result) => {
    const gameResult = {
      id: storage.getNextGameResultId(),
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      number: result.number,
      color: result.color,
      betType: result.betType,
      betAmount: result.betAmount,
      outcome: result.outcome,
      profit: result.outcome === 'Win' ? result.profit : undefined
    };
    
    await storage.addGameResult(gameResult);
    await storage.updateSession(gameResult);
  });

  return httpServer;
}

// Helper function to generate AI insights
async function generateAIInsights(gameResults, currentStrategy) {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant specialized in roulette strategy analysis. Analyze the provided game results and current strategy to provide insights. Return JSON with three fields: strategyAnalysis, riskAssessment, and trendDetection. Keep each insight under 100 words."
        },
        {
          role: "user",
          content: JSON.stringify({
            gameResults: gameResults.slice(-50), // Last 50 results
            currentStrategy
          })
        }
      ],
      response_format: { type: "json_object" }
    });

    const insights = JSON.parse(response.choices[0].message.content);
    
    return {
      ...insights,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error generating AI insights:", error);
    
    // Fallback insights if API fails
    return {
      strategyAnalysis: "Unable to generate strategy analysis at this time.",
      riskAssessment: "Risk assessment is currently unavailable.",
      trendDetection: "Trend detection is currently unavailable.",
      lastUpdated: new Date().toISOString()
    };
  }
}

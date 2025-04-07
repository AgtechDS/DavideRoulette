import { 
  users, 
  strategies, 
  gameResults, 
  botLogs, 
  aiInsights, 
  type User, 
  type InsertUser,
  type Strategy,
  type GameResult,
  type BotLog,
  type AIInsight
} from "@shared/schema";

// Storage interface with all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Strategy operations
  saveStrategy(strategy: Strategy): Promise<Strategy>;
  getStrategy(id: number): Promise<Strategy | undefined>;
  getStrategies(): Promise<Strategy[]>;
  getCurrentStrategy(): Strategy | null;
  
  // Game result operations
  addGameResult(result: GameResult): Promise<GameResult>;
  getGameResults(page: number, limit: number): GameResult[];
  getGameResultsCount(): number;
  getAllGameResults(): GameResult[];
  getNextGameResultId(): number;
  
  // Session operations
  startNewSession(): void;
  updateSession(result: GameResult): void;
  getCurrentSession(): any;
  
  // AI insights operations
  saveAIInsights(insights: AIInsight): Promise<AIInsight>;
  getAIInsights(): Promise<AIInsight | null>;
  
  // Stats operations
  getStats(): any;
  getPerformanceData(timeRange: string): any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private strategiesMap: Map<number, Strategy>;
  private gameResultsArray: GameResult[];
  private botLogsArray: BotLog[];
  private currentAIInsights: AIInsight | null;
  private currentStrategyId: number | null;
  private session: {
    startTime: Date;
    bets: number;
    wins: number;
    losses: number;
    profit: number;
    initialBalance: number;
    currentBalance: number;
    history: Array<{ time: string; balance: number }>;
  };
  
  currentId: number;
  currentStrategyIds: number;
  currentGameResultIds: number;
  currentBotLogIds: number;

  constructor() {
    // Initialize storage collections
    this.users = new Map();
    this.strategiesMap = new Map();
    this.gameResultsArray = [];
    this.botLogsArray = [];
    this.currentAIInsights = null;
    this.currentStrategyId = null;
    
    // Initialize counters
    this.currentId = 1;
    this.currentStrategyIds = 1;
    this.currentGameResultIds = 1;
    this.currentBotLogIds = 1;
    
    // Initialize session
    this.resetSession();
    
    // Add sample strategies
    this.initialSetup();
  }

  // Initialize with sample data
  private initialSetup() {
    // Add a default Martingala strategy
    const martingala: Strategy = {
      id: this.currentStrategyIds++,
      type: "martingala",
      initialBet: 5,
      maxLosses: 6,
      betType: "color",
      targetProfit: 100,
      stopLoss: 50,
      sessionDuration: 60,
      createdAt: new Date().toISOString()
    };
    
    this.strategiesMap.set(martingala.id, martingala);
    this.currentStrategyId = martingala.id;
  }

  private resetSession() {
    this.session = {
      startTime: new Date(),
      bets: 0,
      wins: 0,
      losses: 0,
      profit: 0,
      initialBalance: 100, // Start with €100
      currentBalance: 100,
      history: [{ 
        time: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        }), 
        balance: 100 
      }]
    };
  }

  // ----- User Methods -----
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // ----- Strategy Methods -----
  
  async saveStrategy(strategy: Strategy): Promise<Strategy> {
    const id = strategy.id || this.currentStrategyIds++;
    const newStrategy: Strategy = { 
      ...strategy, 
      id, 
      createdAt: strategy.createdAt || new Date().toISOString() 
    };
    
    this.strategiesMap.set(id, newStrategy);
    this.currentStrategyId = id;
    
    return newStrategy;
  }
  
  async getStrategy(id: number): Promise<Strategy | undefined> {
    return this.strategiesMap.get(id);
  }
  
  async getStrategies(): Promise<Strategy[]> {
    return Array.from(this.strategiesMap.values());
  }
  
  getCurrentStrategy(): Strategy | null {
    if (this.currentStrategyId === null) return null;
    return this.strategiesMap.get(this.currentStrategyId) || null;
  }
  
  // ----- Game Result Methods -----
  
  async addGameResult(result: GameResult): Promise<GameResult> {
    const id = result.id || this.currentGameResultIds++;
    const newResult: GameResult = { ...result, id };
    
    this.gameResultsArray.push(newResult);
    
    return newResult;
  }
  
  getGameResults(page: number, limit: number): GameResult[] {
    const startIdx = (page - 1) * limit;
    const endIdx = startIdx + limit;
    
    // Sort by most recent first
    return [...this.gameResultsArray]
      .sort((a, b) => b.id - a.id)
      .slice(startIdx, endIdx);
  }
  
  getGameResultsCount(): number {
    return this.gameResultsArray.length;
  }
  
  getAllGameResults(): GameResult[] {
    return [...this.gameResultsArray];
  }
  
  getNextGameResultId(): number {
    return this.currentGameResultIds;
  }
  
  // ----- Session Methods -----
  
  startNewSession(): void {
    this.resetSession();
  }
  
  updateSession(result: GameResult): void {
    this.session.bets++;
    
    if (result.outcome === 'Win') {
      this.session.wins++;
      this.session.profit += (result.profit || 0);
      this.session.currentBalance += (result.profit || 0);
    } else {
      this.session.losses++;
      this.session.profit -= result.betAmount;
      this.session.currentBalance -= result.betAmount;
    }
    
    // Add to balance history
    this.session.history.push({
      time: result.time,
      balance: this.session.currentBalance
    });
    
    // Keep history size reasonable
    if (this.session.history.length > 100) {
      this.session.history.shift();
    }
  }
  
  getCurrentSession(): any {
    return {
      bets: this.session.bets,
      wins: this.session.wins,
      losses: this.session.losses,
      profit: this.session.profit,
      startTime: this.session.startTime,
      currentBalance: this.session.currentBalance
    };
  }
  
  // ----- AI Insights Methods -----
  
  async saveAIInsights(insights: AIInsight): Promise<AIInsight> {
    this.currentAIInsights = {
      ...insights,
      id: 1, // Always use ID 1 for the current insights
      createdAt: new Date().toISOString()
    };
    
    return this.currentAIInsights;
  }
  
  async getAIInsights(): Promise<AIInsight | null> {
    return this.currentAIInsights;
  }
  
  // ----- Stats Methods -----
  
  getStats(): any {
    const strategy = this.getCurrentStrategy();
    const session = this.getCurrentSession();
    
    // Calculate win rate
    const winRate = session.bets > 0 
      ? (session.wins / session.bets) * 100 
      : 0;
    
    // Calculate time since session start
    const now = new Date();
    const sessionDuration = Math.floor((now.getTime() - this.session.startTime.getTime()) / 1000 / 60);
    const hours = Math.floor(sessionDuration / 60);
    const minutes = sessionDuration % 60;
    
    return {
      totalWins: session.profit > 0 ? session.profit : 0,
      winPercentChange: 0, // Would calculate from historical data
      lastUpdate: 'Last update: ' + new Date().toLocaleTimeString(),
      totalBets: session.bets,
      activePeriod: `Active for: ${hours}h ${minutes}m`,
      winRate: winRate,
      winRateChange: 0, // Would calculate from historical data
      benchmark: 48.6, // Theoretical roulette win rate
      currentStrategy: strategy?.type || 'None',
      botActive: false, // Updated from bot status
      strategyDuration: `Running for: ${hours}h ${minutes}m`
    };
  }
  
  getPerformanceData(timeRange: string): any {
    // For demo, just return the session history
    return {
      chartData: this.session.history,
      startingBalance: this.session.initialBalance,
      currentBalance: this.session.currentBalance
    };
  }
}

export const storage = new MemStorage();

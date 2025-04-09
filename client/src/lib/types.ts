// Strategy definition
export interface Strategy {
  id?: number;
  name?: string;
  type: "martingala" | "fibonacci" | "dalembert" | "custom";
  initialBet: number;
  maxLosses: number;
  betType: "color" | "evenOdd" | "dozen";
  targetProfit: number;
  stopLoss: number;
  sessionDuration: number;
  createdAt?: string;
  
  // Advanced settings for Roulette Speed LIVE
  gameMode?: "standard" | "speed_live";
  automaticMode?: boolean;
  targetDozen?: "first" | "second" | "third";
  entryCondition?: number;
  maxConsecutiveBets?: number;
  resetStrategy?: "after_win" | "after_loss" | "manual";
  
  // Multi-account options
  multiAccountMode?: boolean;
  accountCount?: number;
  accounts?: Array<{
    id: string;
    username?: string;
    password?: string;
  }>;
  
  // Alarm settings
  alarmEnabled?: boolean;
  alarmChannel?: "email" | "telegram" | "log";
  alarmContactInfo?: string;
  
  // AI Analysis
  useAIAnalysis?: boolean;
  datasetImported?: boolean;
}

// Bot status
export interface BotStatus {
  active: boolean;
  strategy: Strategy | null;
  startTime?: string;
  currentSession?: {
    bets: number;
    wins: number;
    losses: number;
    profit: number;
  };
}

// Game result
export interface GameResult {
  id: number;
  time: string;
  number: number;
  color: 'Red' | 'Black' | 'Green';
  betType: string;
  betAmount: number;
  outcome: 'Win' | 'Loss';
  profit?: number;
}

// Bot log entry
export interface LogEntry {
  id: number;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

// Stats summary
export interface Stats {
  totalWins: number;
  winPercentChange: number;
  lastUpdate: string;
  totalBets: number;
  activePeriod: string;
  winRate: number;
  winRateChange: number;
  benchmark: number;
  currentStrategy: string;
  botActive: boolean;
  strategyDuration: string;
}

// Performance chart data
export interface PerformanceData {
  chartData: Array<{
    time: string;
    balance: number;
  }>;
  startingBalance: number;
  currentBalance: number;
}

// AI insights
export interface AIInsights {
  strategyAnalysis: string;
  riskAssessment: string;
  trendDetection: string;
  lastUpdated: string;
}

// Pagination response
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
}

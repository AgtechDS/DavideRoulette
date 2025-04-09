export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

export interface Strategy {
  id?: number;
  type: string;
  name?: string;
  description?: string;
  initialBet: number;
  maxBet: number;
  stopLoss: number;
  targetProfit: number;
  betType: string;
  betValue: string;
  stop?: boolean;
}

export interface GameResult {
  id?: number;
  number: number;
  color: string;
  isEven: boolean;
  betAmount: number;
  betType: string;
  betValue: string;
  outcome: 'Win' | 'Loss';
  profit: number;
  timestamp: string;
  strategyType: string;
}

export interface AIInsight {
  strategyAnalysis: string;
  riskAssessment: string;
  trendDetection: string;
  recommendedAdjustments: string;
  lastUpdated: string;
}

export interface BotStatus {
  status: 'inactive' | 'active' | 'starting' | 'stopping';
  strategy: Strategy | null;
  startTime: string | null;
  error: string | null;
  results?: GameResult[];
  balance?: number;
  profit?: number;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
}

export interface ButtonConfig {
  id: string;
  name: string;
  pressInterval: number;
  pressCount: number;
  targetArea: string;
  coordinates: { x: number; y: number };
  pressPattern: 'sequential' | 'random' | 'alternating';
  waitBetweenPress: number;
  stopOnWin: boolean;
  linkedToStrategy: boolean;
  selectedStrategy: string;
  createdAt: string;
}
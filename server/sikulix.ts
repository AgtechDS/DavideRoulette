/**
 * SikuliX integration module
 * 
 * This module provides functionality to interact with the SikuliX automation tool
 * which uses image recognition to automate interactions with a Casino's Java application.
 */

import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';
import { Strategy } from '@shared/schema';
import { fileURLToPath } from 'url';
import * as path from 'path';

// Ottieni il percorso corrente usando il modulo ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SikulixBot extends EventEmitter {
  private process: ChildProcess | null = null;
  private running: boolean = false;
  private strategy: Strategy | null = null;
  private logs: Array<{ timestamp: string; type: string; message: string }> = [];
  private lastResult: { number: number; color: string; isEven: boolean } | null = null;
  private simulationInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    super();
  }
  
  /**
   * Start the SikuliX bot with the given strategy
   */
  async start(strategy: Strategy): Promise<boolean> {
    if (this.running) {
      throw new Error('Bot is already running');
    }
    
    try {
      this.running = true;
      this.strategy = strategy;
      
      this.addLog('info', `Starting SikuliX bot with ${strategy.type} strategy`);
      this.addLog('info', `Target: ${strategy.betType}, Initial bet: ${strategy.initialBet}`);
      
      // In a real implementation, this would launch the SikuliX process
      // For demo purposes, we'll simulate the bot's behavior
      this.simulateBotProcess();
      
      return true;
    } catch (error) {
      this.addLog('error', `Failed to start bot: ${error instanceof Error ? error.message : String(error)}`);
      this.running = false;
      this.strategy = null;
      return false;
    }
  }
  
  /**
   * Stop the SikuliX bot
   */
  async stop(): Promise<boolean> {
    if (!this.running) {
      return true; // Already stopped
    }
    
    try {
      this.addLog('info', 'Stopping bot');
      
      if (this.simulationInterval) {
        clearInterval(this.simulationInterval);
        this.simulationInterval = null;
      }
      
      if (this.process) {
        // In a real implementation, this would terminate the process
        this.process.kill();
        this.process = null;
      }
      
      this.running = false;
      this.addLog('success', 'Bot stopped successfully');
      
      return true;
    } catch (error) {
      this.addLog('error', `Failed to stop bot: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Get the current status of the bot
   */
  getStatus(): { active: boolean; strategy: Strategy | null } {
    return {
      active: this.running,
      strategy: this.strategy
    };
  }
  
  /**
   * Get all logs
   */
  getLogs(): Array<{ timestamp: string; type: string; message: string }> {
    return this.logs;
  }
  
  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }
  
  /**
   * Add a log entry
   */
  addLog(type: string, message: string): void {
    const log = {
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      type,
      message
    };
    
    this.logs.push(log);
    this.emit('log', log);
  }
  
  /**
   * Simulate the bot process for demo purposes
   */
  private simulateBotProcess(): void {
    const strategy = this.strategy;
    if (!strategy) return;
    
    let currentBet = strategy.initialBet;
    let consecutiveLosses = 0;
    let round = 0;
    
    // Simulate rounds every few seconds
    this.simulationInterval = setInterval(() => {
      round++;
      if (round > 25 || (strategy.maxBets && round >= strategy.maxBets)) {
        // Automatically stop after a set number of rounds
        this.stop();
        return;
      }
      
      this.addLog('info', `Round ${round}: Placing bet of ${currentBet}€ on ${strategy.betType}`);
      
      // Generate random result
      setTimeout(() => {
        const result = this.generateRandomResult();
        this.lastResult = result;
        
        this.addLog('info', `Result: ${result.number} (${result.color})`);
        
        // Determine if bet won
        const won = this.checkWin(result, strategy);
        
        if (won) {
          const profit = this.calculateProfit(currentBet, strategy.betType);
          this.addLog('success', `Win! Profit: ${profit}€`);
          
          // Reset consecutive losses
          consecutiveLosses = 0;
          
          // Report result to listeners
          this.emit('result', {
            number: result.number,
            color: result.color,
            betType: strategy.betType,
            betAmount: currentBet,
            outcome: 'Win',
            profit
          });
          
          // Reset bet amount based on strategy
          currentBet = strategy.initialBet;
        } else {
          this.addLog('warn', `Loss! -${currentBet}€`);
          consecutiveLosses++;
          
          // Report result to listeners
          this.emit('result', {
            number: result.number,
            color: result.color,
            betType: strategy.betType,
            betAmount: currentBet,
            outcome: 'Loss'
          });
          
          // Increase bet amount based on strategy
          if (strategy.type === 'martingala') {
            currentBet = currentBet * 2;
          } else if (strategy.type === 'fibonacci') {
            // Simple Fibonacci implementation for demo
            if (consecutiveLosses <= 1) {
              currentBet = strategy.initialBet;
            } else if (consecutiveLosses === 2) {
              currentBet = strategy.initialBet * 2;
            } else if (consecutiveLosses === 3) {
              currentBet = strategy.initialBet * 3;
            } else if (consecutiveLosses === 4) {
              currentBet = strategy.initialBet * 5;
            } else {
              currentBet = strategy.initialBet * 8;
            }
          } else if (strategy.type === 'dalembert') {
            currentBet = currentBet + strategy.initialBet;
          }
        }
        
        // Check if we need to stop due to consecutive losses
        if (strategy.maxLosses && consecutiveLosses >= strategy.maxLosses) {
          this.addLog('error', `Maximum consecutive losses (${strategy.maxLosses}) reached. Stopping bot.`);
          this.stop();
        }
      }, 1500); // Simulate a delay for the wheel to spin
      
    }, 5000); // Each round happens every 5 seconds
  }
  
  /**
   * Generate a random roulette result
   */
  private generateRandomResult(): { number: number; color: string; isEven: boolean } {
    const number = Math.floor(Math.random() * 37); // 0-36
    
    // Determine color based on number
    let color = "Green"; // Default for 0
    if (number > 0) {
      // Red numbers: 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
      if ([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(number)) {
        color = "Red";
      } else {
        color = "Black";
      }
    }
    
    return { 
      number, 
      color,
      isEven: number > 0 && number % 2 === 0
    };
  }
  
  /**
   * Check if the bet won based on the result and strategy
   */
  private checkWin(result: { number: number; color: string; isEven: boolean }, strategy: Strategy): boolean {
    switch (strategy.betType) {
      case 'color':
        return (strategy.targetColor === 'red' && result.color === 'Red') ||
               (strategy.targetColor === 'black' && result.color === 'Black');
      
      case 'evenOdd':
        return (strategy.targetEvenOdd === 'even' && result.isEven) ||
               (strategy.targetEvenOdd === 'odd' && !result.isEven && result.number > 0);
      
      case 'dozen':
        if (strategy.targetDozen === 'first') {
          return result.number >= 1 && result.number <= 12;
        } else if (strategy.targetDozen === 'second') {
          return result.number >= 13 && result.number <= 24;
        } else if (strategy.targetDozen === 'third') {
          return result.number >= 25 && result.number <= 36;
        }
        return false;
      
      default:
        return false;
    }
  }
  
  /**
   * Calculate the next bet amount based on the strategy
   */
  private calculateNextBet(): number {
    if (!this.strategy) return 0;
    
    return this.strategy.initialBet;
  }
  
  /**
   * Calculate profit based on bet type and amount
   */
  private calculateProfit(betAmount: number, betType: string): number {
    switch (betType) {
      case 'color':
      case 'evenOdd':
        return betAmount; // 1:1 payout
      
      case 'dozen':
        return betAmount * 2; // 2:1 payout
      
      default:
        return betAmount;
    }
  }
}

export const sikulixBot = new SikulixBot();
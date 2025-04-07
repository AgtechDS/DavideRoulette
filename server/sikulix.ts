/**
 * SikuliX integration module
 * 
 * This module provides functionality to interact with the SikuliX automation tool
 * which uses image recognition to automate interactions with a Casino's Java application.
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import { Strategy } from '@shared/schema';

class SikulixBot extends EventEmitter {
  private process: ChildProcess | null = null;
  private running: boolean = false;
  private strategy: Strategy | null = null;
  private logs: Array<{ timestamp: string; type: string; message: string }> = [];
  private lastResult: { number: number; color: string; isEven: boolean } | null = null;

  constructor() {
    super();
    this.addLog('info', 'SikuliX bot initialized. Ready to start.');
  }

  /**
   * Start the SikuliX bot with the given strategy
   */
  async start(strategy: Strategy): Promise<boolean> {
    if (this.running) {
      throw new Error('Bot is already running');
    }

    this.strategy = strategy;
    this.running = true;

    this.addLog('info', `Starting bot with ${strategy.type} strategy`);
    this.addLog('info', `Initial bet: €${strategy.initialBet.toFixed(2)}`);
    this.addLog('info', `Bet type: ${strategy.betType}`);

    try {
      // In a real implementation, this would start the SikuliX process
      // For demo purposes, we'll simulate the process
      this.simulateBotProcess();
      
      this.emit('started', {
        strategy: this.strategy,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error: unknown) {
      this.running = false;
      this.strategy = null;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.addLog('error', `Failed to start bot: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Stop the SikuliX bot
   */
  async stop(): Promise<boolean> {
    if (!this.running) {
      throw new Error('Bot is not running');
    }

    this.addLog('info', 'Stopping bot...');

    try {
      // In a real implementation, this would terminate the SikuliX process
      if (this.process) {
        this.process.kill();
        this.process = null;
      }
      
      this.running = false;
      
      this.emit('stopped', {
        timestamp: new Date().toISOString()
      });
      
      this.addLog('info', 'Bot stopped successfully');
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.addLog('error', `Error stopping bot: ${errorMessage}`);
      throw error;
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
    this.addLog('info', 'Logs cleared');
  }

  /**
   * Add a log entry
   */
  addLog(type: string, message: string): void {
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    this.logs.push({ timestamp, type, message });
    
    // Keep log size reasonable
    if (this.logs.length > 1000) {
      this.logs.shift();
    }
    
    this.emit('log', { timestamp, type, message });
  }

  /**
   * Simulate the bot process for demo purposes
   */
  private simulateBotProcess(): void {
    // This simulates what would be a real SikuliX process
    const interval = setInterval(() => {
      if (!this.running) {
        clearInterval(interval);
        return;
      }

      // Simulate bet placement
      const betAmount = this.calculateNextBet();
      let betChoice: string;
      
      if (this.strategy?.betType === 'color') {
        betChoice = Math.random() > 0.5 ? 'Red' : 'Black';
      } else {
        // For evenOdd strategy
        betChoice = Math.random() > 0.5 ? 'Even' : 'Odd';
      }
      
      this.addLog('info', `Bot placed bet: €${betAmount.toFixed(2)} on ${betChoice}`);

      // Simulate result after a delay
      setTimeout(() => {
        if (!this.running) return;

        // Generate a random roulette result
        const number = Math.floor(Math.random() * 37); // 0-36
        const isEven = number > 0 && number % 2 === 0;
        let color = 'Black';
        
        if (number === 0) {
          color = 'Green';
        } else if ([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(number)) {
          color = 'Red';
        }

        this.lastResult = { number, color, isEven };
        this.addLog('info', `Result detected: ${number} (${color})`);

        // Determine win/loss
        let win = false;
        if (this.strategy?.betType === 'color') {
          win = (betChoice === color);
        } else if (this.strategy?.betType === 'evenOdd') {
          // For even/odd bets, we determine if bet was on even or odd from betChoice
          const betOnEven = betChoice === 'Even';
          win = (betOnEven === isEven) && number !== 0;
        }

        if (win) {
          this.addLog('success', `Bet won. Resetting to initial bet amount.`);
          this.emit('result', {
            number,
            color,
            betAmount,
            betType: this.strategy?.betType === 'color' ? `Color (${betChoice})` : `${betChoice}`,
            outcome: 'Win',
            profit: betAmount,
            timestamp: new Date().toISOString()
          });
        } else {
          this.addLog('warning', `Bet lost. Applying ${this.strategy?.type} progression.`);
          this.emit('result', {
            number,
            color,
            betAmount,
            betType: this.strategy?.betType === 'color' ? `Color (${betChoice})` : `${betChoice}`,
            outcome: 'Loss',
            timestamp: new Date().toISOString()
          });
        }
      }, 2000); // 2 seconds delay for result
    }, 5000); // New bet every 5 seconds
  }

  /**
   * Calculate the next bet amount based on the strategy
   */
  private calculateNextBet(): number {
    if (!this.strategy) return 0;
    
    // For demo, just return the initial bet
    // In a real implementation, this would apply the strategy logic
    return this.strategy.initialBet;
  }
}

// Export singleton instance
export const sikulixBot = new SikulixBot();

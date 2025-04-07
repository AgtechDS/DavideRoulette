/**
 * SikuliX Connector Module
 * 
 * This module provides the interface between our application and the SikuliX bot.
 * It handles:
 * - Launching the SikuliX process with appropriate parameters
 * - Sending strategy configuration to the bot
 * - Receiving and processing results and logs from the bot
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';
import { Strategy } from '@shared/schema';
import { sikulixBot } from './sikulix';
import { storage } from './storage';

class SikuliXConnector extends EventEmitter {
  private sikulixProcess: ChildProcess | null = null;
  private running: boolean = false;
  private casinoUsername: string = '';
  private casinoPassword: string = '';
  
  constructor() {
    super();
    
    // Get casino credentials from environment variables (for security)
    this.casinoUsername = process.env.CASINO_USERNAME || '';
    this.casinoPassword = process.env.CASINO_PASSWORD || '';
    
    if (!this.casinoUsername || !this.casinoPassword) {
      console.warn('Warning: Casino credentials not set in environment variables');
    }
  }
  
  /**
   * Start the SikuliX bot with the provided strategy
   */
  async startBot(strategy: Strategy): Promise<boolean> {
    if (this.running) {
      throw new Error('Bot is already running');
    }
    
    try {
      // In this demo, we'll delegate to the sikulixBot simulation
      // In a production environment, we would launch the actual SikuliX process here
      
      const result = await sikulixBot.start(strategy);
      this.running = true;
      
      // Add event listeners to propagate bot events
      this.setupEventListeners();
      
      return result;
    } catch (error) {
      console.error('Failed to start SikuliX bot:', error);
      throw error;
    }
  }
  
  /**
   * Stop the SikuliX bot
   */
  async stopBot(): Promise<boolean> {
    if (!this.running) {
      throw new Error('Bot is not running');
    }
    
    try {
      // In this demo, we'll delegate to the sikulixBot simulation
      // In a production environment, we would terminate the SikuliX process
      
      const result = await sikulixBot.stop();
      this.running = false;
      
      return result;
    } catch (error) {
      console.error('Failed to stop SikuliX bot:', error);
      throw error;
    }
  }
  
  /**
   * Set up event listeners for bot events
   */
  private setupEventListeners() {
    // Handle game results
    sikulixBot.on('result', async (result) => {
      // Format and store the result
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
      
      // Store in database
      await storage.addGameResult(gameResult);
      await storage.updateSession(gameResult);
      
      // Emit our own events for the server to handle
      this.emit('result', gameResult);
    });
  }
  
  /**
   * In a real implementation, this method would launch the SikuliX process
   * with the PlanetWin365Bot.js script
   */
  private launchSikuliXProcess(strategy: Strategy): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // Verify that SikuliX and the script exist
        const scriptPath = path.resolve(__dirname, '../scripts/sikulix/PlanetWin365Bot.js');
        
        if (!fs.existsSync(scriptPath)) {
          throw new Error(`SikuliX script not found at ${scriptPath}`);
        }
        
        // Convert strategy to JSON for passing as argument
        const strategyJson = JSON.stringify(strategy);
        
        // Command to launch SikuliX with our script
        // java -jar sikulix.jar -r PlanetWin365Bot.js -- "username" "password" "strategyJson"
        this.sikulixProcess = spawn('java', [
          '-jar', 
          'sikulix.jar', 
          '-r', 
          scriptPath, 
          '--', 
          this.casinoUsername, 
          this.casinoPassword, 
          strategyJson
        ]);
        
        // Handle process output
        this.sikulixProcess.stdout?.on('data', (data) => {
          const lines = data.toString().split('\n');
          
          lines.forEach((line: string) => {
            if (line.trim()) {
              console.log('SikuliX:', line);
              
              // Parse the log line to extract information
              // Assuming format: [timestamp] [type] message
              const match = line.match(/\[(.*?)\] \[(.*?)\] (.*)/);
              
              if (match) {
                const [, timestamp, type, message] = match;
                
                // Store log in our system through public event
                this.emit('log', { timestamp, type, message });
                
                // If the message contains result information, parse and emit result
                if (message.includes('Roulette result:')) {
                  // Extract result data and emit events as needed
                  // This would be implemented in a real system
                }
              }
            }
          });
        });
        
        this.sikulixProcess.stderr?.on('data', (data) => {
          const errorMsg = data.toString();
          console.error('SikuliX Error:', errorMsg);
          this.emit('log', { 
            timestamp: new Date().toLocaleTimeString(),
            type: 'error', 
            message: errorMsg 
          });
        });
        
        this.sikulixProcess.on('close', (code) => {
          console.log(`SikuliX process exited with code ${code}`);
          this.sikulixProcess = null;
          this.running = false;
          
          if (code === 0) {
            resolve(true);
          } else {
            reject(new Error(`SikuliX process exited with code ${code}`));
          }
        });
        
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Get the status of the SikuliX bot
   */
  getStatus(): { running: boolean } {
    return {
      running: this.running
    };
  }
}

export const sikulixConnector = new SikuliXConnector();
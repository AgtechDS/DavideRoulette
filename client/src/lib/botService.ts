import { apiRequest } from "./queryClient";
import { Strategy } from "./types";

/**
 * Service for controlling the bot and managing strategies
 */
export const botService = {
  /**
   * Start the bot with the specified strategy
   */
  async startBot(strategy: Strategy) {
    const res = await apiRequest('POST', '/api/bot/start', strategy);
    return res.json();
  },
  
  /**
   * Stop the bot
   */
  async stopBot() {
    const res = await apiRequest('POST', '/api/bot/stop', {});
    return res.json();
  },
  
  /**
   * Get the current bot status
   */
  async getStatus() {
    const res = await apiRequest('GET', '/api/bot/status', undefined);
    return res.json();
  },
  
  /**
   * Save a strategy
   */
  async saveStrategy(strategy: Strategy) {
    const res = await apiRequest('POST', '/api/strategy', strategy);
    return res.json();
  },
  
  /**
   * Get all saved strategies
   */
  async getStrategies() {
    const res = await apiRequest('GET', '/api/strategy', undefined);
    return res.json();
  },
  
  /**
   * Get bot activity logs
   */
  async getLogs() {
    const res = await apiRequest('GET', '/api/bot/logs', undefined);
    return res.json();
  },
  
  /**
   * Export logs as a text file
   */
  async exportLogs() {
    const res = await apiRequest('GET', '/api/bot/logs/export', undefined);
    return res.blob();
  },
  
  /**
   * Clear bot logs
   */
  async clearLogs() {
    const res = await apiRequest('DELETE', '/api/bot/logs', {});
    return res.json();
  }
};

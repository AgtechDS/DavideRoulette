import { apiRequest } from "./queryClient";

/**
 * Service for interacting with AI analysis features
 */
export const aiService = {
  /**
   * Get quick insights about current strategy and results
   */
  async getInsights() {
    const res = await apiRequest('GET', '/api/ai/insights', undefined);
    return res.json();
  },
  
  /**
   * Request a detailed analysis of all data
   */
  async requestFullAnalysis() {
    const res = await apiRequest('POST', '/api/ai/analyze', {});
    return res.json();
  },
  
  /**
   * Get strategy recommendations based on historical data
   * @param parameters Optional parameters to guide recommendations
   */
  async getRecommendations(parameters?: { 
    riskTolerance?: 'low' | 'medium' | 'high',
    targetProfit?: number,
    maxBudget?: number
  }) {
    const res = await apiRequest('POST', '/api/ai/recommendations', parameters || {});
    return res.json();
  }
};

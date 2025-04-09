import { useState, useEffect, useCallback, useRef } from 'react';

export interface WebSocketHook {
  isConnected: boolean;
  lastMessage: any;
  error: string | null;
  botStatus: {
    active: boolean;
    strategy: any;
    startTime?: string;
    sessions?: Array<{
      botId: string;
      accountId: string;
      isActive: boolean;
      startTime: string;
      stats: {
        betsPlaced: number;
        wins: number;
        losses: number;
        profit: number;
      }
    }>;
    stats?: {
      balance?: number;
      totalBets?: number;
      wins?: number;
      losses?: number;
      profit?: number;
      longestSequence?: {
        red?: number;
        black?: number;
        even?: number;
        odd?: number;
      };
    };
  };
  gameResults: any[];
  botLogs: { timestamp: string; type: string; message: string }[];
  sendMessage: (message: any) => void;
  sendCommand: (command: string, data?: any) => void;
}

export function useWebSocket(): WebSocketHook {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [botStatus, setBotStatus] = useState<any>({ 
    active: false, 
    strategy: null,
    startTime: undefined,
    sessions: [],
    stats: { balance: 0, totalBets: 0, wins: 0, losses: 0, profit: 0 }
  });
  const [gameResults, setGameResults] = useState<any[]>([]);
  const [botLogs, setBotLogs] = useState<{ timestamp: string; type: string; message: string }[]>([]);
  
  // WebSocket reference to avoid recreation
  const socketRef = useRef<WebSocket | null>(null);
  
  // Connection establishment
  useEffect(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      
      console.log('Tentativo di connessione WebSocket a:', wsUrl);
      
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      socket.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        setError(null);
        
        // Request initial data
        socket.send(JSON.stringify({ type: 'getStatus' }));
        socket.send(JSON.stringify({ type: 'getLogs' }));
        socket.send(JSON.stringify({ type: 'getResults' }));
      };
      
      socket.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
      };
      
      socket.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Errore di connessione WebSocket.');
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          
          // Handle different message types
          if (data.type === 'botStatus') {
            setBotStatus(data.data);
          } else if (data.type === 'gameResult') {
            setGameResults(prev => [data.data, ...prev].slice(0, 100)); // Keep last 100 results
          } else if (data.type === 'botLog') {
            setBotLogs(prev => [...prev, data.data].slice(-100)); // Keep last 100 logs
          } else if (data.type === 'allLogs') {
            setBotLogs(data.data || []);
          } else if (data.type === 'allResults') {
            setGameResults(data.data || []);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      // Cleanup on unmount
      return () => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.close();
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setError('Failed to connect to WebSocket server.');
      return () => {};
    }
  }, []);
  
  // Send message function
  const sendMessage = useCallback((message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(typeof message === 'string' ? message : JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected. Message not sent.');
    }
  }, []);
  
  // Send command function (helper for common commands)
  const sendCommand = useCallback((command: string, data?: any) => {
    sendMessage({
      type: command,
      data: data || {}
    });
  }, [sendMessage]);
  
  return {
    isConnected,
    lastMessage,
    error,
    botStatus,
    gameResults,
    botLogs,
    sendMessage,
    sendCommand
  };
}
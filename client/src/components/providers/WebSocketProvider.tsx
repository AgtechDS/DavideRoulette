import React, { createContext, useContext, PropsWithChildren } from 'react';
import { useWebSocket, WebSocketHook } from '@/hooks/useWebSocket';

// Crea un contesto per il WebSocket
const WebSocketContext = createContext<WebSocketHook | null>(null);

/**
 * Provider per il WebSocket che rende disponibili i dati in tempo reale a tutta l'applicazione
 */
export function WebSocketProvider({ children }: PropsWithChildren<{}>) {
  const webSocketData = useWebSocket();
  
  return (
    <WebSocketContext.Provider value={webSocketData}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook per accedere al contesto WebSocket da qualsiasi componente
 */
export function useWebSocketContext(): WebSocketHook {
  const context = useContext(WebSocketContext);
  
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  
  return context;
}

export default WebSocketProvider;
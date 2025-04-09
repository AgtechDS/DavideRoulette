import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { CheckCircle, XCircle, AlertCircle, PlayCircle, Archive } from 'lucide-react';

/**
 * Componente per monitorare e visualizzare i log di attività del bot in tempo reale
 */
export function BotActivityMonitor() {
  const { botLogs, isConnected } = useWebSocketContext();
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Scorrimento automatico verso il basso quando vengono aggiunti nuovi log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [botLogs]);

  const getLogIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'info':
      default:
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogClassByType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warn':
        return 'border-amber-200 bg-amber-50';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Archive className="w-5 h-5 mr-2 text-gray-600" /> 
          Attività Bot
        </CardTitle>
        <CardDescription>
          Monitoraggio delle operazioni del bot in tempo reale
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="py-8 text-center text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
            <p className="text-sm">Connessione al server non disponibile</p>
            <p className="text-xs text-gray-400 mt-1">I log verranno mostrati quando la connessione sarà ripristinata</p>
          </div>
        ) : botLogs.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Archive className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm">Nessun log disponibile</p>
            <p className="text-xs text-gray-400 mt-1">I log appariranno qui quando il bot sarà attivo</p>
          </div>
        ) : (
          <div 
            ref={logContainerRef}
            className="h-64 overflow-y-auto border border-gray-100 rounded-lg p-1"
          >
            {botLogs.map((log, index) => (
              <div 
                key={index} 
                className={`p-2 mb-1 text-xs rounded border ${getLogClassByType(log.type)}`}
              >
                <div className="flex items-start">
                  <div className="mr-2 mt-0.5">
                    {getLogIcon(log.type)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-medium">{log.message}</div>
                    <div className="text-gray-500 text-[10px]">{log.timestamp}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BotActivityMonitor;
import React from 'react';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleOff, CircleDot, AlertCircle, ZapOff, Zap, Clock, BarChart4, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export function BotStatusIndicator({ onStop }: { onStop: () => void }) {
  const { isConnected, botStatus, error } = useWebSocketContext();
  
  if (!isConnected) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center text-amber-600">
            <ZapOff className="h-4 w-4 mr-2" /> 
            Disconnesso dal Server
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-amber-600">
            Riconnessione in corso...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!botStatus.active) {
    return (
      <Card className="border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center text-gray-500">
            <CircleOff className="h-4 w-4 mr-2" /> 
            Bot Inattivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-gray-500">
            Seleziona una strategia e clicca su "Avvia Bot" per iniziare
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcola la percentuale di progresso della sessione (in caso di durata sessione impostata)
  const sessionProgress = botStatus.strategy?.sessionDuration && botStatus.startTime ? 
    Math.min(100, (Date.now() - new Date(botStatus.startTime as string).getTime()) / 
      (botStatus.strategy.sessionDuration * 60 * 1000) * 100) : 0;

  // Calcola target progress (quanto manca al target profit)
  const targetProgress = botStatus.strategy?.targetProfit && botStatus.stats?.profit ? 
    Math.min(100, (botStatus.stats.profit / botStatus.strategy.targetProfit) * 100) : 0;

  // Se ci sono più sessioni attive (multi-account)
  const hasMultipleSessions = botStatus.sessions && botStatus.sessions.length > 1;

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium flex items-center text-green-600">
            <CircleDot className="h-4 w-4 mr-2 animate-pulse" /> 
            Bot Attivo
            {hasMultipleSessions && (
              <Badge variant="outline" className="ml-2 text-xs">
                {botStatus.sessions?.length} sessioni
              </Badge>
            )}
          </CardTitle>
          <Button 
            variant="destructive" 
            size="sm" 
            className="h-7 text-xs" 
            onClick={onStop}
          >
            Stop
          </Button>
        </div>
        <CardDescription className="text-xs text-green-700 mt-1">
          Strategia: <span className="font-medium">{botStatus.strategy?.name || botStatus.strategy?.type}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="text-xs">
            <div className="flex items-center text-gray-600 mb-1">
              <Clock className="h-3 w-3 mr-1" /> Durata
            </div>
            <Progress value={sessionProgress} className="h-2" />
          </div>
          <div className="text-xs">
            <div className="flex items-center text-gray-600 mb-1">
              <Target className="h-3 w-3 mr-1" /> Target Profit
            </div>
            <Progress value={targetProgress} className="h-2" />
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <div>
            <span className="font-medium">{botStatus.stats?.totalBets || 0}</span> puntate
          </div>
          <div>
            <span className={`font-medium ${(botStatus.stats?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(botStatus.stats?.profit || 0) >= 0 ? '+' : ''}{botStatus.stats?.profit || 0}€
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default BotStatusIndicator;
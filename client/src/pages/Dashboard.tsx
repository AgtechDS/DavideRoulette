import { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import StatCards from "@/components/dashboard/StatCards";
import StrategySelector from "@/components/dashboard/StrategySelector";
import AIInsights from "@/components/dashboard/AIInsights";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import GameLog from "@/components/dashboard/GameLog";
import BotActivityMonitor from "@/components/dashboard/BotActivityMonitor";
import StatusNotification from "@/components/notifications/StatusNotification";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Strategy, BotStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useWebSocketContext } from "@/components/providers/WebSocketProvider";

export default function Dashboard() {
  const [botStatus, setBotStatus] = useState<BotStatus>({ active: false, strategy: null });
  const { toast } = useToast();

  // Fetch current strategy
  const { data: strategy } = useQuery({
    queryKey: ['/api/strategy/current'],
    staleTime: 60000 // 1 minute
  });

  // Fetch bot status
  const { data: botStatusData, refetch: refetchBotStatus } = useQuery({
    queryKey: ['/api/bot/status'],
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Start bot mutation
  const startBotMutation = useMutation({
    mutationFn: async (strategy: Strategy) => {
      const res = await apiRequest('POST', '/api/bot/start', strategy);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bot Started",
        description: "The bot has been started with the selected strategy.",
      });
      refetchBotStatus();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Start Bot",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Stop bot mutation
  const stopBotMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/bot/stop', {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bot Stopped",
        description: "The bot has been stopped.",
      });
      refetchBotStatus();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Stop Bot",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update bot status when data changes
  useEffect(() => {
    if (botStatusData) {
      setBotStatus(botStatusData as BotStatus);
    }
  }, [botStatusData]);

  const handleStartBot = (strategy: Strategy) => {
    startBotMutation.mutate(strategy);
  };

  const handleStopBot = () => {
    stopBotMutation.mutate();
  };

  return (
    <PageLayout>
      {/* Main Content Area */}
      <div className="p-4 md:p-6">
        <StatCards />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Strategy Configuration Section */}
          <div className="lg:col-span-1">
            <StrategySelector 
              onStartBot={handleStartBot}
              currentStrategy={strategy as Strategy | null}
              botStatus={botStatus}
            />
            <AIInsights />
          </div>
          
          {/* Performance Tracking Section */}
          <div className="lg:col-span-2">
            <PerformanceChart />
            <GameLog />
            <BotActivityMonitor />
          </div>
        </div>
        
        {/* Bot Status Notification */}
        {botStatus.active && (
          <StatusNotification 
            botStatus={botStatus} 
            onClose={handleStopBot}
          />
        )}
      </div>
    </PageLayout>
  );
}

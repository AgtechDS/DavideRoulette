import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import StatCards from "@/components/dashboard/StatCards";
import StrategySelector from "@/components/dashboard/StrategySelector";
import AIInsights from "@/components/dashboard/AIInsights";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import GameLog from "@/components/dashboard/GameLog";
import BotActivityLog from "@/components/dashboard/BotActivityLog";
import StatusNotification from "@/components/notifications/StatusNotification";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Strategy, BotStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    onError: (error) => {
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
    onError: (error) => {
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
      setBotStatus(botStatusData);
    }
  }, [botStatusData]);

  const handleStartBot = (strategy: Strategy) => {
    startBotMutation.mutate(strategy);
  };

  const handleStopBot = () => {
    stopBotMutation.mutate();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar - hidden on mobile */}
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          mobileMenuOpen={mobileMenuOpen} 
          setMobileMenuOpen={setMobileMenuOpen}
          botStatus={botStatus}
        />
        
        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <StatCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Strategy Configuration Section */}
            <div className="lg:col-span-1">
              <StrategySelector 
                onStartBot={handleStartBot}
                currentStrategy={strategy}
                botStatus={botStatus}
              />
              <AIInsights />
            </div>
            
            {/* Performance Tracking Section */}
            <div className="lg:col-span-2">
              <PerformanceChart />
              <GameLog />
              <BotActivityLog />
            </div>
          </div>
        </main>
      </div>

      {/* Bot Status Notification */}
      {botStatus.active && (
        <StatusNotification 
          botStatus={botStatus} 
          onClose={handleStopBot}
        />
      )}
    </div>
  );
}

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { WebSocketProvider } from "@/components/providers/WebSocketProvider";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import GameAutomation from "@/pages/GameAutomation";
import StatisticsReports from "@/pages/StatisticsReports";
import AIAnalysis from "@/pages/AIAnalysis";
import Settings from "@/pages/Settings";
import StrategyConfiguration from "@/pages/StrategyConfiguration";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

function Router() {
  const { toast } = useToast();
  
  useEffect(() => {
    // Show notification that this is a demo
    setTimeout(() => {
      toast({
        title: "Demo Mode",
        description: "This is running in demonstration mode. No real money is being used.",
        duration: 5000,
      });
    }, 1000);
  }, [toast]);

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/strategie" component={StrategyConfiguration} />
      <Route path="/automazione" component={GameAutomation} />
      <Route path="/statistiche" component={StatisticsReports} />
      <Route path="/ai" component={AIAnalysis} />
      <Route path="/impostazioni" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <Router />
        <Toaster />
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;

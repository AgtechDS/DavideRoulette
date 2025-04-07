import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import GameAutomation from "@/pages/GameAutomation";
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
      <Route path="/automazione" component={GameAutomation} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

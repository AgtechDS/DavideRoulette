import { useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function BotActivityLog() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Fetch bot logs
  const { data, isLoading } = useQuery({
    queryKey: ['/api/bot/logs'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Auto-scroll to bottom when new logs come in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data]);

  // Export logs mutation
  const exportLogsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('GET', '/api/bot/logs/export', {});
      return res.blob();
    },
    onSuccess: (blob) => {
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bot-logs-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Bot activity logs have been exported successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Clear logs mutation
  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', '/api/bot/logs', {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Logs Cleared",
        description: "Bot activity logs have been cleared successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bot/logs'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Clear Logs",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <Card className="border border-border">
      <CardHeader className="p-4 border-b border-border">
        <h2 className="font-medium">Bot Activity Log</h2>
      </CardHeader>
      
      <CardContent className="p-4">
        <ScrollArea 
          className="bg-card rounded-lg p-3 h-48 font-mono text-sm" 
          ref={scrollRef}
        >
          {isLoading ? (
            <div className="space-y-1">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="h-5 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : data?.logs && data.logs.length > 0 ? (
            data.logs.map((log, index) => (
              <div key={index} className="mb-1 leading-tight">
                <span className={
                  log.type === 'info' ? 'text-green-500' : 
                  log.type === 'warning' ? 'text-yellow-500' : 
                  log.type === 'error' ? 'text-destructive' : 
                  'text-blue-500'
                }>
                  [{log.timestamp}]
                </span>{' '}
                <span className="text-muted-foreground">{log.message}</span>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No bot activity logs available</p>
            </div>
          )}
        </ScrollArea>
        
        <div className="flex justify-between mt-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground text-sm"
            onClick={() => exportLogsMutation.mutate()}
            disabled={exportLogsMutation.isPending || !data?.logs?.length}
          >
            <span className="material-icons text-sm mr-1">file_download</span>
            Export Logs
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground text-sm"
            onClick={() => clearLogsMutation.mutate()}
            disabled={clearLogsMutation.isPending || !data?.logs?.length}
          >
            <span className="material-icons text-sm mr-1">delete</span>
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

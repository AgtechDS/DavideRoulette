import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AIInsights() {
  const { toast } = useToast();
  
  // Fetch AI insights
  const { data: insights, isLoading } = useQuery({
    queryKey: ['/api/ai/insights'],
    refetchInterval: 60000 * 5, // Refresh every 5 minutes
  });

  // Request full analysis mutation
  const requestAnalysisMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/ai/analyze', {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Analysis Requested",
        description: "Full AI analysis has been requested and will be available shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/insights'] });
    },
    onError: (error) => {
      toast({
        title: "Analysis Request Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle refresh
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/ai/insights'] });
  };

  // Request full analysis
  const handleRequestAnalysis = () => {
    requestAnalysisMutation.mutate();
  };

  return (
    <Card className="border border-border">
      <CardHeader className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="font-medium">AI Insights</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <span className="material-icons text-muted-foreground">refresh</span>
        </Button>
      </CardHeader>
      
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse h-20 bg-muted rounded-md" />
            <div className="animate-pulse h-20 bg-muted rounded-md" />
            <div className="animate-pulse h-20 bg-muted rounded-md" />
          </div>
        ) : insights ? (
          <>
            {/* Strategy Analysis */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <span className="material-icons text-primary mr-2">psychology</span>
                <h3 className="font-medium">Strategy Analysis</h3>
              </div>
              <p className="text-sm text-muted-foreground">{insights.strategyAnalysis}</p>
            </div>
            
            {/* Risk Assessment */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <span className="material-icons text-warning mr-2">warning</span>
                <h3 className="font-medium">Risk Assessment</h3>
              </div>
              <p className="text-sm text-muted-foreground">{insights.riskAssessment}</p>
            </div>
            
            {/* Trend Detection */}
            <div>
              <div className="flex items-center mb-2">
                <span className="material-icons text-info mr-2">trending_up</span>
                <h3 className="font-medium">Trend Detection</h3>
              </div>
              <p className="text-sm text-muted-foreground">{insights.trendDetection}</p>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-2">No insights available yet</p>
            <Button variant="outline" onClick={handleRequestAnalysis}>
              Generate Insights
            </Button>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-border">
          <Button 
            variant="ghost" 
            className="w-full text-primary"
            onClick={handleRequestAnalysis}
            disabled={requestAnalysisMutation.isPending}
          >
            <span className="material-icons mr-1 text-sm">analytics</span>
            Request Full AI Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

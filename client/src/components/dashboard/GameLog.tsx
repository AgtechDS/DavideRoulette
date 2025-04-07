import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function GameLog() {
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  
  // Fetch game results with pagination
  const { data, isLoading } = useQuery({
    queryKey: ['/api/results', page],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('GET', '/api/results/export', {});
      return res.blob();
    },
    onSuccess: (blob) => {
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roulette-results-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Game results have been exported successfully.",
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

  return (
    <Card className="border border-border mb-6">
      <CardHeader className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="font-medium">Recent Game Results</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-sm"
          onClick={() => exportDataMutation.mutate()}
          disabled={exportDataMutation.isPending || !data?.results?.length}
        >
          <span className="material-icons text-sm mr-1">file_download</span>
          Export
        </Button>
      </CardHeader>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Number</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Color</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Bet Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Bet Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              // Loading skeletons
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(6).fill(0).map((_, j) => (
                    <td key={j} className="px-4 py-3 whitespace-nowrap">
                      <div className="h-5 bg-muted rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data?.results && data.results.length > 0 ? (
              data.results.map((result, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{result.time}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span 
                      className={`w-6 h-6 inline-flex items-center justify-center ${
                        result.color === 'Red' ? 'bg-red-600' : 
                        result.color === 'Black' ? 'bg-black' : 
                        'bg-green-600'
                      } rounded-full`}
                    >
                      {result.number}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                    <span className={
                      result.color === 'Red' ? 'text-red-500' : 
                      result.color === 'Black' ? 'text-white' : 
                      'text-green-500'
                    }>
                      {result.color}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{result.betType}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">€{result.betAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={result.outcome === 'Win' ? 'text-success' : 'text-destructive'}>
                      {result.outcome}
                      {result.outcome === 'Win' && result.profit && ` (+€${result.profit.toFixed(2)})`}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No game results available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {data?.pagination && (
        <CardFooter className="p-4 border-t border-border flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {data.pagination.startIndex} to {data.pagination.endIndex} of {data.pagination.total} results
          </div>
          
          {/* Pagination */}
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <span className="material-icons text-sm">chevron_left</span>
            </Button>
            
            {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
              const pageNumber = i + 1;
              return (
                <Button
                  key={i}
                  variant={page === pageNumber ? "default" : "outline"}
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              );
            })}
            
            {data.pagination.totalPages > 5 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8"
                  disabled
                >
                  ...
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setPage(data.pagination.totalPages)}
                >
                  {data.pagination.totalPages}
                </Button>
              </>
            )}
            
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8"
              onClick={() => setPage(page + 1)}
              disabled={page === data.pagination.totalPages}
            >
              <span className="material-icons text-sm">chevron_right</span>
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

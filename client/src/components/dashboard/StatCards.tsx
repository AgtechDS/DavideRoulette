import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

export default function StatCards() {
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Wins */}
      <Card className="border border-border">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-muted-foreground text-sm">Total Wins</h3>
            <span className="material-icons text-success">trending_up</span>
          </div>
          <div className="flex items-baseline">
            <span className="text-2xl font-medium">
              {stats?.totalWins ? `€${stats.totalWins.toFixed(2)}` : '€0.00'}
            </span>
            {stats?.winPercentChange && (
              <span className={`ml-2 text-xs ${stats.winPercentChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                {stats.winPercentChange >= 0 ? '+' : ''}{stats.winPercentChange.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats?.lastUpdate || 'Not updated yet'}
          </div>
        </CardContent>
      </Card>
      
      {/* Total Bets */}
      <Card className="border border-border">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-muted-foreground text-sm">Total Bets</h3>
            <span className="material-icons text-info">casino</span>
          </div>
          <div className="flex items-baseline">
            <span className="text-2xl font-medium">
              {stats?.totalBets || 0}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">bets</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats?.activePeriod || 'Not active'}
          </div>
        </CardContent>
      </Card>
      
      {/* Win Rate */}
      <Card className="border border-border">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-muted-foreground text-sm">Win Rate</h3>
            <span className="material-icons text-warning">percent</span>
          </div>
          <div className="flex items-baseline">
            <span className="text-2xl font-medium">
              {stats?.winRate ? `${stats.winRate.toFixed(1)}%` : '0.0%'}
            </span>
            {stats?.winRateChange && (
              <span className={`ml-2 text-xs ${stats.winRateChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                {stats.winRateChange >= 0 ? '+' : ''}{stats.winRateChange.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats?.benchmark ? `Benchmark: ${stats.benchmark}%` : 'No benchmark'}
          </div>
        </CardContent>
      </Card>
      
      {/* Current Strategy */}
      <Card className="border border-border">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-muted-foreground text-sm">Current Strategy</h3>
            <span className="material-icons text-primary">psychology</span>
          </div>
          <div className="flex items-center">
            <span className="text-lg font-medium">
              {stats?.currentStrategy || 'None'}
            </span>
            {stats?.currentStrategy && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-primary bg-opacity-20 text-primary rounded">
                {stats?.botActive ? 'Active' : 'Inactive'}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats?.strategyDuration || 'Not running'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

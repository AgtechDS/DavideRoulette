import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type TimeRange = "day" | "week" | "month";

export default function PerformanceChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>("day");

  // Fetch performance data based on time range
  const { data, isLoading } = useQuery({
    queryKey: ['/api/performance', timeRange],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <Card className="border border-border mb-6">
      <CardHeader className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="font-medium">Performance Tracking</h2>
        
        {/* Time Period Selector */}
        <div className="flex">
          <Button 
            size="sm" 
            variant={timeRange === "day" ? "default" : "ghost"}
            onClick={() => setTimeRange("day")}
            className="text-xs"
          >
            Today
          </Button>
          <Button 
            size="sm" 
            variant={timeRange === "week" ? "default" : "ghost"}
            onClick={() => setTimeRange("week")}
            className="text-xs ml-1"
          >
            Week
          </Button>
          <Button 
            size="sm" 
            variant={timeRange === "month" ? "default" : "ghost"}
            onClick={() => setTimeRange("month")}
            className="text-xs ml-1"
          >
            Month
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {isLoading ? (
          <div className="h-[300px] animate-pulse bg-muted rounded-lg" />
        ) : data?.chartData && data.chartData.length > 0 ? (
          <div className="h-[300px] bg-card rounded-lg p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.chartData}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
                  tickFormatter={(value) => `€${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E1E1E', 
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: 'white'
                  }}
                  formatter={(value) => [`€${Number(value).toFixed(2)}`, 'Balance']}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="hsl(265.5 84.6% 47.3%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(265.5 84.6% 47.3%)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] bg-card rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">No performance data available</p>
          </div>
        )}
        
        <div className="flex justify-between mt-2 text-sm">
          <div className="text-muted-foreground">
            Starting Balance: <span className="text-foreground">
              {data?.startingBalance ? `€${data.startingBalance.toFixed(2)}` : '€0.00'}
            </span>
          </div>
          <div className="text-muted-foreground">
            Current Balance: <span className={data?.currentBalance > data?.startingBalance ? 'text-success' : 'text-destructive'}>
              {data?.currentBalance ? `€${data.currentBalance.toFixed(2)}` : '€0.00'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

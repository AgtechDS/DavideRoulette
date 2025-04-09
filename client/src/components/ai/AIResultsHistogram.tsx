import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Legend, Bar, XAxis, YAxis, CartesianGrid, BarChart, ResponsiveContainer, Tooltip } from "recharts";

interface NumberFrequency {
  number: number;
  count: number;
  color: string;
}

const emptyData: NumberFrequency[] = Array.from({ length: 37 }, (_, i) => ({
  number: i,
  count: 0,
  color: i === 0 ? '#22c55e' : (i % 2 === 0 ? '#ef4444' : '#1e1e1e')
}));

export default function AIResultsHistogram() {
  // Fetch game results
  const { data: resultsData, isLoading } = useQuery({
    queryKey: ["/api/results", { all: true }],
    queryFn: async () => {
      const res = await fetch("/api/results?all=true");
      if (!res.ok) throw new Error("Failed to fetch game results");
      return res.json();
    }
  });
  
  // Calculate number frequencies
  const calculateFrequencies = (results: any[]): NumberFrequency[] => {
    if (!results || results.length === 0) return emptyData;
    
    // Count occurrences of each number
    const counts: Record<number, number> = {};
    results.forEach(result => {
      const num = result.number;
      counts[num] = (counts[num] || 0) + 1;
    });
    
    // Convert to array format for chart
    return emptyData.map(item => ({
      ...item,
      count: counts[item.number] || 0
    }));
  };
  
  const frequencyData = calculateFrequencies(resultsData?.results || []);
  
  // Find the "hottest" and "coldest" numbers
  const getHotAndColdNumbers = (data: NumberFrequency[]) => {
    if (!data.length || data.every(item => item.count === 0)) {
      return { hot: [], cold: [] };
    }
    
    const sortedData = [...data].sort((a, b) => b.count - a.count);
    const hot = sortedData.slice(0, 3).filter(item => item.count > 0);
    const cold = sortedData.reverse().slice(0, 3).filter(item => item.count === 0);
    
    return { hot, cold };
  };
  
  const { hot, cold } = getHotAndColdNumbers(frequencyData);
  
  // Format tooltips
  const tooltipFormatter = (value: number) => [`${value} volte`, 'Frequenza'];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Distribuzione dei Numeri
        </CardTitle>
        <CardDescription>
          Analisi statistica della distribuzione dei numeri estratti
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frequencyData} barCategoryGap={1}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="number" fontSize={10} tickMargin={5} />
                  <YAxis allowDecimals={false} fontSize={10} />
                  <Tooltip formatter={tooltipFormatter} />
                  <Bar 
                    dataKey="count" 
                    name="Frequenza" 
                    fill="#1e40af"
                    radius={[2, 2, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2 text-green-600">Numeri "caldi"</h4>
                <div className="space-y-1">
                  {hot.length > 0 ? (
                    hot.map(item => (
                      <div key={item.number} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className={`w-5 h-5 rounded-full mr-2 flex items-center justify-center text-[10px] text-white`}
                            style={{ backgroundColor: item.color }}
                          >
                            {item.number}
                          </div>
                          <span className="text-xs">Numero {item.number}</span>
                        </div>
                        <span className="text-xs font-medium">{item.count}x</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">Nessun dato disponibile</p>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2 text-blue-600">Numeri "freddi"</h4>
                <div className="space-y-1">
                  {cold.length > 0 ? (
                    cold.map(item => (
                      <div key={item.number} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className={`w-5 h-5 rounded-full mr-2 flex items-center justify-center text-[10px] text-white`}
                            style={{ backgroundColor: item.color }}
                          >
                            {item.number}
                          </div>
                          <span className="text-xs">Numero {item.number}</span>
                        </div>
                        <span className="text-xs font-medium">{item.count}x</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">Nessun dato disponibile</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
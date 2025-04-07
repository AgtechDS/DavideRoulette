import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Download, FileText, BarChart3, LineChart, PieChart as PieChartIcon } from "lucide-react";
import { GameResult, LogEntry, Strategy } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

// Colori per i grafici
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A020F0", "#FF6B6B"];

export default function StatisticsReports() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("week");
  const [fromDate, setFromDate] = useState<Date | undefined>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [toDate, setToDate] = useState<Date | undefined>(new Date());
  const [reportType, setReportType] = useState("summary");

  // Ottenere i dati dal server
  const { data: resultsData } = useQuery({
    queryKey: ["/api/results", { all: true }],
    queryFn: async () => {
      const res = await fetch("/api/results?all=true");
      if (!res.ok) throw new Error("Failed to fetch game results");
      return res.json();
    }
  });

  const { data: statsData } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    }
  });

  const { data: performanceData } = useQuery({
    queryKey: ["/api/performance", timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/performance?timeRange=${timeRange}`);
      if (!res.ok) throw new Error("Failed to fetch performance data");
      return res.json();
    }
  });

  const { data: logsData } = useQuery({
    queryKey: ["/api/bot/logs"],
    queryFn: async () => {
      const res = await fetch("/api/bot/logs");
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    }
  });

  const { data: strategiesData } = useQuery({
    queryKey: ["/api/strategy"],
    queryFn: async () => {
      const res = await fetch("/api/strategy");
      if (!res.ok) throw new Error("Failed to fetch strategies");
      return res.json();
    }
  });

  // Preparare i dati per i grafici
  const results: GameResult[] = resultsData?.results || [];
  const filteredResults = results.filter((result) => {
    if (!fromDate || !toDate) return true;
    const resultDate = new Date(result.time);
    return resultDate >= fromDate && resultDate <= toDate;
  });

  // Dati per il grafico a torta dei risultati (Win/Loss)
  const winLossData = [
    { name: "Vittorie", value: filteredResults.filter(r => r.outcome === "Win").length },
    { name: "Perdite", value: filteredResults.filter(r => r.outcome === "Loss").length }
  ];

  // Dati per il grafico a barre dei numeri
  const numberFrequency: { [key: number]: number } = {};
  filteredResults.forEach(result => {
    numberFrequency[result.number] = (numberFrequency[result.number] || 0) + 1;
  });

  const numberData = Object.entries(numberFrequency).map(([number, count]) => ({
    number: parseInt(number),
    count
  })).sort((a, b) => a.number - b.number);

  // Dati per il grafico a torta dei colori
  const colorData = [
    { name: "Rosso", value: filteredResults.filter(r => r.color === "Red").length },
    { name: "Nero", value: filteredResults.filter(r => r.color === "Black").length },
    { name: "Verde", value: filteredResults.filter(r => r.color === "Green").length },
  ];

  // Funzione per esportare i dati
  const handleExportData = () => {
    let url = "";
    let filename = "";

    switch (reportType) {
      case "summary":
        url = "/api/reports/summary";
        filename = "roulette-summary-report.pdf";
        break;
      case "game-results":
        url = "/api/results/export";
        filename = "game-results.csv";
        break;
      case "bot-logs":
        url = "/api/bot/logs/export";
        filename = "bot-logs.txt";
        break;
      case "statistics":
        url = "/api/reports/statistics";
        filename = "roulette-statistics.pdf";
        break;
    }

    if (!url) {
      toast({
        title: "Errore",
        description: "Tipo di report non valido",
        variant: "destructive"
      });
      return;
    }

    // Per i file CSV o TXT, usiamo il download diretto
    if (filename.endsWith(".csv") || filename.endsWith(".txt")) {
      window.location.href = url;
      return;
    }

    // Per i file PDF, mostriamo un messaggio (in futuro potremmo implementare la generazione PDF)
    toast({
      title: "Esportazione del report",
      description: "La funzionalità di esportazione PDF sarà disponibile nella prossima versione",
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Statistiche & Report</h1>
        <div className="flex items-center space-x-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipo di report" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Report riassuntivo</SelectItem>
              <SelectItem value="game-results">Risultati di gioco</SelectItem>
              <SelectItem value="bot-logs">Log del bot</SelectItem>
              <SelectItem value="statistics">Statistiche dettagliate</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Esporta
          </Button>
        </div>
      </div>

      <div className="flex mb-6 space-x-4">
        <div className="flex items-center">
          <span className="mr-2">Dal:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fromDate ? format(fromDate, "dd/MM/yyyy") : "Seleziona data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={fromDate}
                onSelect={setFromDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center">
          <span className="mr-2">Al:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {toDate ? format(toDate, "dd/MM/yyyy") : "Seleziona data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={toDate}
                onSelect={setToDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Intervallo temporale" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Ultimo giorno</SelectItem>
            <SelectItem value="week">Ultima settimana</SelectItem>
            <SelectItem value="month">Ultimo mese</SelectItem>
            <SelectItem value="year">Ultimo anno</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="numbers">Numeri & Colori</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="strategies">Strategie</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Riepilogo Attività</CardTitle>
                <CardDescription>Risultati complessivi e statistiche di gioco</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Totale round giocati:</span>
                    <span className="font-semibold">{filteredResults.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vittorie:</span>
                    <span className="font-semibold text-green-600">{winLossData[0].value}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Perdite:</span>
                    <span className="font-semibold text-red-600">{winLossData[1].value}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Percentuale di vittoria:</span>
                    <span className="font-semibold">
                      {filteredResults.length > 0 
                        ? ((winLossData[0].value / filteredResults.length) * 100).toFixed(2) + "%" 
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Strategia corrente:</span>
                    <span className="font-semibold">{statsData?.currentStrategy || "Nessuna"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ultimo aggiornamento:</span>
                    <span className="font-semibold">{statsData?.lastUpdate || "N/A"}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setReportType("summary")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Genera Report
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuzione Risultati</CardTitle>
                <CardDescription>Rapporto vittorie/perdite</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-64 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={winLossData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {winLossData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? "#4ade80" : "#ef4444"} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex justify-center w-full space-x-6">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span>Vittorie</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span>Perdite</span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="numbers">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Frequenza Numeri</CardTitle>
                <CardDescription>I numeri più frequenti nell'intervallo selezionato</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={numberData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="number" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Frequenza" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter>
                <div className="w-full">
                  <Separator className="mb-4" />
                  <div className="grid grid-cols-3 gap-2">
                    {numberData.length > 0 ? (
                      numberData
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 6)
                        .map((item) => (
                          <div key={item.number} className="flex justify-between">
                            <span>Numero {item.number}:</span>
                            <span className="font-semibold">{item.count} volte</span>
                          </div>
                        ))
                    ) : (
                      <div className="col-span-3 text-center">Nessun dato disponibile</div>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuzione Colori</CardTitle>
                <CardDescription>Frequenza dei colori nell'intervallo selezionato</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-64 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={colorData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell key="cell-0" fill="#ef4444" />
                        <Cell key="cell-1" fill="#1f2937" />
                        <Cell key="cell-2" fill="#4ade80" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex justify-center w-full space-x-6">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span>Rosso</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-900 mr-2"></div>
                    <span>Nero</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span>Verde (0)</span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Andamento del Saldo</CardTitle>
              <CardDescription>Performance nel tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={performanceData?.chartData || []}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} €`, "Saldo"]}
                      labelFormatter={(label) => `Tempo: ${label}`}
                    />
                    <Bar 
                      dataKey="balance" 
                      name="Saldo" 
                      fill="#8884d8" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                <div className="bg-slate-100 p-3 rounded-lg">
                  <p className="text-sm text-slate-500">Saldo iniziale</p>
                  <p className="text-xl font-semibold">{performanceData?.startingBalance || 0} €</p>
                </div>
                <div className="bg-slate-100 p-3 rounded-lg">
                  <p className="text-sm text-slate-500">Saldo corrente</p>
                  <p className="text-xl font-semibold">{performanceData?.currentBalance || 0} €</p>
                </div>
                <div className="bg-slate-100 p-3 rounded-lg">
                  <p className="text-sm text-slate-500">Variazione</p>
                  <p className={`text-xl font-semibold ${
                    (performanceData?.currentBalance || 0) - (performanceData?.startingBalance || 0) >= 0 
                      ? "text-green-600" 
                      : "text-red-600"
                  }`}>
                    {((performanceData?.currentBalance || 0) - (performanceData?.startingBalance || 0)).toFixed(2)} €
                  </p>
                </div>
                <div className="bg-slate-100 p-3 rounded-lg">
                  <p className="text-sm text-slate-500">% Variazione</p>
                  <p className={`text-xl font-semibold ${
                    (performanceData?.currentBalance || 0) - (performanceData?.startingBalance || 0) >= 0 
                      ? "text-green-600" 
                      : "text-red-600"
                  }`}>
                    {performanceData?.startingBalance 
                      ? (((performanceData.currentBalance - performanceData.startingBalance) / performanceData.startingBalance) * 100).toFixed(2) 
                      : "0"}%
                  </p>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="strategies">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Strategie Salvate</CardTitle>
                <CardDescription>Elenco delle strategie configurate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Tipo</th>
                        <th className="text-left p-2">Puntata Iniziale</th>
                        <th className="text-left p-2">Scommessa</th>
                        <th className="text-left p-2">Stop Loss</th>
                      </tr>
                    </thead>
                    <tbody>
                      {strategiesData?.strategies?.length > 0 ? (
                        strategiesData.strategies.map((strategy: Strategy) => (
                          <tr key={strategy.id} className="border-b">
                            <td className="p-2 capitalize">{strategy.type}</td>
                            <td className="p-2">{strategy.initialBet} €</td>
                            <td className="p-2 capitalize">{strategy.betType === "color" ? "Colore" : "Pari/Dispari"}</td>
                            <td className="p-2">{strategy.stopLoss} €</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-2 text-center">Nessuna strategia salvata</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex justify-between w-full">
                  <span>Strategia attualmente utilizzata:</span>
                  <span className="font-semibold">{statsData?.currentStrategy || "Nessuna"}</span>
                </div>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Log Attività</CardTitle>
                <CardDescription>Ultimi log del bot e degli eventi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] overflow-y-auto border rounded-md p-2">
                  {logsData?.logs?.length > 0 ? (
                    logsData.logs.map((log: LogEntry) => (
                      <div 
                        key={log.id} 
                        className={`mb-2 p-2 rounded-md ${
                          log.type === 'error' ? 'bg-red-50 text-red-700' :
                          log.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                          log.type === 'success' ? 'bg-green-50 text-green-700' :
                          'bg-blue-50 text-blue-700'
                        }`}
                      >
                        <div className="flex justify-between">
                          <span className="text-xs opacity-80">{log.timestamp}</span>
                          <span className="text-xs uppercase font-semibold opacity-80">{log.type}</span>
                        </div>
                        <div>{log.message}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4">Nessun log disponibile</div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setReportType("bot-logs")}>
                  <Download className="mr-2 h-4 w-4" />
                  Esporta Log
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
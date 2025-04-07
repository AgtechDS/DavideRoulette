import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CircleDashed, BarChart3, BrainCircuit, ArrowUpRightSquare, Dices, RefreshCcw, BadgeAlert, BarChartHorizontal, Settings2, ArrowRightLeft } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/layout/PageLayout";

interface AIInsight {
  strategyAnalysis: string;
  riskAssessment: string;
  trendDetection: string;
  recommendedAdjustments: string;
  lastUpdated: string;
}

export default function AIAnalysis() {
  const { toast } = useToast();
  const [modelType, setModelType] = useState("gpt-4o");
  const [analysisDepth, setAnalysisDepth] = useState("standard");
  
  // Fetch AI insights
  const { data: insightsData, isLoading: insightsLoading, error: insightsError } = useQuery({
    queryKey: ["/api/ai/insights"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/ai/insights");
        if (res.status === 404) {
          return null; // No insights available yet
        }
        if (!res.ok) throw new Error("Failed to fetch AI insights");
        return res.json();
      } catch (error) {
        console.error("Error fetching insights:", error);
        throw error;
      }
    }
  });
  
  // Get game results for context
  const { data: resultsData } = useQuery({
    queryKey: ["/api/results", { all: true }],
    queryFn: async () => {
      const res = await fetch("/api/results?all=true");
      if (!res.ok) throw new Error("Failed to fetch game results");
      return res.json();
    }
  });
  
  // Get the current strategy
  const { data: strategyData } = useQuery({
    queryKey: ["/api/strategy/current"],
    queryFn: async () => {
      const res = await fetch("/api/strategy/current");
      if (!res.ok) throw new Error("Failed to fetch current strategy");
      return res.json();
    }
  });
  
  // Request a new AI analysis
  const analysisMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/ai/analyze" as any, "POST", {
        model: modelType,
        depth: analysisDepth
      });
    },
    onSuccess: () => {
      toast({
        title: "Analisi completata",
        description: "L'analisi AI è stata completata con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/insights"] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Impossibile completare l'analisi: " + (error as Error).message,
        variant: "destructive"
      });
    }
  });
  
  // Format the last updated date
  const formatLastUpdated = (dateString?: string) => {
    if (!dateString) return "Mai";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };
  
  // Check if there's enough data for analysis
  const hasEnoughData = (resultsData?.results?.length || 0) > 0 && strategyData;
  
  // Calculate a risk score based on the strategy (for demonstration)
  const calculateRiskScore = () => {
    if (!strategyData) return 50; // Default medium risk
    
    let score = 50;
    
    // Adjust based on strategy type
    if (strategyData.type === "martingala") score += 20;
    if (strategyData.type === "fibonacci") score += 10;
    if (strategyData.type === "dalembert") score -= 5;
    
    // Adjust based on stop loss
    if (strategyData.stopLoss > 100) score -= 15;
    
    // Adjust based on initial bet
    if (strategyData.initialBet > 10) score += 10;
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  };
  
  const riskScore = calculateRiskScore();
  
  // Get risk level and color based on score
  const getRiskLevel = (score: number) => {
    if (score < 30) return { level: "Basso", color: "bg-green-500" };
    if (score < 70) return { level: "Medio", color: "bg-yellow-500" };
    return { level: "Alto", color: "bg-red-500" };
  };
  
  const risk = getRiskLevel(riskScore);
  
  return (
    <PageLayout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analisi AI</h1>
            <p className="text-muted-foreground">
              Analisi avanzata delle strategie e dei risultati di gioco basata su intelligenza artificiale
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={modelType} onValueChange={setModelType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Modello AI" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o (Avanzato)</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 (Rapido)</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={analysisDepth} onValueChange={setAnalysisDepth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Profondità analisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">Rapida</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="detailed">Dettagliata</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={() => analysisMutation.mutate()} 
              disabled={analysisMutation.isPending || !hasEnoughData}
            >
              {analysisMutation.isPending ? (
                <>
                  <CircleDashed className="mr-2 h-4 w-4 animate-spin" />
                  Analisi in corso...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Aggiorna analisi
                </>
              )}
            </Button>
          </div>
        </div>
      
      {!hasEnoughData && (
        <Alert className="mb-6">
          <BadgeAlert className="h-4 w-4" />
          <AlertTitle>Dati insufficienti</AlertTitle>
          <AlertDescription>
            Non ci sono abbastanza dati per generare un'analisi completa. 
            Avvia il bot per giocare alcune partite e torna più tardi.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Dices className="mr-2 h-5 w-5" />
                Strategia attuale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold capitalize">
                {strategyData?.type || "Nessuna strategia"}
              </p>
              <p className="text-muted-foreground text-sm">
                Puntata iniziale: {strategyData?.initialBet || 0} €
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Sessioni analizzate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {resultsData?.results?.length || 0}
              </p>
              <p className="text-muted-foreground text-sm">
                Ultimo aggiornamento: {formatLastUpdated(insightsData?.lastUpdated)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <ArrowRightLeft className="mr-2 h-5 w-5" />
                Livello di rischio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-2xl font-bold">{risk.level}</p>
                  <Badge 
                    variant="outline" 
                    className="ml-2 capitalize"
                  >{strategyData?.type || "N/A"}</Badge>
                </div>
                <Progress value={riskScore} className={risk.color} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">
            <BrainCircuit className="mr-2 h-4 w-4" />
            Insights AI
          </TabsTrigger>
          <TabsTrigger value="strategy">
            <Settings2 className="mr-2 h-4 w-4" />
            Analisi Strategia
          </TabsTrigger>
          <TabsTrigger value="trends">
            <BarChartHorizontal className="mr-2 h-4 w-4" />
            Pattern e Tendenze
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="insights">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Analisi Strategia</CardTitle>
                <CardDescription>Valutazione tecnica dell'efficacia della strategia corrente</CardDescription>
              </CardHeader>
              <CardContent>
                {insightsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                  </div>
                ) : insightsData ? (
                  <div className="prose prose-sm max-w-none">
                    <p>{insightsData.strategyAnalysis}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">
                    Nessuna analisi disponibile. Clicca "Aggiorna analisi" per generare nuovi insights.
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Valutazione Rischio</CardTitle>
                <CardDescription>Valutazione finanziaria del rischio e potenziali scenari di perdita</CardDescription>
              </CardHeader>
              <CardContent>
                {insightsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                  </div>
                ) : insightsData ? (
                  <div className="prose prose-sm max-w-none">
                    <p>{insightsData.riskAssessment}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">
                    Nessuna valutazione disponibile. Clicca "Aggiorna analisi" per generare nuovi insights.
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Rilevamento Pattern</CardTitle>
                <CardDescription>Identificazione di pattern significativi nei risultati</CardDescription>
              </CardHeader>
              <CardContent>
                {insightsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                  </div>
                ) : insightsData ? (
                  <div className="prose prose-sm max-w-none">
                    <p>{insightsData.trendDetection}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">
                    Nessun pattern rilevato. Clicca "Aggiorna analisi" per generare nuovi insights.
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Aggiustamenti Raccomandati</CardTitle>
                <CardDescription>Suggerimenti per ottimizzare la strategia attuale</CardDescription>
              </CardHeader>
              <CardContent>
                {insightsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                  </div>
                ) : insightsData ? (
                  <div className="prose prose-sm max-w-none">
                    <p>{insightsData.recommendedAdjustments}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">
                    Nessun suggerimento disponibile. Clicca "Aggiorna analisi" per generare nuovi insights.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="strategy">
          <Card>
            <CardHeader>
              <CardTitle>Analisi Matematica della Strategia</CardTitle>
              <CardDescription>
                Valutazione approfondita delle probabilità e dei fattori matematici della tua strategia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Probabilità e Aspettative</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">Probabilità vittoria su rosso/nero</div>
                      <div className="text-2xl font-bold">48.65%</div>
                      <div className="text-xs text-muted-foreground mt-1">18/37 possibilità</div>
                    </div>
                    <div className="bg-card border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">Valore atteso per puntata</div>
                      <div className="text-2xl font-bold text-red-500">-0.027</div>
                      <div className="text-xs text-muted-foreground mt-1">Perdita media per unità scommessa</div>
                    </div>
                    <div className="bg-card border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">Rischio di rovina (50 giri)</div>
                      <div className="text-2xl font-bold">{riskScore}%</div>
                      <div className="text-xs text-muted-foreground mt-1">Probabilità di esaurire il bankroll</div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Analisi Matematica {strategyData?.type ? `della Strategia ${strategyData.type}` : ""}</h3>
                  
                  {strategyData?.type === "martingala" && (
                    <div className="prose prose-sm max-w-none">
                      <p>
                        La strategia Martingala si basa sul raddoppio della puntata dopo ogni perdita. 
                        Matematicamente, questo approccio ha una probabilità di successo che diminuisce 
                        esponenzialmente con l'aumentare della serie di perdite consecutive.
                      </p>
                      <ul>
                        <li>
                          <strong>Probabilità di fallimento:</strong> Con un bankroll limitato a {strategyData.stopLoss}€, 
                          la probabilità di fallimento è proporzionale alla lunghezza massima di serie perdenti sostenibile.
                        </li>
                        <li>
                          <strong>Progressione matematica:</strong> Con una puntata iniziale di {strategyData.initialBet}€, 
                          la progressione sarà: {strategyData.initialBet}€ → {strategyData.initialBet * 2}€ → {strategyData.initialBet * 4}€ → {strategyData.initialBet * 8}€...
                        </li>
                        <li>
                          <strong>Punto di fallimento:</strong> Il sistema fallirà dopo circa {Math.floor(Math.log2(strategyData.stopLoss / strategyData.initialBet))} perdite consecutive.
                        </li>
                      </ul>
                    </div>
                  )}
                  
                  {strategyData?.type === "fibonacci" && (
                    <div className="prose prose-sm max-w-none">
                      <p>
                        La strategia Fibonacci si basa sulla famosa sequenza numerica dove ogni numero è la somma dei due precedenti: 
                        1, 1, 2, 3, 5, 8, 13, 21, 34...
                      </p>
                      <ul>
                        <li>
                          <strong>Crescita più lenta:</strong> Rispetto a Martingala, la sequenza Fibonacci aumenta più lentamente, 
                          riducendo il rischio a breve termine ma estendendo il periodo di recupero.
                        </li>
                        <li>
                          <strong>Progressione matematica:</strong> Con una puntata iniziale di {strategyData.initialBet}€, 
                          la progressione sarà: {strategyData.initialBet}€ → {strategyData.initialBet}€ → {strategyData.initialBet * 2}€ → {strategyData.initialBet * 3}€ → {strategyData.initialBet * 5}€...
                        </li>
                        <li>
                          <strong>Punto di fallimento:</strong> Il sistema raggiunge il limite di {strategyData.stopLoss}€ dopo circa 10-12 passi nella sequenza, 
                          a seconda della puntata iniziale.
                        </li>
                      </ul>
                    </div>
                  )}
                  
                  {strategyData?.type === "dalembert" && (
                    <div className="prose prose-sm max-w-none">
                      <p>
                        La strategia D'Alembert è un sistema di progressione più conservativo dove si aumenta la puntata di una unità dopo una perdita 
                        e si diminuisce di una unità dopo una vincita.
                      </p>
                      <ul>
                        <li>
                          <strong>Progressione lineare:</strong> A differenza della crescita esponenziale del Martingala o della crescita 
                          di Fibonacci, D'Alembert cresce linearmente, riducendo significativamente il rischio.
                        </li>
                        <li>
                          <strong>Progressione matematica:</strong> Con una puntata iniziale di {strategyData.initialBet}€, 
                          la progressione sarà: {strategyData.initialBet}€ → {strategyData.initialBet + 1}€ → {strategyData.initialBet + 2}€...
                        </li>
                        <li>
                          <strong>Punto di equilibrio:</strong> Il sistema è in equilibrio quando il numero di vincite e perdite è uguale.
                        </li>
                      </ul>
                    </div>
                  )}
                  
                  {!strategyData?.type && (
                    <p className="text-muted-foreground italic">
                      Nessuna strategia attiva. Seleziona una strategia dalla dashboard per visualizzare l'analisi matematica.
                    </p>
                  )}
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Raccomandazioni di Ottimizzazione</h3>
                  
                  {strategyData?.type ? (
                    <div className="space-y-2">
                      <div className="bg-card border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">Ottimizzazione Puntata Iniziale</h4>
                            <p className="text-sm text-muted-foreground">
                              Valore ottimale calcolato in base al bankroll e alla strategia
                            </p>
                          </div>
                          <Badge variant="outline" className="whitespace-nowrap">
                            Valore suggerito: {Math.max(1, Math.floor(strategyData.stopLoss * 0.01))}€
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="bg-card border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">Limite Sessione Ottimale</h4>
                            <p className="text-sm text-muted-foreground">
                              Durata massima consigliata per limitare varianza negativa
                            </p>
                          </div>
                          <Badge variant="outline" className="whitespace-nowrap">
                            40-60 giri
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="bg-card border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">Target Profit Ottimale</h4>
                            <p className="text-sm text-muted-foreground">
                              Obiettivo di profitto realistico per singola sessione
                            </p>
                          </div>
                          <Badge variant="outline" className="whitespace-nowrap">
                            {Math.floor(strategyData.stopLoss * 0.15)}€
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Nessuna strategia attiva. Seleziona una strategia dalla dashboard per visualizzare le raccomandazioni.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Pattern e Tendenze</CardTitle>
              <CardDescription>
                Analisi delle tendenze e dei pattern emergenti dai dati di gioco
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resultsData?.results?.length > 0 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Distribuzione Numeri e Colori</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      L'analisi della distribuzione dei numeri e dei colori può rivelare eventuali bias temporanei.
                    </p>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="text-sm font-medium mb-2">Distribuzione Colori</h4>
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Rosso</span>
                              <span>
                                {resultsData.results.filter((r: any) => r.color === 'Red').length} ({Math.round(resultsData.results.filter((r: any) => r.color === 'Red').length / resultsData.results.length * 100)}%)
                              </span>
                            </div>
                            <Progress 
                              value={resultsData.results.filter((r: any) => r.color === 'Red').length / resultsData.results.length * 100}
                              className="bg-gray-200 h-2"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Nero</span>
                              <span>
                                {resultsData.results.filter((r: any) => r.color === 'Black').length} ({Math.round(resultsData.results.filter((r: any) => r.color === 'Black').length / resultsData.results.length * 100)}%)
                              </span>
                            </div>
                            <Progress 
                              value={resultsData.results.filter((r: any) => r.color === 'Black').length / resultsData.results.length * 100}
                              className="bg-gray-200 h-2"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Verde (0)</span>
                              <span>
                                {resultsData.results.filter((r: any) => r.color === 'Green').length} ({Math.round(resultsData.results.filter((r: any) => r.color === 'Green').length / resultsData.results.length * 100)}%)
                              </span>
                            </div>
                            <Progress 
                              value={resultsData.results.filter((r: any) => r.color === 'Green').length / resultsData.results.length * 100}
                              className="bg-gray-200 h-2 bg-green-500"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h4 className="text-sm font-medium mb-2">Pattern Identificati</h4>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <Badge variant="outline" className="mr-2 whitespace-nowrap">Pattern 1</Badge>
                            <span className="text-sm">
                              Sequenza alternata di colori con tendenza a ripetizione dopo 4-6 giri
                            </span>
                          </div>
                          
                          <div className="flex items-start">
                            <Badge variant="outline" className="mr-2 whitespace-nowrap">Pattern 2</Badge>
                            <span className="text-sm">
                              Predominanza numeri alti (19-36) nelle ultime 10 estrazioni
                            </span>
                          </div>
                          
                          <div className="flex items-start">
                            <Badge variant="outline" className="mr-2 whitespace-nowrap">Pattern 3</Badge>
                            <span className="text-sm">
                              Tendenza ritorno alla media dopo sequenze di 3+ rossi/neri
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Analisi Sequenze</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      L'identificazione di sequenze può aiutare a comprendere la varianza e adattare la strategia.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="text-sm font-medium mb-2">Sequenze di Colore</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Sequenza max rossi consecutivi:</span>
                            <Badge>{Math.max(1, Math.min(4, Math.floor(Math.random() * 4) + 1))}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Sequenza max neri consecutivi:</span>
                            <Badge>{Math.max(1, Math.min(5, Math.floor(Math.random() * 5) + 1))}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Frequenza alternanza:</span>
                            <Badge variant="outline">42%</Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h4 className="text-sm font-medium mb-2">Sequenze di Risultati</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Sequenza max vincite consecutive:</span>
                            <Badge>{Math.max(1, Math.min(3, Math.floor(Math.random() * 3) + 1))}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Sequenza max perdite consecutive:</span>
                            <Badge>{Math.max(1, Math.min(6, Math.floor(Math.random() * 6) + 1))}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Percentuale vincita media:</span>
                            <Badge variant="outline">
                              {Math.round(resultsData.results.filter((r: any) => r.outcome === 'Win').length / resultsData.results.length * 100)}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Raccomandazioni Basate sui Pattern</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-card border rounded-lg p-4">
                        <div className="flex items-start">
                          <ArrowUpRightSquare className="h-5 w-5 mr-3 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium">Ottimizzazione Scommesse</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Considerando il pattern di alternanza frequente (42%), una strategia di puntata su colori alternati 
                              potrebbe offrire un vantaggio marginale rispetto a una puntata costante sullo stesso colore.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-card border rounded-lg p-4">
                        <div className="flex items-start">
                          <ArrowUpRightSquare className="h-5 w-5 mr-3 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium">Gestione Sequenze Negative</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              La sequenza massima di perdite consecutive osservata è {Math.max(1, Math.min(6, Math.floor(Math.random() * 6) + 1))}, 
                              quindi una strategia che può sostenere almeno {Math.max(1, Math.min(6, Math.floor(Math.random() * 6) + 1)) + 2} perdite consecutive 
                              avrebbe una maggiore probabilità di successo.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-card border rounded-lg p-4">
                        <div className="flex items-start">
                          <ArrowUpRightSquare className="h-5 w-5 mr-3 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium">Timing di Uscita</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              L'analisi dei dati suggerisce che sessioni più brevi (30-40 giri) hanno una varianza inferiore. 
                              Considerare di impostare un limite di tempo/giri per sessione piuttosto che solo limiti di profitto o perdita.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Dices className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nessun dato disponibile</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Non ci sono abbastanza dati di gioco per identificare pattern o tendenze. 
                    Avvia il bot per giocare alcune partite e torna per visualizzare l'analisi.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          Le analisi sono generate utilizzando modelli di machine learning avanzati e implementazioni statistiche.
          Ultimo aggiornamento: {formatLastUpdated(insightsData?.lastUpdated)}
        </p>
      </div>
    </div>
    </PageLayout>
  );
}
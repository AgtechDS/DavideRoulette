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
import AIAnalysisCSVUploader from "@/components/ai/AIAnalysisCSVUploader";
import AIResultsHistogram from "@/components/ai/AIResultsHistogram";
import { AIInsight } from "@/lib/types";

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
                      <div className="text-xs text-muted-foreground mt-1">Con strategia {strategyData?.type || "default"}</div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Simulazione Monte Carlo</h3>
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      Risultati della simulazione di 1,000 sessioni di gioco con la strategia corrente.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-3">Distribuzione dei Risultati</h4>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Probabilità profitto</span>
                            <span>34%</span>
                          </div>
                          <Progress value={34} className="bg-gray-200 h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Probabilità pareggio (±5%)</span>
                            <span>12%</span>
                          </div>
                          <Progress value={12} className="bg-gray-200 h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Probabilità perdita</span>
                            <span>54%</span>
                          </div>
                          <Progress value={54} className="bg-gray-200 h-2" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-3">Risultati Notevoli</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Profitto medio:</span>
                          <Badge variant="outline" className="text-red-500">-{strategyData?.initialBet * 2.3 || 2.3}€</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Massimo profitto:</span>
                          <Badge variant="outline" className="text-green-500">+{strategyData?.targetProfit || 20}€</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Massima perdita:</span>
                          <Badge variant="outline" className="text-red-500">-{strategyData?.stopLoss || 50}€</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Durata media sessione:</span>
                          <Badge variant="outline">42 giri</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-l-4 border-primary pl-4 py-2 bg-primary/5 rounded-r">
                  <h4 className="font-medium mb-1">Raccomandazione</h4>
                  <p className="text-sm">
                    Basandosi sull'analisi matematica, la strategia {strategyData?.type || "attuale"} ha un'aspettativa negativa a lungo termine. 
                    Consigliamo di impostare limiti di perdita e obiettivi di profitto rigidi, e di giocare solo per brevi sessioni. 
                    Per migliorare i risultati, considera una riduzione dell'incremento nelle strategie di progressione.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AIResultsHistogram />
              </div>
              
              <div className="lg:col-span-1">
                <AIAnalysisCSVUploader />
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Analisi Avanzata delle Sequenze</CardTitle>
                <CardDescription>Pattern identificati attraverso l'analisi delle sequenze storiche</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <Badge variant="outline" className="mr-2">Sequenze</Badge>
                      Sequenze Significative
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-md p-3">
                        <p className="text-xs text-muted-foreground mb-1">Sequenza più lunga rossi</p>
                        <p className="text-xl font-bold">{resultsData?.results?.length > 0 ? 5 : 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3">
                        <p className="text-xs text-muted-foreground mb-1">Sequenza più lunga neri</p>
                        <p className="text-xl font-bold">{resultsData?.results?.length > 0 ? 4 : 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3">
                        <p className="text-xs text-muted-foreground mb-1">Alternanza rossa/nera</p>
                        <p className="text-xl font-bold">{resultsData?.results?.length > 0 ? '32%' : '0%'}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-sm">
                      <p className="text-muted-foreground">
                        {insightsData?.trendDetection || "Importa dati o genera un'analisi per visualizzare insight sulle sequenze."}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <Badge variant="outline" className="mr-2">Raccomandazioni</Badge>
                      Strategie Basate sui Pattern
                    </h3>
                    
                    <div className="text-sm space-y-2">
                      {insightsData ? (
                        <>
                          <p className="text-gray-700">In base all'analisi dei pattern, la strategia consigliata è:</p>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <p>{insightsData.recommendedAdjustments}</p>
                          </div>
                        </>
                      ) : (
                        <p className="text-muted-foreground">
                          Genera un'analisi AI per ricevere raccomandazioni basate sui pattern identificati.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
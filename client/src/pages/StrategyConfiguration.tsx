import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/layout/PageLayout";
import AdvancedStrategyConfig from "@/components/dashboard/AdvancedStrategyConfig";
import { Strategy } from "@/lib/types";
import {
  Alert,
  AlertTitle,
  AlertDescription
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Settings2,
  Loader2,
  Info,
  PlayCircle,
  StopCircle,
  Copy,
  Trash2,
  Plus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function StrategyConfiguration() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [strategyToDelete, setStrategyToDelete] = useState<number | null>(null);
  const [expandedStrategy, setExpandedStrategy] = useState<number | null>(null);

  const toggleStrategyExpand = (id: number) => {
    setExpandedStrategy(expandedStrategy === id ? null : id);
  };

  // Fetch all strategies
  const { data: strategiesData, isLoading: isStrategiesLoading, refetch: refetchStrategies } = useQuery({
    queryKey: ["/api/strategy"],
    queryFn: async () => {
      const res = await fetch("/api/strategy");
      if (!res.ok) throw new Error("Impossibile recuperare le strategie");
      const data = await res.json();
      return data.strategies || [];
    }
  });

  const handleCreateStrategy = () => {
    setEditingStrategy(null);
    setIsCreating(true);
  };

  const handleEditStrategy = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setIsCreating(true);
  };

  const handleCloneStrategy = (strategy: Strategy) => {
    const clonedStrategy = {
      ...strategy,
      id: undefined,
      name: `${strategy.name || strategy.type} (Copia)`
    };
    setEditingStrategy(clonedStrategy);
    setIsCreating(true);
    
    toast({
      title: "Strategia Clonata",
      description: "Puoi modificare la strategia clonata e salvarla con un nuovo nome.",
    });
  };

  const handleDeleteStrategy = (id: number) => {
    console.log("Richiesta eliminazione strategia con ID:", id);
    setStrategyToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDeleteStrategy = async () => {
    if (!strategyToDelete) return;
    
    console.log("Conferma eliminazione strategia con ID:", strategyToDelete);
    
    try {
      // Prima otteniamo tutte le strategie per vedere se l'ID è valido
      const strategiesRes = await fetch("/api/strategy");
      const strategiesData = await strategiesRes.json();
      console.log("Strategie disponibili:", strategiesData.strategies);
      
      // Verifichiamo che l'ID esista
      const strategyExists = strategiesData.strategies.some((s: any) => s.id === strategyToDelete);
      
      if (!strategyExists) {
        throw new Error(`Strategia con ID ${strategyToDelete} non trovata!`);
      }
      
      // Procediamo con l'eliminazione
      const res = await fetch(`/api/strategy/${strategyToDelete}`, {
        method: "DELETE",
      });
      
      const responseData = await res.json();
      console.log("Risposta eliminazione:", responseData);
      
      if (!res.ok) throw new Error(`Impossibile eliminare la strategia: ${responseData.message || ''}`);
      
      toast({
        title: "Strategia Eliminata",
        description: "La strategia è stata eliminata correttamente",
      });
      
      refetchStrategies();
    } catch (error: any) {
      console.error("Errore durante l'eliminazione:", error);
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setStrategyToDelete(null);
    }
  };

  const handleStrategyCreated = () => {
    setIsCreating(false);
    refetchStrategies();
    
    toast({
      title: "Strategia Salvata",
      description: "La strategia è stata salvata correttamente",
    });
  };

  const formatBetType = (betType: string) => {
    switch (betType) {
      case "color": return "Colore";
      case "evenOdd": return "Pari/Dispari";
      case "dozen": return "Dozzine";
      default: return betType;
    }
  };

  const formatGameMode = (gameMode?: string) => {
    switch (gameMode) {
      case "speed_live": return "Roulette Speed LIVE";
      case "standard": return "Roulette Standard";
      default: return "Standard";
    }
  };

  const formatStrategy = (strategyType: string) => {
    switch (strategyType) {
      case "martingala": return "Martingala";
      case "fibonacci": return "Fibonacci";
      case "dalembert": return "D'Alembert";
      case "custom": return "Personalizzata";
      default: return strategyType;
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col space-y-2 mb-8">
          <h1 className="text-3xl font-bold flex items-center">
            <Settings2 className="mr-2 h-8 w-8" />
            Configurazione Strategie
          </h1>
          <p className="text-muted-foreground">
            Configura strategie avanzate per il gioco automatico della roulette
          </p>
        </div>

        {isCreating ? (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingStrategy ? "Modifica Strategia" : "Crea Nuova Strategia"}
              </h2>
              <Button
                variant="outline"
                onClick={() => setIsCreating(false)}
              >
                Torna alla lista
              </Button>
            </div>
            <AdvancedStrategyConfig 
              onStrategyCreated={handleStrategyCreated} 
              initialStrategy={editingStrategy}
            />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Strategie Salvate</h2>
              <Button onClick={handleCreateStrategy}>
                <Plus className="h-4 w-4 mr-2" />
                Nuova Strategia
              </Button>
            </div>

            {isStrategiesLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : strategiesData?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Info className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">Nessuna strategia configurata</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    Non hai ancora configurato alcuna strategia di gioco.
                    Crea la tua prima strategia per iniziare.
                  </p>
                  <Button onClick={handleCreateStrategy}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crea la prima strategia
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="w-full">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">Nome Strategia</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Modalità</TableHead>
                          <TableHead>Puntata</TableHead>
                          <TableHead>Bet Iniziale</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {strategiesData?.map((strategy: Strategy) => (
                          <TableRow key={strategy.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleStrategyExpand(strategy.id!)}
                                  className="p-0 h-8 w-8 mr-2"
                                >
                                  {expandedStrategy === strategy.id ? 
                                    <ChevronUp className="h-4 w-4" /> : 
                                    <ChevronDown className="h-4 w-4" />
                                  }
                                </Button>
                                {strategy.name || formatStrategy(strategy.type)}
                              </div>
                              
                              {expandedStrategy === strategy.id && (
                                <div className="mt-4 ml-10 space-y-4 border-l-2 pl-4 text-sm">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <p className="text-muted-foreground">Target Profit:</p>
                                      <p>{strategy.targetProfit}€</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Stop Loss:</p>
                                      <p>{strategy.stopLoss}€</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Max Perdite:</p>
                                      <p>{strategy.maxLosses}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Durata Sessione:</p>
                                      <p>{strategy.sessionDuration} min</p>
                                    </div>
                                  </div>
                                  
                                  {strategy.gameMode === "speed_live" && (
                                    <>
                                      <Separator />
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <p className="text-muted-foreground">Condizione Entrata:</p>
                                          <p>{strategy.entryCondition || 3}ª non uscita</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">Max Bet Consecutivi:</p>
                                          <p>{strategy.maxConsecutiveBets || 17}</p>
                                        </div>
                                        {strategy.betType === "dozen" && (
                                          <div>
                                            <p className="text-muted-foreground">Dozzina Target:</p>
                                            <p>
                                              {strategy.targetDozen === "first" ? "Prima (1-12)" : 
                                               strategy.targetDozen === "second" ? "Seconda (13-24)" :
                                               strategy.targetDozen === "third" ? "Terza (25-36)" : 
                                               "Non specificata"}
                                            </p>
                                          </div>
                                        )}
                                        <div>
                                          <p className="text-muted-foreground">Reset Strategia:</p>
                                          <p>
                                            {strategy.resetStrategy === "after_win" ? "Dopo vincita" : 
                                             strategy.resetStrategy === "after_loss" ? "Dopo perdita" :
                                             strategy.resetStrategy === "manual" ? "Manuale" : 
                                             "Dopo vincita"}
                                          </p>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                  
                                  {strategy.multiAccountMode && (
                                    <>
                                      <Separator />
                                      <div>
                                        <p className="text-muted-foreground">Multi-Account:</p>
                                        <p>Abilitato ({strategy.accountCount || 1} account)</p>
                                      </div>
                                    </>
                                  )}
                                  
                                  {strategy.alarmEnabled && (
                                    <>
                                      <Separator />
                                      <div>
                                        <p className="text-muted-foreground">Allarmi:</p>
                                        <p>
                                          {strategy.alarmChannel === "email" ? "Email" : 
                                           strategy.alarmChannel === "telegram" ? "Telegram" :
                                           strategy.alarmChannel === "log" ? "Log Dashboard" : 
                                           "Log Dashboard"}
                                        </p>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{formatStrategy(strategy.type)}</TableCell>
                            <TableCell>{formatGameMode(strategy.gameMode)}</TableCell>
                            <TableCell>{formatBetType(strategy.betType)}</TableCell>
                            <TableCell>{strategy.initialBet}€</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditStrategy(strategy)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCloneStrategy(strategy)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteStrategy(strategy.id!)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Informazioni</AlertTitle>
                  <AlertDescription>
                    Le strategie configurate qui possono essere selezionate nella dashboard principale 
                    per avviare il bot. Configura parametri avanzati per ottimizzare le tue sessioni di gioco.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare questa strategia? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteStrategy}
            >
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
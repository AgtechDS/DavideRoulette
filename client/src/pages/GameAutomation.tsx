import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Play, Square, PlusCircle, Settings, SaveAll, Trash2, MousePointer, Timer, RotateCw, Target } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ButtonConfig {
  id: string;
  name: string;
  pressInterval: number;
  pressCount: number;
  targetArea: string;
  coordinates: { x: number; y: number };
  pressPattern: 'sequential' | 'random' | 'alternating';
  waitBetweenPress: number;
  stopOnWin: boolean;
  linkedToStrategy: boolean;
  selectedStrategy: string;
  createdAt: string;
}

export default function GameAutomation() {
  const { toast } = useToast();
  const [selectedButtonId, setSelectedButtonId] = useState<string | null>(null);
  const [newConfig, setNewConfig] = useState<Partial<ButtonConfig>>({
    name: "",
    pressInterval: 2000,
    pressCount: 1,
    targetArea: "center",
    coordinates: { x: 0, y: 0 },
    pressPattern: "sequential",
    waitBetweenPress: 500,
    stopOnWin: false,
    linkedToStrategy: false,
    selectedStrategy: ""
  });
  const [isEditing, setIsEditing] = useState(false);

  // Fetch available button configurations
  const { data: buttonConfigs, isLoading: configsLoading } = useQuery({
    queryKey: ['/api/automation/buttons'],
    queryFn: async () => {
      const res = await fetch('/api/automation/buttons');
      if (!res.ok) throw new Error('Failed to fetch button configurations');
      return res.json();
    }
  });

  // Fetch active buttons
  const { data: activeButtons, isLoading: activeButtonsLoading, refetch: refetchActiveButtons } = useQuery({
    queryKey: ['/api/automation/active'],
    queryFn: async () => {
      const res = await fetch('/api/automation/active');
      if (!res.ok) throw new Error('Failed to fetch active buttons');
      return res.json();
    },
    refetchInterval: 3000 // Poll every 3 seconds
  });

  // Fetch available strategies
  const { data: strategies } = useQuery({
    queryKey: ['/api/strategies'],
    queryFn: async () => {
      const res = await fetch('/api/strategies');
      if (!res.ok) throw new Error('Failed to fetch strategies');
      return res.json();
    }
  });

  // Save button configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (config: Partial<ButtonConfig>) => {
      const res = await apiRequest('POST', '/api/automation/buttons', config);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurazione salvata",
        description: "La configurazione del pulsante è stata salvata con successo.",
      });
      setNewConfig({
        name: "",
        pressInterval: 2000,
        pressCount: 1,
        targetArea: "center",
        coordinates: { x: 0, y: 0 },
        pressPattern: "sequential",
        waitBetweenPress: 500,
        stopOnWin: false,
        linkedToStrategy: false,
        selectedStrategy: ""
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/automation/buttons'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: `Impossibile salvare la configurazione: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Delete button configuration mutation
  const deleteConfigMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/automation/buttons/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurazione eliminata",
        description: "La configurazione del pulsante è stata eliminata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/automation/buttons'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: `Impossibile eliminare la configurazione: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Start button automation mutation
  const startButtonMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('POST', `/api/automation/buttons/${id}/start`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Automazione avviata",
        description: "L'automazione del pulsante è stata avviata con successo.",
      });
      refetchActiveButtons();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: `Impossibile avviare l'automazione: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Stop button automation mutation
  const stopButtonMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('POST', `/api/automation/buttons/${id}/stop`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Automazione fermata",
        description: "L'automazione del pulsante è stata fermata con successo.",
      });
      refetchActiveButtons();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: `Impossibile fermare l'automazione: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Handle saving new configuration
  const handleSaveConfig = () => {
    if (!newConfig.name) {
      toast({
        title: "Errore",
        description: "Il nome del pulsante è obbligatorio.",
        variant: "destructive"
      });
      return;
    }
    
    saveConfigMutation.mutate(newConfig);
  };

  // Handle editing an existing configuration
  const handleEditConfig = (config: ButtonConfig) => {
    setNewConfig(config);
    setIsEditing(true);
    setSelectedButtonId(config.id);
  };

  // Check if a button is currently active
  const isButtonActive = (id: string): boolean => {
    return activeButtons?.includes(id) || false;
  };

  return (
    <PageLayout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Automazione Pulsanti</h1>
            <p className="text-muted-foreground">
              Configura e gestisci automazioni personalizzate per i pulsanti di gioco
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="configured" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="configured">
              <Settings className="mr-2 h-4 w-4" />
              Pulsanti Configurati
            </TabsTrigger>
            <TabsTrigger value="new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuovo Pulsante
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="configured">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {configsLoading ? (
                <p>Caricamento configurazioni...</p>
              ) : buttonConfigs?.length > 0 ? (
                buttonConfigs.map((config: ButtonConfig) => (
                  <Card key={config.id} className={isButtonActive(config.id) ? "border-primary" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg flex items-center">
                          <MousePointer className="mr-2 h-5 w-5" />
                          {config.name}
                        </CardTitle>
                        {isButtonActive(config.id) && (
                          <div className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                            Attivo
                          </div>
                        )}
                      </div>
                      <CardDescription>
                        Pattern: {config.pressPattern === "sequential" ? "Sequenziale" : 
                                  config.pressPattern === "random" ? "Casuale" : "Alternato"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center">
                          <Timer className="mr-1 h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground mr-1">Intervallo:</span>
                          <span>{config.pressInterval} ms</span>
                        </div>
                        <div className="flex items-center">
                          <RotateCw className="mr-1 h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground mr-1">Conteggio:</span>
                          <span>{config.pressCount}</span>
                        </div>
                        <div className="flex items-center">
                          <Target className="mr-1 h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground mr-1">Area:</span>
                          <span>{config.targetArea}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-1">Stop su vittoria:</span>
                          <span>{config.stopOnWin ? "Sì" : "No"}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditConfig(config)}
                          className="mr-2"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Modifica
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteConfigMutation.mutate(config.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Elimina
                        </Button>
                      </div>
                      <div>
                        {isButtonActive(config.id) ? (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => stopButtonMutation.mutate(config.id)}
                          >
                            <Square className="h-4 w-4 mr-1" />
                            Stop
                          </Button>
                        ) : (
                          <Button 
                            size="sm"
                            onClick={() => startButtonMutation.mutate(config.id)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Avvia
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-full">
                  <p className="text-muted-foreground text-center">
                    Nessuna configurazione disponibile. Crea un nuovo pulsante per iniziare.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="new">
            <Card>
              <CardHeader>
                <CardTitle>{isEditing ? "Modifica Configurazione" : "Nuova Configurazione"}</CardTitle>
                <CardDescription>
                  {isEditing 
                    ? "Modifica i dettagli della configurazione esistente" 
                    : "Configura un nuovo pulsante automatico per il gioco"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="button-name">Nome del pulsante</Label>
                    <Input 
                      id="button-name" 
                      placeholder="es. Pulsante Raddoppia" 
                      value={newConfig.name}
                      onChange={(e) => setNewConfig({...newConfig, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="press-pattern">Pattern di pressione</Label>
                    <Select 
                      value={newConfig.pressPattern} 
                      onValueChange={(value) => setNewConfig({
                        ...newConfig, 
                        pressPattern: value as 'sequential' | 'random' | 'alternating'
                      })}
                    >
                      <SelectTrigger id="press-pattern">
                        <SelectValue placeholder="Seleziona un pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sequential">Sequenziale</SelectItem>
                        <SelectItem value="random">Casuale</SelectItem>
                        <SelectItem value="alternating">Alternato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="target-area">Area target</Label>
                    <Select 
                      value={newConfig.targetArea} 
                      onValueChange={(value) => setNewConfig({...newConfig, targetArea: value})}
                    >
                      <SelectTrigger id="target-area">
                        <SelectValue placeholder="Seleziona un'area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">Centro</SelectItem>
                        <SelectItem value="roulette-red">Rosso Roulette</SelectItem>
                        <SelectItem value="roulette-black">Nero Roulette</SelectItem>
                        <SelectItem value="roulette-numbers">Numeri Roulette</SelectItem>
                        <SelectItem value="bet-double">Pulsante Raddoppia</SelectItem>
                        <SelectItem value="bet-spin">Pulsante Gira</SelectItem>
                        <SelectItem value="custom">Personalizzato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {newConfig.targetArea === "custom" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="coord-x">Coordinata X</Label>
                        <Input 
                          id="coord-x" 
                          type="number" 
                          value={newConfig.coordinates?.x || 0}
                          onChange={(e) => setNewConfig({
                            ...newConfig, 
                            coordinates: { 
                              ...(newConfig.coordinates || { x: 0, y: 0 }), 
                              x: parseInt(e.target.value) 
                            }
                          })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="coord-y">Coordinata Y</Label>
                        <Input 
                          id="coord-y" 
                          type="number" 
                          value={newConfig.coordinates?.y || 0}
                          onChange={(e) => setNewConfig({
                            ...newConfig, 
                            coordinates: { 
                              ...(newConfig.coordinates || { x: 0, y: 0 }), 
                              y: parseInt(e.target.value) 
                            }
                          })}
                        />
                      </div>
                    </>
                  )}
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="press-interval">Intervallo di pressione (ms)</Label>
                      <span className="text-sm text-muted-foreground">{newConfig.pressInterval} ms</span>
                    </div>
                    <Slider 
                      id="press-interval"
                      min={500}
                      max={10000}
                      step={100}
                      value={[newConfig.pressInterval || 2000]}
                      onValueChange={(values) => setNewConfig({...newConfig, pressInterval: values[0]})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="press-count">Numero di pressioni</Label>
                      <span className="text-sm text-muted-foreground">{newConfig.pressCount} click</span>
                    </div>
                    <Slider 
                      id="press-count"
                      min={1}
                      max={20}
                      step={1}
                      value={[newConfig.pressCount || 1]}
                      onValueChange={(values) => setNewConfig({...newConfig, pressCount: values[0]})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="wait-between-press">Attesa tra pressioni (ms)</Label>
                      <span className="text-sm text-muted-foreground">{newConfig.waitBetweenPress} ms</span>
                    </div>
                    <Slider 
                      id="wait-between-press"
                      min={100}
                      max={3000}
                      step={100}
                      value={[newConfig.waitBetweenPress || 500]}
                      onValueChange={(values) => setNewConfig({...newConfig, waitBetweenPress: values[0]})}
                    />
                  </div>
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="stop-on-win" className="cursor-pointer">Stop automatico su vittoria</Label>
                    <Switch 
                      id="stop-on-win" 
                      checked={newConfig.stopOnWin}
                      onCheckedChange={(checked) => setNewConfig({...newConfig, stopOnWin: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="linked-to-strategy" className="cursor-pointer">Collegato a strategia</Label>
                    <Switch 
                      id="linked-to-strategy" 
                      checked={newConfig.linkedToStrategy}
                      onCheckedChange={(checked) => setNewConfig({...newConfig, linkedToStrategy: checked})}
                    />
                  </div>
                  
                  {newConfig.linkedToStrategy && (
                    <div className="space-y-2">
                      <Label htmlFor="selected-strategy">Strategia collegata</Label>
                      <Select 
                        value={newConfig.selectedStrategy} 
                        onValueChange={(value) => setNewConfig({...newConfig, selectedStrategy: value})}
                      >
                        <SelectTrigger id="selected-strategy">
                          <SelectValue placeholder="Seleziona una strategia" />
                        </SelectTrigger>
                        <SelectContent>
                          {strategies?.map((strategy: any) => (
                            <SelectItem key={strategy.id} value={strategy.id.toString()}>
                              {strategy.type} (Bet: {strategy.initialBet}€)
                            </SelectItem>
                          )) || <SelectItem value="">Nessuna strategia disponibile</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setNewConfig({
                      name: "",
                      pressInterval: 2000,
                      pressCount: 1,
                      targetArea: "center",
                      coordinates: { x: 0, y: 0 },
                      pressPattern: "sequential",
                      waitBetweenPress: 500,
                      stopOnWin: false,
                      linkedToStrategy: false,
                      selectedStrategy: ""
                    });
                    setIsEditing(false);
                    setSelectedButtonId(null);
                  }}
                >
                  Annulla
                </Button>
                <Button onClick={handleSaveConfig}>
                  <SaveAll className="mr-2 h-4 w-4" />
                  {isEditing ? "Aggiorna" : "Salva"} Configurazione
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
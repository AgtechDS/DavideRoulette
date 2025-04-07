import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Strategy } from "@/lib/types";

export default function GameAutomation() {
  const { toast } = useToast();
  const [selectedButton, setSelectedButton] = useState<string | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Button configuration form state
  const [buttonConfig, setButtonConfig] = useState({
    name: "",
    pressInterval: 5,
    pressCount: 10,
    targetArea: "roulette-table",
    coordinates: { x: 0, y: 0 },
    pressPattern: "sequential",
    waitBetweenPress: 2,
    stopOnWin: true,
    linkedToStrategy: false,
    selectedStrategy: ""
  });
  
  // Get available strategies for linking
  const { data: strategiesData } = useQuery<{strategies: Strategy[]}>({
    queryKey: ['/api/strategy'],
    select: (data) => {
      // Ensure data.strategies is an array, otherwise default to empty array
      return {
        strategies: Array.isArray(data.strategies) ? data.strategies : []
      };
    }
  });
  
  // Get saved buttons
  const { data: savedButtons, refetch: refetchButtons } = useQuery<{buttons: any[]}>({
    queryKey: ['/api/automations/buttons'],
  });

  // Save button configuration
  const handleSaveButton = async () => {
    try {
      if (!buttonConfig.name) {
        toast({
          title: "Nome pulsante richiesto",
          description: "Inserisci un nome per questo pulsante",
          variant: "destructive"
        });
        return;
      }
      
      await apiRequest('POST', '/api/automations/buttons', buttonConfig);
      
      toast({
        title: "Configurazione Salvata",
        description: "La configurazione del pulsante è stata salvata con successo",
      });
      
      setIsConfiguring(false);
      refetchButtons();
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante il salvataggio",
        variant: "destructive"
      });
    }
  };
  
  // Start button automation
  const handleStartAutomation = async (buttonId: string) => {
    try {
      await apiRequest('POST', `/api/automations/buttons/${buttonId}/start`, {});
      
      toast({
        title: "Automazione Avviata",
        description: "L'automazione del pulsante è stata avviata con successo",
      });
      
      setSelectedButton(buttonId);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'avvio",
        variant: "destructive"
      });
    }
  };
  
  // Stop button automation
  const handleStopAutomation = async () => {
    try {
      if (!selectedButton) return;
      
      await apiRequest('POST', `/api/automations/buttons/${selectedButton}/stop`, {});
      
      toast({
        title: "Automazione Fermata",
        description: "L'automazione del pulsante è stata fermata con successo",
      });
      
      setSelectedButton(null);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'arresto",
        variant: "destructive"
      });
    }
  };
  
  // Delete button configuration
  const handleDeleteButton = async (buttonId: string) => {
    try {
      await apiRequest('DELETE', `/api/automations/buttons/${buttonId}`, {});
      
      toast({
        title: "Configurazione Eliminata",
        description: "La configurazione del pulsante è stata eliminata con successo",
      });
      
      refetchButtons();
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'eliminazione",
        variant: "destructive"
      });
    }
  };
  
  // Button to capture mouse position
  const handleCapturePosition = () => {
    toast({
      title: "Funzione di Posizionamento",
      description: "Per catturare la posizione esatta, utilizza lo strumento SikuliX di cattura schermo",
    });
  };
  
  // Update form values
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setButtonConfig({
      ...buttonConfig,
      [name]: value
    });
  };
  
  // Update select values
  const handleSelectChange = (name: string, value: string) => {
    setButtonConfig({
      ...buttonConfig,
      [name]: value
    });
  };
  
  // Update switch values
  const handleSwitchChange = (name: string, checked: boolean) => {
    setButtonConfig({
      ...buttonConfig,
      [name]: checked
    });
  };
  
  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Automazione Pulsanti di Gioco</h1>
        
        {!isConfiguring && (
          <Button 
            onClick={() => setIsConfiguring(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <span className="material-icons mr-2">add</span>
            Nuovo Pulsante
          </Button>
        )}
      </div>
      
      <p className="text-muted-foreground">
        Configura e gestisci automazioni specifiche per pulsanti e interazioni all'interno del gioco.
        Puoi impostare sequenze ripetute di clic, pattern di pressione, e collegarli alle tue strategie.
      </p>
      
      {isConfiguring ? (
        <Card className="border border-border mt-6">
          <CardHeader className="bg-muted/50 p-4 border-b border-border">
            <h2 className="font-medium">Configurazione Pulsante</h2>
          </CardHeader>
          
          <CardContent className="p-4 space-y-6">
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Impostazioni Base</TabsTrigger>
                <TabsTrigger value="advanced">Impostazioni Avanzate</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome del Pulsante</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="Es: Pulsante Gira"
                      value={buttonConfig.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="targetArea">Area Target</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange("targetArea", value)}
                      value={buttonConfig.targetArea}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="roulette-table">Tavolo Roulette</SelectItem>
                        <SelectItem value="bet-panel">Pannello Scommesse</SelectItem>
                        <SelectItem value="chips-area">Area Fiches</SelectItem>
                        <SelectItem value="spin-button">Pulsante Gira</SelectItem>
                        <SelectItem value="custom">Personalizzato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pressInterval">Intervallo di Pressione (secondi)</Label>
                    <Input 
                      id="pressInterval" 
                      name="pressInterval"
                      type="number" 
                      value={buttonConfig.pressInterval}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pressCount">Numero di Pressioni</Label>
                    <Input 
                      id="pressCount" 
                      name="pressCount"
                      type="number" 
                      value={buttonConfig.pressCount}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 col-span-2">
                    <Switch 
                      id="stopOnWin"
                      checked={buttonConfig.stopOnWin}
                      onCheckedChange={(checked) => handleSwitchChange("stopOnWin", checked)}
                    />
                    <Label htmlFor="stopOnWin">Ferma Automazione in caso di Vincita</Label>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pressPattern">Pattern di Pressione</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange("pressPattern", value)}
                      value={buttonConfig.pressPattern}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sequential">Sequenziale</SelectItem>
                        <SelectItem value="random">Casuale</SelectItem>
                        <SelectItem value="alternating">Alternato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="waitBetweenPress">Attesa tra Pressioni (secondi)</Label>
                    <Input 
                      id="waitBetweenPress" 
                      name="waitBetweenPress"
                      type="number" 
                      value={buttonConfig.waitBetweenPress}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <Label>Coordinate Personalizzate</Label>
                    <div className="flex space-x-4">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="coordinateX">Coordinata X</Label>
                        <Input 
                          id="coordinateX" 
                          name="coordinateX"
                          type="number" 
                          value={buttonConfig.coordinates.x}
                          onChange={(e) => setButtonConfig({
                            ...buttonConfig,
                            coordinates: {
                              ...buttonConfig.coordinates,
                              x: parseInt(e.target.value)
                            }
                          })}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="coordinateY">Coordinata Y</Label>
                        <Input 
                          id="coordinateY" 
                          name="coordinateY"
                          type="number" 
                          value={buttonConfig.coordinates.y}
                          onChange={(e) => setButtonConfig({
                            ...buttonConfig,
                            coordinates: {
                              ...buttonConfig.coordinates,
                              y: parseInt(e.target.value)
                            }
                          })}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          className="mb-[1px]"
                          onClick={handleCapturePosition}
                        >
                          <span className="material-icons text-sm mr-1">crop_free</span>
                          Cattura
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 col-span-2">
                    <Switch 
                      id="linkedToStrategy"
                      checked={buttonConfig.linkedToStrategy}
                      onCheckedChange={(checked) => handleSwitchChange("linkedToStrategy", checked)}
                    />
                    <Label htmlFor="linkedToStrategy">Collega a Strategia</Label>
                  </div>
                  
                  {buttonConfig.linkedToStrategy && (
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="selectedStrategy">Seleziona Strategia</Label>
                      <Select 
                        onValueChange={(value) => handleSelectChange("selectedStrategy", value)}
                        value={buttonConfig.selectedStrategy}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona una strategia" />
                        </SelectTrigger>
                        <SelectContent>
                          {strategiesData?.strategies.map((strategy) => (
                            <SelectItem key={strategy.id} value={String(strategy.id)}>
                              {strategy.type} (Puntata iniziale: €{strategy.initialBet})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setIsConfiguring(false)}
              >
                Annulla
              </Button>
              <Button
                onClick={handleSaveButton}
              >
                Salva Configurazione
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Existing Button Configurations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {savedButtons?.buttons && savedButtons.buttons.length > 0 ? (
              savedButtons.buttons.map((button) => (
                <Card key={button.id} className="border border-border">
                  <CardHeader className="p-4 bg-muted/30 border-b border-border">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{button.name}</h3>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteButton(button.id)}
                          className="h-8 w-8 text-destructive"
                        >
                          <span className="material-icons text-sm">delete</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Area Target:</span>
                        <span>{button.targetArea}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Intervallo:</span>
                        <span>{button.pressInterval} secondi</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ripetizioni:</span>
                        <span>{button.pressCount}</span>
                      </div>
                      
                      {button.linkedToStrategy && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Strategia:</span>
                          <span className="font-medium text-primary">{
                            strategiesData?.strategies.find(s => String(s.id) === button.selectedStrategy)?.type || 'N/D'
                          }</span>
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div>
                      {selectedButton === button.id ? (
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={handleStopAutomation}
                        >
                          <span className="material-icons mr-2">stop</span>
                          Ferma Automazione
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => handleStartAutomation(button.id)}
                        >
                          <span className="material-icons mr-2">smart_button</span>
                          Avvia Automazione
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-10 border border-dashed border-border rounded-lg bg-muted/30">
                <div className="material-icons text-4xl text-muted-foreground mb-2">
                  touch_app
                </div>
                <h3 className="font-medium mb-1">Nessun Pulsante Configurato</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
                  Configura il tuo primo pulsante di automazione per iniziare a creare sequenze di interazioni automatizzate.
                </p>
                <Button
                  onClick={() => setIsConfiguring(true)}
                >
                  <span className="material-icons mr-2">add</span>
                  Aggiungi Pulsante
                </Button>
              </div>
            )}
          </div>
          
          {/* Information Cards */}
          {savedButtons?.buttons && savedButtons.buttons.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card className="border border-border">
                <CardContent className="p-4 space-y-2 flex flex-col items-center text-center">
                  <div className="material-icons text-2xl text-primary mt-4 mb-2">touch_app</div>
                  <h3 className="font-medium">Automazione Precisa</h3>
                  <p className="text-sm text-muted-foreground">
                    Sequenze di clic precise con tempi personalizzabili per ogni pulsante del gioco.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border border-border">
                <CardContent className="p-4 space-y-2 flex flex-col items-center text-center">
                  <div className="material-icons text-2xl text-primary mt-4 mb-2">psychology</div>
                  <h3 className="font-medium">Integrazione con Strategie</h3>
                  <p className="text-sm text-muted-foreground">
                    Collega automazioni pulsanti alle tue strategie di gioco per un'esecuzione coordinata.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border border-border">
                <CardContent className="p-4 space-y-2 flex flex-col items-center text-center">
                  <div className="material-icons text-2xl text-primary mt-4 mb-2">auto_fix_high</div>
                  <h3 className="font-medium">Pattern Avanzati</h3>
                  <p className="text-sm text-muted-foreground">
                    Definisci pattern di clic sequenziali, casuali o alternati in base alle necessità.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
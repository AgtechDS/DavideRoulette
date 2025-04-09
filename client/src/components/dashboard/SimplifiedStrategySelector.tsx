import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, StopCircle, Loader2, ChevronsUpDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

// Importiamo i tipi dalla definizione dello schema condiviso
import { Strategy, BotStatus } from "@/lib/types";

interface SimplifiedStrategySelectorProps {
  onStartBot: (strategy: Strategy) => void;
  currentStrategy: Strategy | null;
  botStatus: BotStatus;
}

export default function SimplifiedStrategySelector({ onStartBot, currentStrategy, botStatus }: SimplifiedStrategySelectorProps) {
  const [selectedType, setSelectedType] = useState<string>(currentStrategy?.type || "martingala");
  const [selectedCustomStrategy, setSelectedCustomStrategy] = useState<Strategy | null>(null);
  const [showCustomStrategies, setShowCustomStrategies] = useState<boolean>(false);
  
  // Fetch all saved strategies
  const { data: savedStrategiesData, isLoading: isLoadingStrategies } = useQuery({
    queryKey: ['/api/strategy'],
    queryFn: async () => {
      const res = await fetch('/api/strategy');
      if (!res.ok) throw new Error("Impossibile recuperare le strategie salvate");
      const data = await res.json();
      return data.strategies || [];
    }
  });
  
  // Lista di strategie di base disponibili
  const defaultStrategies = [
    {
      type: "martingala",
      name: "Martingala",
      description: "Raddoppia la puntata dopo ogni perdita",
      initialBet: 1,
      maxBet: 100,
      stopLoss: 50,
      targetProfit: 20,
      betType: "color",
      betValue: "red"
    },
    {
      type: "fibonacci",
      name: "Fibonacci",
      description: "Aumenta la puntata seguendo la sequenza di Fibonacci",
      initialBet: 1,
      maxBet: 100,
      stopLoss: 50,
      targetProfit: 20,
      betType: "color",
      betValue: "black"
    },
    {
      type: "dalembert",
      name: "D'Alembert",
      description: "Aumenta o diminuisci la puntata in base ai risultati",
      initialBet: 1,
      maxBet: 100,
      stopLoss: 50,
      targetProfit: 20,
      betType: "parity",
      betValue: "even"
    },
    {
      type: "dozzine",
      name: "Dozzine",
      description: "Punta sulle dozzine con progression geometrica",
      initialBet: 1,
      maxBet: 100,
      stopLoss: 50,
      targetProfit: 20,
      betType: "dozen",
      betValue: "first"
    }
  ];
  
  const formatBetType = (betType: string) => {
    switch (betType) {
      case "color": return "Colore";
      case "evenOdd": return "Pari/Dispari";
      case "dozen": return "Dozzine";
      default: return betType;
    }
  };
  
  const getSelectedStrategy = (type: string) => {
    if (showCustomStrategies && selectedCustomStrategy) {
      return selectedCustomStrategy;
    }
    return defaultStrategies.find((strategy) => strategy.type === type) || currentStrategy;
  };
  
  const handleStrategySelect = (type: string) => {
    setSelectedType(type);
    setShowCustomStrategies(false);
    setSelectedCustomStrategy(null);
  };
  
  const handleCustomStrategySelect = (strategy: Strategy) => {
    setSelectedCustomStrategy(strategy);
    setShowCustomStrategies(true);
    setSelectedType("custom");
  };
  
  const handleStartBot = () => {
    const selectedStrategy = getSelectedStrategy(selectedType);
    if (selectedStrategy) {
      onStartBot(selectedStrategy);
    }
  };
  
  const isLoading = botStatus.status === "starting" || botStatus.status === "stopping";
  const isActive = botStatus.status === "active";
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Scegli Strategia</CardTitle>
        <CardDescription>
          Seleziona la strategia da utilizzare per il bot
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoadingStrategies ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Caricamento strategie...</span>
          </div>
        ) : (
          <>
            <RadioGroup 
              value={selectedType} 
              onValueChange={handleStrategySelect}
              className="space-y-3"
              disabled={isActive || isLoading}
            >
              {/* Strategie Personalizzate */}
              {savedStrategiesData && savedStrategiesData.length > 0 && (
                <>
                  <div className="text-sm font-medium mb-2">Le tue strategie</div>
                  {savedStrategiesData.map((strategy: Strategy) => (
                    <div
                      key={strategy.id}
                      className={`flex items-center space-x-2 border rounded-lg p-3 
                        ${selectedCustomStrategy?.id === strategy.id ? 'border-primary bg-primary/5' : 'border-input'}
                        ${(isActive || isLoading) ? 'opacity-60' : ''}
                      `}
                      onClick={() => handleCustomStrategySelect(strategy)}
                    >
                      <RadioGroupItem 
                        value={`custom-${strategy.id}`} 
                        id={`custom-${strategy.id}`}
                        checked={selectedCustomStrategy?.id === strategy.id}
                      />
                      <Label 
                        htmlFor={`custom-${strategy.id}`} 
                        className="flex flex-col flex-1 cursor-pointer"
                      >
                        <span className="font-medium">{strategy.name}</span>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground mt-1">
                            {formatBetType(strategy.betType)} | Puntata iniziale: {strategy.initialBet}€
                          </span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {strategy.type}
                          </Badge>
                        </div>
                      </Label>
                      
                      {currentStrategy?.id === strategy.id && botStatus.status === "active" && (
                        <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-200">
                          Attiva
                        </Badge>
                      )}
                    </div>
                  ))}
                </>
              )}
              
              {/* Separatore se ci sono strategie personalizzate */}
              {savedStrategiesData && savedStrategiesData.length > 0 && (
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Strategie predefinite
                    </span>
                  </div>
                </div>
              )}
              
              {/* Strategie predefinite */}
              {(!savedStrategiesData || savedStrategiesData.length === 0) && (
                <div className="text-sm font-medium mb-2">Strategie predefinite</div>
              )}
              
              {defaultStrategies.map((strategy) => (
                <div
                  key={strategy.type}
                  className={`flex items-center space-x-2 border rounded-lg p-3 
                    ${selectedType === strategy.type && !showCustomStrategies ? 'border-primary bg-primary/5' : 'border-input'}
                    ${(isActive || isLoading || showCustomStrategies) ? 'opacity-60' : ''}
                  `}
                >
                  <RadioGroupItem value={strategy.type} id={strategy.type} />
                  <Label 
                    htmlFor={strategy.type} 
                    className="flex flex-col flex-1 cursor-pointer"
                  >
                    <span className="font-medium">{strategy.name}</span>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground mt-1">
                        {strategy.description}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {formatBetType(strategy.betType)}
                      </Badge>
                    </div>
                  </Label>
                  
                  {currentStrategy?.type === strategy.type && botStatus.status === "active" && (
                    <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-200">
                      Attiva
                    </Badge>
                  )}
                </div>
              ))}
            </RadioGroup>
          
            {/* Configurazione Bet Type */}
            {!showCustomStrategies && selectedType && !isActive && (
              <div className="mt-4 border rounded-lg p-4">
                <Label className="text-sm font-medium mb-3 block">Configurazione Puntata</Label>
                
                {/* Colore */}
                {getSelectedStrategy(selectedType)?.betType === "color" && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <Label htmlFor="red" className="flex-1 text-sm">Rosso</Label>
                      <RadioGroup 
                        value="red" 
                        className="flex"
                      >
                        <RadioGroupItem value="red" id="red" />
                      </RadioGroup>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full bg-black"></div>
                      <Label htmlFor="black" className="flex-1 text-sm">Nero</Label>
                      <RadioGroup 
                        value="black" 
                        className="flex"
                      >
                        <RadioGroupItem value="black" id="black" />
                      </RadioGroup>
                    </div>
                  </div>
                )}
                
                {/* Pari/Dispari */}
                {getSelectedStrategy(selectedType)?.betType === "evenOdd" && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="even" className="flex-1 text-sm">Pari (Even)</Label>
                      <RadioGroup 
                        value="even" 
                        className="flex"
                      >
                        <RadioGroupItem value="even" id="even" />
                      </RadioGroup>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="odd" className="flex-1 text-sm">Dispari (Odd)</Label>
                      <RadioGroup 
                        value="odd" 
                        className="flex"
                      >
                        <RadioGroupItem value="odd" id="odd" />
                      </RadioGroup>
                    </div>
                  </div>
                )}
                
                {/* Dozzine */}
                {getSelectedStrategy(selectedType)?.betType === "dozen" && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="first-dozen" className="flex-1 text-sm">Prima dozzina (1-12)</Label>
                      <RadioGroup 
                        value="first" 
                        className="flex"
                      >
                        <RadioGroupItem value="first" id="first-dozen" />
                      </RadioGroup>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="second-dozen" className="flex-1 text-sm">Seconda dozzina (13-24)</Label>
                      <RadioGroup 
                        value="second" 
                        className="flex"
                      >
                        <RadioGroupItem value="second" id="second-dozen" />
                      </RadioGroup>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="third-dozen" className="flex-1 text-sm">Terza dozzina (25-36)</Label>
                      <RadioGroup 
                        value="third" 
                        className="flex"
                      >
                        <RadioGroupItem value="third" id="third-dozen" />
                      </RadioGroup>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                      <p>Strategia dozzine: Puntata sulle dozzine che non sono uscite per 3 volte consecutive</p>
                    </div>
                  </div>
                )}
                
                {/* Parametri generali */}
                <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Puntata iniziale</Label>
                    <p className="text-sm font-medium">{getSelectedStrategy(selectedType)?.initialBet || 1}€</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Stop Loss</Label>
                    <p className="text-sm font-medium">{getSelectedStrategy(selectedType)?.stopLoss || 50}€</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 border-t pt-4">
        {isActive ? (
          <Button 
            variant="destructive" 
            className="w-full sm:w-auto"
            onClick={() => onStartBot({ ...currentStrategy!, stop: true } as Strategy)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <StopCircle className="mr-2 h-4 w-4" />
            )}
            Ferma Bot
          </Button>
        ) : (
          <Button 
            onClick={handleStartBot} 
            className="w-full sm:w-auto"
            disabled={isLoading || !selectedType}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="mr-2 h-4 w-4" />
            )}
            Avvia Bot
          </Button>
        )}
        
        {botStatus.error && (
          <p className="text-xs text-red-500 mt-2 sm:mt-0 sm:text-sm">
            Errore: {botStatus.error}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
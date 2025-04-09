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
        {/* Selezione Strategie Salvate */}
        <div className="mb-4">
          <Label className="mb-2 block">Strategia Personale</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={showCustomStrategies}
                className="w-full justify-between"
                disabled={isActive || isLoading}
              >
                {showCustomStrategies && selectedCustomStrategy
                  ? selectedCustomStrategy.name
                  : "Seleziona strategia personalizzata"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Cerca strategia..." />
                <CommandEmpty>Nessuna strategia trovata.</CommandEmpty>
                <CommandGroup>
                  {isLoadingStrategies ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (savedStrategiesData && savedStrategiesData.length > 0) ? (
                    savedStrategiesData.map((strategy: Strategy) => (
                      <CommandItem
                        key={strategy.id}
                        value={strategy.name}
                        onSelect={() => handleCustomStrategySelect(strategy)}
                        className="flex justify-between"
                      >
                        <div className="flex flex-col">
                          <span>{strategy.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {strategy.type} | {formatBetType(strategy.betType)}
                          </span>
                        </div>
                        {showCustomStrategies && selectedCustomStrategy?.id === strategy.id && (
                          <Badge variant="outline" className="ml-auto bg-primary/10 text-primary">
                            Selezionata
                          </Badge>
                        )}
                      </CommandItem>
                    ))
                  ) : (
                    <div className="px-2 py-3 text-sm">
                      Nessuna strategia salvata. Crea una strategia nella pagina "Configurazione Strategie".
                    </div>
                  )}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Separatore */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              oppure scegli strategia predefinita
            </span>
          </div>
        </div>
        
        {/* Strategie predefinite */}
        <RadioGroup 
          value={selectedType} 
          onValueChange={handleStrategySelect}
          className="space-y-3 mt-3"
          disabled={isActive || isLoading || showCustomStrategies}
        >
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
                  <p>Strategia dozzine: Puntata sulle dozzine che non sono uscite per {getSelectedStrategy(selectedType)?.entryCondition || 3} volte consecutive</p>
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
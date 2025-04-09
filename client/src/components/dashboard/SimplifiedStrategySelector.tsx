import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, StopCircle, Loader2 } from "lucide-react";

// Importiamo i tipi dalla definizione dello schema condiviso
import { Strategy, BotStatus } from "@/lib/types";

interface SimplifiedStrategySelectorProps {
  onStartBot: (strategy: Strategy) => void;
  currentStrategy: Strategy | null;
  botStatus: BotStatus;
}

export default function SimplifiedStrategySelector({ onStartBot, currentStrategy, botStatus }: SimplifiedStrategySelectorProps) {
  const [selectedType, setSelectedType] = useState<string>(currentStrategy?.type || "martingala");
  
  // Lista di strategie disponibili
  const strategies = [
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
  
  const getSelectedStrategy = (type: string) => {
    return strategies.find((strategy: Strategy) => strategy.type === type) || currentStrategy;
  };
  
  const handleStrategySelect = (type: string) => {
    setSelectedType(type);
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
      
      <CardContent>
        <RadioGroup 
          value={selectedType} 
          onValueChange={handleStrategySelect}
          className="space-y-3"
          disabled={isActive || isLoading}
        >
          {strategies.map((strategy) => (
            <div
              key={strategy.type}
              className={`flex items-center space-x-2 border rounded-lg p-3 
                ${selectedType === strategy.type ? 'border-primary bg-primary/5' : 'border-input'}
                ${(isActive || isLoading) ? 'opacity-60' : ''}
              `}
            >
              <RadioGroupItem value={strategy.type} id={strategy.type} />
              <Label 
                htmlFor={strategy.type} 
                className="flex flex-col flex-1 cursor-pointer"
              >
                <span className="font-medium">{strategy.name}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {strategy.description}
                </span>
              </Label>
              
              {currentStrategy?.type === strategy.type && botStatus.status === "active" && (
                <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-200">
                  Attiva
                </Badge>
              )}
            </div>
          ))}
        </RadioGroup>
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
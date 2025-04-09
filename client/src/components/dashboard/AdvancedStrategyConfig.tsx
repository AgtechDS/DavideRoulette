import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormDescription,
  FormMessage
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Strategy } from "@/lib/types";
import { CircleDashed, Save, Upload, Bot, ChevronDown, ChevronUp, Plus, Trash2, Calculator } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Strategy schema
const advancedStrategySchema = z.object({
  name: z.string().min(1, "Nome obbligatorio").default("Nuova Strategia"),
  type: z.enum(["martingala", "fibonacci", "dalembert", "custom"]),
  initialBet: z.coerce.number().min(1, "La puntata iniziale deve essere almeno 1"),
  maxLosses: z.coerce.number().min(1, "Il numero massimo di perdite deve essere almeno 1"),
  betType: z.enum(["color", "evenOdd", "dozen"]),
  targetProfit: z.coerce.number().min(1, "Il target di profitto deve essere almeno 1"),
  stopLoss: z.coerce.number().min(1, "Lo stop loss deve essere almeno 1"),
  sessionDuration: z.coerce.number().min(5, "La durata della sessione deve essere almeno 5 minuti"),
  gameMode: z.enum(["standard", "speed_live"]).default("speed_live"),
  automaticMode: z.boolean().default(false),
  targetDozen: z.enum(["first", "second", "third"]).default("first"),
  entryCondition: z.coerce.number().min(1).default(3),
  maxConsecutiveBets: z.coerce.number().min(1).default(17),
  resetStrategy: z.enum(["after_win", "after_loss", "manual"]).default("after_win"),
  multiAccountMode: z.boolean().default(false),
  accountCount: z.coerce.number().min(1).max(10).default(1),
  alarmEnabled: z.boolean().default(false),
  alarmChannel: z.enum(["email", "telegram", "log"]).default("log"),
  alarmContactInfo: z.string().optional(),
  useAIAnalysis: z.boolean().default(false),
  datasetImported: z.boolean().default(false),
});

type FormValues = z.infer<typeof advancedStrategySchema>;

interface AdvancedStrategyConfigProps {
  onStrategyCreated?: (strategy: Strategy) => void;
  initialStrategy?: Strategy | null;
}

export default function AdvancedStrategyConfig({ 
  onStrategyCreated, 
  initialStrategy 
}: AdvancedStrategyConfigProps) {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("game-settings");
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [accounts, setAccounts] = useState<{id: string, username: string, password: string}[]>([
    { id: "account1", username: "", password: "" }
  ]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(advancedStrategySchema),
    defaultValues: initialStrategy || {
      name: "Strategia Roulette Speed",
      type: "martingala",
      initialBet: 1,
      maxLosses: 17,
      betType: "dozen",
      targetProfit: 100,
      stopLoss: 50,
      sessionDuration: 60,
      gameMode: "speed_live",
      automaticMode: true,
      targetDozen: "first",
      entryCondition: 3,
      maxConsecutiveBets: 17,
      resetStrategy: "after_win",
      multiAccountMode: false,
      accountCount: 1,
      alarmEnabled: false,
      alarmChannel: "log",
      alarmContactInfo: "",
      useAIAnalysis: false,
      datasetImported: false,
    }
  });

  // Save strategy mutation
  const saveStrategyMutation = useMutation({
    mutationFn: async (strategy: Strategy) => {
      const res = await apiRequest('POST', '/api/strategy', strategy);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Strategia Salvata",
        description: "La tua strategia di gioco è stata salvata correttamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/strategy'] });
      if (onStrategyCreated) {
        onStrategyCreated(data);
      }
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Impossibile salvare la strategia. " + error.message,
        variant: "destructive",
      });
    }
  });

  // Analyze strategy mutation
  const analyzeStrategyMutation = useMutation({
    mutationFn: async (strategy: Strategy) => {
      const res = await apiRequest('POST', '/api/strategy/analyze', strategy);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Analisi Completata",
        description: "L'analisi della strategia è stata completata. Controlla la sezione AI Insights per i risultati.",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore Analisi",
        description: "Impossibile analizzare la strategia. " + error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: FormValues) => {
    // Aggiungiamo gli account alla strategia se multiAccountMode è attivo
    const strategyData: any = { ...data };
    
    if (data.multiAccountMode && accounts.length > 0) {
      strategyData.accounts = accounts.filter(acc => acc.username.trim() !== "");
    }
    
    saveStrategyMutation.mutate(strategyData as Strategy);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsFileLoading(true);
    
    // Simulate file processing
    setTimeout(() => {
      form.setValue("datasetImported", true);
      setIsFileLoading(false);
      toast({
        title: "Dataset Importato",
        description: "Il dataset è stato importato con successo.",
      });
    }, 1500);
  };

  const handleAnalyzeStrategy = () => {
    const values = form.getValues();
    analyzeStrategyMutation.mutate(values as Strategy);
  };

  const addAccount = () => {
    if (accounts.length < 10) {
      setAccounts([...accounts, { id: `account${accounts.length + 1}`, username: "", password: "" }]);
      form.setValue("accountCount", accounts.length + 1);
    }
  };

  const removeAccount = (id: string) => {
    if (accounts.length > 1) {
      setAccounts(accounts.filter(account => account.id !== id));
      form.setValue("accountCount", accounts.length - 1);
    }
  };

  const updateAccount = (id: string, field: 'username' | 'password', value: string) => {
    setAccounts(accounts.map(account => 
      account.id === id ? { ...account, [field]: value } : account
    ));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configurazione Strategia Avanzata</CardTitle>
        <CardDescription>
          Configura tutti i parametri avanzati per la tua strategia di gioco
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Strategia</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Inserisci un nome per la strategia" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Tabs defaultValue="game-settings" value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="game-settings">Regole Roulette</TabsTrigger>
                <TabsTrigger value="strategy-params">Parametri Scommessa</TabsTrigger>
                <TabsTrigger value="accounts">Account</TabsTrigger>
                <TabsTrigger value="analysis">Analisi AI</TabsTrigger>
              </TabsList>
              
              {/* ===== TAB 1: REGOLE ROULETTE ===== */}
              <TabsContent value="game-settings" className="space-y-4">
                <div className="rounded-md border p-4">
                  <h3 className="font-medium mb-4">⚙️ Impostazioni Regole Roulette Speed (LIVE Planetwin)</h3>
                  
                  <FormField
                    control={form.control}
                    name="gameMode"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Modalità di Gioco</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona modalità" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="speed_live">Roulette Speed LIVE (Planetwin)</SelectItem>
                            <SelectItem value="standard">Roulette Standard</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>Seleziona la modalità di gioco da utilizzare</FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="automaticMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between mb-4 p-3 rounded-md border">
                        <div className="space-y-0.5">
                          <FormLabel>Gioco senza croupier (automatico)</FormLabel>
                          <FormDescription>Il gioco avviene in modo completamente automatizzato</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="bg-muted/50 p-4 rounded-md mb-4">
                    <p className="text-sm text-center">
                      <strong>Timer fisso:</strong> 1 giro = 60 secondi (non modificabile)
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              {/* ===== TAB 2: PARAMETRI STRATEGIA ===== */}
              <TabsContent value="strategy-params" className="space-y-4">
                <div className="rounded-md border p-4">
                  <h3 className="font-medium mb-4">🎯 Parametri Strategia di Scommessa</h3>
                  
                  <FormField
                    control={form.control}
                    name="betType"
                    render={({ field }) => (
                      <FormItem className="mb-6">
                        <FormLabel>Tipo di Puntata</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-3 gap-2 mt-2"
                          >
                            <div className={`flex items-center justify-center p-4 rounded-md border ${field.value === "color" ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                              <RadioGroupItem value="color" id="color" className="sr-only" />
                              <label htmlFor="color" className="cursor-pointer text-center">
                                <div className="font-medium mb-1">Colore</div>
                                <div className="flex justify-center gap-2">
                                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                                  <div className="w-4 h-4 rounded-full bg-black"></div>
                                </div>
                              </label>
                            </div>
                            
                            <div className={`flex items-center justify-center p-4 rounded-md border ${field.value === "evenOdd" ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                              <RadioGroupItem value="evenOdd" id="evenOdd" className="sr-only" />
                              <label htmlFor="evenOdd" className="cursor-pointer text-center">
                                <div className="font-medium mb-1">Pari/Dispari</div>
                                <div className="text-xs">Even/Odd</div>
                              </label>
                            </div>
                            
                            <div className={`flex items-center justify-center p-4 rounded-md border ${field.value === "dozen" ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                              <RadioGroupItem value="dozen" id="dozen" className="sr-only" />
                              <label htmlFor="dozen" className="cursor-pointer text-center">
                                <div className="font-medium mb-1">Dozzine</div>
                                <div className="text-xs">1-12, 13-24, 25-36</div>
                              </label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("betType") === "dozen" && (
                    <FormField
                      control={form.control}
                      name="targetDozen"
                      render={({ field }) => (
                        <FormItem className="mb-6">
                          <FormLabel>Dozzina Target</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-3 gap-2 mt-2"
                            >
                              <div className={`flex items-center justify-center p-3 rounded-md border ${field.value === "first" ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                                <RadioGroupItem value="first" id="first-dozen" className="sr-only" />
                                <label htmlFor="first-dozen" className="cursor-pointer text-center">
                                  <div className="font-medium">Prima Dozzina</div>
                                  <div className="text-xs mt-1">1-12</div>
                                </label>
                              </div>
                              
                              <div className={`flex items-center justify-center p-3 rounded-md border ${field.value === "second" ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                                <RadioGroupItem value="second" id="second-dozen" className="sr-only" />
                                <label htmlFor="second-dozen" className="cursor-pointer text-center">
                                  <div className="font-medium">Seconda Dozzina</div>
                                  <div className="text-xs mt-1">13-24</div>
                                </label>
                              </div>
                              
                              <div className={`flex items-center justify-center p-3 rounded-md border ${field.value === "third" ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                                <RadioGroupItem value="third" id="third-dozen" className="sr-only" />
                                <label htmlFor="third-dozen" className="cursor-pointer text-center">
                                  <div className="font-medium">Terza Dozzina</div>
                                  <div className="text-xs mt-1">25-36</div>
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="entryCondition"
                    render={({ field }) => (
                      <FormItem className="mb-6">
                        <FormLabel>Condizione di Entrata (Bet-in)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            max={10}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Entrare alla {field.value}ª non uscita della {form.watch("betType") === "dozen" ? "dozzina" : form.watch("betType") === "color" ? "colore" : "pari/dispari"}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <Separator className="my-6" />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="mb-6">
                        <FormLabel>Strategia di Progressione</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona strategia" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="martingala">Martingala</SelectItem>
                            <SelectItem value="fibonacci">Fibonacci</SelectItem>
                            <SelectItem value="dalembert">D'Alembert</SelectItem>
                            <SelectItem value="custom">Personalizzata</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <FormField
                      control={form.control}
                      name="initialBet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bet iniziale (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              step={0.1}
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>Unità di puntata iniziale</FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="maxConsecutiveBets"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numero massimo di betting consecutivi</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              max={50}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="resetStrategy"
                    render={({ field }) => (
                      <FormItem className="mb-6">
                        <FormLabel>Reset Strategia</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona quando resettare la strategia" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="after_win">Dopo vincita: Riparti da bet iniziale</SelectItem>
                            <SelectItem value="after_loss">Dopo perdita (al {form.watch('maxConsecutiveBets')}° tentativo): Stop & attendi nuova condizione</SelectItem>
                            <SelectItem value="manual">Reset manuale</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <FormField
                      control={form.control}
                      name="targetProfit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Profitto (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>Ferma il bot quando raggiungi questo profitto</FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="stopLoss"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stop Loss (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>Ferma il bot quando perdi questo importo</FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* ===== TAB 3: GESTIONE ACCOUNT ===== */}
              <TabsContent value="accounts" className="space-y-4">
                <div className="rounded-md border p-4">
                  <h3 className="font-medium mb-4">👥 Gestione Account Multiutente</h3>
                  
                  <FormField
                    control={form.control}
                    name="multiAccountMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between mb-4 p-3 rounded-md border">
                        <div className="space-y-0.5">
                          <FormLabel>Modalità Multi-Account</FormLabel>
                          <FormDescription>Abilita l'utilizzo di più account simultanei</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("multiAccountMode") && (
                    <div className="rounded-md border p-4 mt-4 mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <FormField
                          control={form.control}
                          name="accountCount"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Numero account simultanei</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min={1} 
                                  max={10}
                                  value={accounts.length}
                                  disabled
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={addAccount}
                          disabled={accounts.length >= 10}
                          className="ml-2"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Aggiungi
                        </Button>
                      </div>
                      
                      <div className="space-y-4 mt-4">
                        {accounts.map((account, index) => (
                          <div key={account.id} className="rounded-md border p-3 mb-3">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium">Account {index + 1}</h4>
                              {accounts.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAccount(account.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <FormLabel>Username</FormLabel>
                                <Input 
                                  value={account.username}
                                  onChange={(e) => updateAccount(account.id, 'username', e.target.value)}
                                  placeholder="Username"
                                />
                              </div>
                              <div>
                                <FormLabel>Password</FormLabel>
                                <Input 
                                  type="password"
                                  value={account.password}
                                  onChange={(e) => updateAccount(account.id, 'password', e.target.value)}
                                  placeholder="Password"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Separator className="my-6" />
                  
                  <h3 className="font-medium mb-4">🚨 Allarmi e Sicurezza</h3>
                  
                  <FormField
                    control={form.control}
                    name="alarmEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between mb-4 p-3 rounded-md border">
                        <div className="space-y-0.5">
                          <FormLabel>Sistema di Allarme Automatico</FormLabel>
                          <FormDescription>Ricevi notifiche in caso di anomalie o eventi significativi</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("alarmEnabled") && (
                    <div className="space-y-4 mt-4">
                      <FormField
                        control={form.control}
                        name="alarmChannel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Canale di Notifica</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleziona canale" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="telegram">Telegram</SelectItem>
                                <SelectItem value="log">Log Dashboard</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                      {(form.watch("alarmChannel") === "email" || form.watch("alarmChannel") === "telegram") && (
                        <FormField
                          control={form.control}
                          name="alarmContactInfo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {form.watch("alarmChannel") === "email" ? "Email" : "Bot Telegram"}
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder={form.watch("alarmChannel") === "email" 
                                    ? "Inserisci email" 
                                    : "Inserisci token bot Telegram"
                                  } 
                                />
                              </FormControl>
                              <FormDescription>
                                {form.watch("alarmChannel") === "email" 
                                  ? "Riceverai le notifiche a questo indirizzo email" 
                                  : "Riceverai le notifiche tramite questo bot Telegram"
                                }
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* ===== TAB 4: ANALISI AI ===== */}
              <TabsContent value="analysis" className="space-y-4">
                <div className="rounded-md border p-4">
                  <h3 className="font-medium mb-4">📊 Analisi Dati & AI</h3>
                  
                  <FormField
                    control={form.control}
                    name="useAIAnalysis"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between mb-4 p-3 rounded-md border">
                        <div className="space-y-0.5">
                          <FormLabel>Usa Analisi AI</FormLabel>
                          <FormDescription>Utilizza l'intelligenza artificiale per ottimizzare la strategia</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("useAIAnalysis") && (
                    <div className="space-y-4 mt-4">
                      <div className="rounded-md border p-4">
                        <h4 className="font-medium mb-3">Database Numeri Usciti</h4>
                        
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground mb-2">
                            Importa dataset CSV con numeri precedenti (min. 100.000 righe)
                          </p>
                          
                          <div className="flex items-center gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              asChild
                              disabled={isFileLoading || form.watch("datasetImported")}
                            >
                              <label>
                                <Input 
                                  type="file" 
                                  accept=".csv" 
                                  className="hidden" 
                                  onChange={handleFileUpload}
                                  disabled={isFileLoading || form.watch("datasetImported")}
                                />
                                {isFileLoading ? (
                                  <>
                                    <CircleDashed className="h-4 w-4 mr-2 animate-spin" />
                                    Importazione...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Carica dataset
                                  </>
                                )}
                              </label>
                            </Button>
                            
                            {form.watch("datasetImported") && (
                              <div className="text-sm font-medium text-success">
                                Dataset importato ✓
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          type="button"
                          variant="default"
                          onClick={handleAnalyzeStrategy}
                          disabled={!form.watch("datasetImported") || analyzeStrategyMutation.isPending}
                          className="w-full"
                        >
                          {analyzeStrategyMutation.isPending ? (
                            <>
                              <CircleDashed className="h-4 w-4 mr-2 animate-spin" />
                              Analisi in corso...
                            </>
                          ) : (
                            <>
                              <Calculator className="h-4 w-4 mr-2" />
                              Esegui analisi di probabilità
                            </>
                          )}
                        </Button>
                        
                        {!form.watch("datasetImported") && (
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            Importa prima un dataset per eseguire l'analisi
                          </p>
                        )}
                      </div>
                      
                      <Alert>
                        <CardDescription className="text-sm">
                          L'analisi AI richiede l'importazione di un dataset storico. 
                          Dopo l'analisi potrai vedere percentuali di successo, 
                          rischio e suggerimenti strategici nella sezione AI Insights.
                        </CardDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            form.reset();
            setAccounts([{ id: "account1", username: "", password: "" }]);
            toast({
              title: "Form Resettato",
              description: "Tutti i campi sono stati ripristinati ai valori predefiniti",
            });
          }}
        >
          Ripristina
        </Button>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={saveStrategyMutation.isPending}
        >
          {saveStrategyMutation.isPending ? (
            <>
              <CircleDashed className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salva Strategia
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
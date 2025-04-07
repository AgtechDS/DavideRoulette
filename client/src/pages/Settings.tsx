import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Icons
import {
  Settings2,
  Save,
  RotateCcw,
  AlertCircle,
  Lock,
  User,
  Bell,
  Database,
  Palette,
  Globe,
  Joystick,
  Bot,
  Clock,
  Euro,
  ShieldAlert,
  Rocket,
  CircleDashed,
  FileText,
  Trash2,
} from "lucide-react";

// Hooks and utilities
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Definizione degli schemi di validazione
const generalSettingsSchema = z.object({
  language: z.enum(["it", "en"]),
  theme: z.enum(["light", "dark", "system"]),
  notifications: z.boolean(),
  sounds: z.boolean(),
  autoSaveInterval: z.number().min(1).max(60),
  devMode: z.boolean(),
});

const accountSettingsSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  displayName: z.string().min(2).max(50),
  changePassword: z.boolean(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.changePassword) {
    return !!data.currentPassword && !!data.newPassword && !!data.confirmPassword;
  }
  return true;
}, {
  message: "Tutti i campi password sono obbligatori quando si cambia la password",
  path: ["changePassword"],
}).refine((data) => {
  if (data.changePassword) {
    return data.newPassword === data.confirmPassword;
  }
  return true;
}, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

const botSettingsSchema = z.object({
  autoStartBot: z.boolean(),
  defaultStrategy: z.number().optional(),
  logLevel: z.enum(["error", "warning", "info", "debug"]),
  screenshotFrequency: z.enum(["never", "errors", "wins", "always"]),
  maxSessionTime: z.number().min(5).max(1440),
  enableEmergencyStop: z.boolean(),
  emergencyStopConditions: z.object({
    maxConsecutiveLosses: z.number().min(1).max(100),
    balanceThreshold: z.number().min(0),
  }),
});

const casinoSettingsSchema = z.object({
  casinoUrl: z.string().url(),
  credentials: z.object({
    saveCredentials: z.boolean(),
    username: z.string().optional(),
    password: z.string().optional(),
  }).refine((data) => {
    if (data.saveCredentials) {
      return !!data.username && !!data.password;
    }
    return true;
  }, {
    message: "Username e password sono richiesti se si salvano le credenziali",
    path: ["saveCredentials"],
  }),
  gameType: z.enum(["europeanRoulette", "americanRoulette", "liveCasino"]),
  preferredTable: z.string().optional(),
});

type GeneralSettings = z.infer<typeof generalSettingsSchema>;
type AccountSettings = z.infer<typeof accountSettingsSchema>;
type BotSettings = z.infer<typeof botSettingsSchema>;
type CasinoSettings = z.infer<typeof casinoSettingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isResetting, setIsResetting] = useState(false);
  const [resetType, setResetType] = useState<"all" | "statistics" | "strategies" | "logs">("all");

  // Recupero impostazioni
  const { data: generalData, isLoading: isGeneralLoading } = useQuery({
    queryKey: ["/api/settings/general"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/settings/general");
        if (!res.ok) throw new Error("Impossibile recuperare le impostazioni generali");
        return res.json();
      } catch (error) {
        // In modalità demo, restituiamo dati predefiniti
        return {
          language: "it",
          theme: "system",
          notifications: true,
          sounds: true,
          autoSaveInterval: 5,
          devMode: false,
        } as GeneralSettings;
      }
    }
  });

  const { data: accountData, isLoading: isAccountLoading } = useQuery({
    queryKey: ["/api/settings/account"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/settings/account");
        if (!res.ok) throw new Error("Impossibile recuperare le impostazioni account");
        return res.json();
      } catch (error) {
        // In modalità demo, restituiamo dati predefiniti
        return {
          username: "Dinquart84",
          email: "user@example.com",
          displayName: "Davide",
          changePassword: false,
        } as AccountSettings;
      }
    }
  });

  const { data: botData, isLoading: isBotLoading } = useQuery({
    queryKey: ["/api/settings/bot"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/settings/bot");
        if (!res.ok) throw new Error("Impossibile recuperare le impostazioni del bot");
        return res.json();
      } catch (error) {
        // In modalità demo, restituiamo dati predefiniti
        return {
          autoStartBot: false,
          defaultStrategy: 1,
          logLevel: "info",
          screenshotFrequency: "errors",
          maxSessionTime: 60,
          enableEmergencyStop: true,
          emergencyStopConditions: {
            maxConsecutiveLosses: 8,
            balanceThreshold: 50,
          }
        } as BotSettings;
      }
    }
  });

  const { data: casinoData, isLoading: isCasinoLoading } = useQuery({
    queryKey: ["/api/settings/casino"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/settings/casino");
        if (!res.ok) throw new Error("Impossibile recuperare le impostazioni del casinò");
        return res.json();
      } catch (error) {
        // In modalità demo, restituiamo dati predefiniti
        return {
          casinoUrl: "https://www.planetwin365.it",
          credentials: {
            saveCredentials: false,
            username: "",
            password: "",
          },
          gameType: "europeanRoulette",
          preferredTable: "Roulette Live",
        } as CasinoSettings;
      }
    }
  });

  const { data: strategiesData, isLoading: isStrategiesLoading } = useQuery({
    queryKey: ["/api/strategy"],
    queryFn: async () => {
      const res = await fetch("/api/strategy");
      if (!res.ok) throw new Error("Impossibile recuperare le strategie");
      return res.json();
    }
  });

  // Forms
  const generalForm = useForm<GeneralSettings>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: generalData || {
      language: "it",
      theme: "system",
      notifications: true,
      sounds: true,
      autoSaveInterval: 5,
      devMode: false,
    },
  });

  const accountForm = useForm<AccountSettings>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: accountData || {
      username: "",
      email: "",
      displayName: "",
      changePassword: false,
    },
  });

  const botForm = useForm<BotSettings>({
    resolver: zodResolver(botSettingsSchema),
    defaultValues: botData || {
      autoStartBot: false,
      logLevel: "info",
      screenshotFrequency: "errors",
      maxSessionTime: 60,
      enableEmergencyStop: true,
      emergencyStopConditions: {
        maxConsecutiveLosses: 8,
        balanceThreshold: 50,
      }
    },
  });

  const casinoForm = useForm<CasinoSettings>({
    resolver: zodResolver(casinoSettingsSchema),
    defaultValues: casinoData || {
      casinoUrl: "https://www.planetwin365.it",
      credentials: {
        saveCredentials: false,
        username: "",
        password: "",
      },
      gameType: "europeanRoulette",
      preferredTable: "",
    },
  });

  // Aggiorniamo i form quando arrivano i dati
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useState(() => {
    if (generalData) generalForm.reset(generalData);
    if (accountData) accountForm.reset(accountData);
    if (botData) botForm.reset(botData);
    if (casinoData) casinoForm.reset(casinoData);
  });

  // Mutations per salvare le impostazioni
  const saveGeneralSettings = useMutation({
    mutationFn: async (data: GeneralSettings) => {
      try {
        return apiRequest("/api/settings/general" as any, "POST", data);
      } catch (error) {
        console.error("Errore nel salvataggio delle impostazioni generali:", error);
        throw new Error("Impossibile salvare le impostazioni generali");
      }
    },
    onSuccess: () => {
      toast({
        title: "Impostazioni generali salvate",
        description: "Le tue impostazioni sono state aggiornate con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/general"] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const saveAccountSettings = useMutation({
    mutationFn: async (data: AccountSettings) => {
      try {
        return apiRequest("/api/settings/account" as any, "POST", data);
      } catch (error) {
        console.error("Errore nel salvataggio delle impostazioni account:", error);
        throw new Error("Impossibile salvare le impostazioni dell'account");
      }
    },
    onSuccess: () => {
      toast({
        title: "Impostazioni account salvate",
        description: "Le impostazioni del tuo account sono state aggiornate con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/account"] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const saveBotSettings = useMutation({
    mutationFn: async (data: BotSettings) => {
      try {
        return apiRequest("/api/settings/bot" as any, "POST", data);
      } catch (error) {
        console.error("Errore nel salvataggio delle impostazioni bot:", error);
        throw new Error("Impossibile salvare le impostazioni del bot");
      }
    },
    onSuccess: () => {
      toast({
        title: "Impostazioni bot salvate",
        description: "Le impostazioni del bot sono state aggiornate con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/bot"] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const saveCasinoSettings = useMutation({
    mutationFn: async (data: CasinoSettings) => {
      try {
        return apiRequest("/api/settings/casino" as any, "POST", data);
      } catch (error) {
        console.error("Errore nel salvataggio delle impostazioni casinò:", error);
        throw new Error("Impossibile salvare le impostazioni del casinò");
      }
    },
    onSuccess: () => {
      toast({
        title: "Impostazioni casinò salvate",
        description: "Le impostazioni del casinò sono state aggiornate con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/casino"] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation per il reset
  const resetDataMutation = useMutation({
    mutationFn: async (type: "all" | "statistics" | "strategies" | "logs") => {
      setIsResetting(true);
      try {
        return apiRequest("/api/reset" as any, "POST", { type });
      } catch (error) {
        console.error(`Errore durante il reset dei dati (${type}):`, error);
        throw new Error(`Impossibile resettare i dati (${type})`);
      } finally {
        setIsResetting(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Reset completato",
        description: "I dati sono stati resettati con successo",
      });
      // Invalidiamo tutte le query potenzialmente interessate
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handler per l'invio dei form
  const onSubmitGeneralSettings = (data: GeneralSettings) => {
    saveGeneralSettings.mutate(data);
  };

  const onSubmitAccountSettings = (data: AccountSettings) => {
    saveAccountSettings.mutate(data);
  };

  const onSubmitBotSettings = (data: BotSettings) => {
    saveBotSettings.mutate(data);
  };

  const onSubmitCasinoSettings = (data: CasinoSettings) => {
    saveCasinoSettings.mutate(data);
  };

  // Handler per i reset
  const handleReset = (type: "all" | "statistics" | "strategies" | "logs") => {
    setResetType(type);
    resetDataMutation.mutate(type);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-2 mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Settings2 className="mr-2 h-8 w-8" />
          Impostazioni
        </h1>
        <p className="text-muted-foreground">
          Configura le impostazioni dell'applicazione, del bot e del tuo account
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="general">
            <Palette className="mr-2 h-4 w-4" />
            Generali
          </TabsTrigger>
          <TabsTrigger value="account">
            <User className="mr-2 h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="bot">
            <Bot className="mr-2 h-4 w-4" />
            Bot
          </TabsTrigger>
          <TabsTrigger value="casino">
            <Joystick className="mr-2 h-4 w-4" />
            Casinò
          </TabsTrigger>
        </TabsList>

        {/* Sezione Impostazioni Generali */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni Generali</CardTitle>
              <CardDescription>
                Configura le impostazioni di base dell'applicazione
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isGeneralLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <Form {...generalForm}>
                  <form onSubmit={generalForm.handleSubmit(onSubmitGeneralSettings)} className="space-y-6">
                    <FormField
                      control={generalForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lingua</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona lingua" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="it">Italiano</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Lingua utilizzata nell'interfaccia dell'applicazione
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tema</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona tema" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="light">Chiaro</SelectItem>
                              <SelectItem value="dark">Scuro</SelectItem>
                              <SelectItem value="system">Sistema</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Tema dell'interfaccia utente
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={generalForm.control}
                        name="notifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Notifiche</FormLabel>
                              <FormDescription>
                                Ricevi notifiche sugli eventi importanti
                              </FormDescription>
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

                      <FormField
                        control={generalForm.control}
                        name="sounds"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Suoni</FormLabel>
                              <FormDescription>
                                Abilita effetti sonori nell'applicazione
                              </FormDescription>
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
                    </div>

                    <FormField
                      control={generalForm.control}
                      name="autoSaveInterval"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Intervallo di salvataggio automatico (minuti)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={60}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Frequenza con cui vengono salvate automaticamente le modifiche
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="devMode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Modalità sviluppatore</FormLabel>
                            <FormDescription>
                              Abilita funzionalità avanzate e log dettagliati
                            </FormDescription>
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

                    <Separator />

                    <Accordion type="single" collapsible>
                      <AccordionItem value="danger-zone">
                        <AccordionTrigger className="text-red-500 font-medium">
                          <div className="flex items-center">
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Zona pericolo
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Attenzione</AlertTitle>
                              <AlertDescription>
                                Le azioni in questa sezione sono irreversibili. Assicurati di voler procedere.
                              </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Reset statistiche
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reset statistiche</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Questa azione cancellerà tutte le statistiche e i dati delle partite. I dati non potranno essere recuperati.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleReset("statistics")}
                                      disabled={isResetting}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      {isResetting && resetType === "statistics" ? (
                                        <>
                                          <CircleDashed className="mr-2 h-4 w-4 animate-spin" />
                                          Resetting...
                                        </>
                                      ) : (
                                        "Reset statistiche"
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Reset strategie
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reset strategie</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Questa azione cancellerà tutte le strategie personalizzate. Verranno mantenute solo le strategie predefinite.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleReset("strategies")}
                                      disabled={isResetting}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      {isResetting && resetType === "strategies" ? (
                                        <>
                                          <CircleDashed className="mr-2 h-4 w-4 animate-spin" />
                                          Resetting...
                                        </>
                                      ) : (
                                        "Reset strategie"
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Cancella log
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancella log</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Questa azione cancellerà tutti i log del bot. I log non potranno essere recuperati.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleReset("logs")}
                                      disabled={isResetting}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      {isResetting && resetType === "logs" ? (
                                        <>
                                          <CircleDashed className="mr-2 h-4 w-4 animate-spin" />
                                          Cancellando...
                                        </>
                                      ) : (
                                        "Cancella log"
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Reset completo
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reset completo</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Questa azione ripristinerà l'applicazione allo stato iniziale, cancellando tutti i dati: statistiche, strategie personalizzate e log. Questa operazione non può essere annullata.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleReset("all")}
                                      disabled={isResetting}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      {isResetting && resetType === "all" ? (
                                        <>
                                          <CircleDashed className="mr-2 h-4 w-4 animate-spin" />
                                          Resetting...
                                        </>
                                      ) : (
                                        "Reset completo"
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </form>
                </Form>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => generalForm.reset()}
                disabled={isGeneralLoading || saveGeneralSettings.isPending}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Ripristina
              </Button>
              <Button
                onClick={generalForm.handleSubmit(onSubmitGeneralSettings)}
                disabled={isGeneralLoading || saveGeneralSettings.isPending}
              >
                {saveGeneralSettings.isPending ? (
                  <>
                    <CircleDashed className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salva impostazioni
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Sezione Impostazioni Account */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni Account</CardTitle>
              <CardDescription>
                Gestisci le informazioni del tuo account e la sicurezza
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAccountLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <Form {...accountForm}>
                  <form onSubmit={accountForm.handleSubmit(onSubmitAccountSettings)} className="space-y-6">
                    <FormField
                      control={accountForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Il tuo nome utente per accedere all'applicazione
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={accountForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            L'indirizzo email associato al tuo account
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={accountForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome visualizzato</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Il nome che verrà visualizzato nell'interfaccia
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <FormField
                      control={accountForm.control}
                      name="changePassword"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Cambia password</FormLabel>
                            <FormDescription>
                              Abilita per modificare la password del tuo account
                            </FormDescription>
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

                    {accountForm.watch("changePassword") && (
                      <div className="space-y-4">
                        <FormField
                          control={accountForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password attuale</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={accountForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nuova password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormDescription>
                                La password deve essere lunga almeno 8 caratteri
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={accountForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Conferma password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </form>
                </Form>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => accountForm.reset()}
                disabled={isAccountLoading || saveAccountSettings.isPending}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Ripristina
              </Button>
              <Button
                onClick={accountForm.handleSubmit(onSubmitAccountSettings)}
                disabled={isAccountLoading || saveAccountSettings.isPending}
              >
                {saveAccountSettings.isPending ? (
                  <>
                    <CircleDashed className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salva impostazioni
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Sezione Impostazioni Bot */}
        <TabsContent value="bot">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni Bot</CardTitle>
              <CardDescription>
                Configura il comportamento del bot e le strategie automatizzate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isBotLoading || isStrategiesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <Form {...botForm}>
                  <form onSubmit={botForm.handleSubmit(onSubmitBotSettings)} className="space-y-6">
                    <FormField
                      control={botForm.control}
                      name="autoStartBot"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Avvio automatico</FormLabel>
                            <FormDescription>
                              Avvia automaticamente il bot all'apertura dell'applicazione
                            </FormDescription>
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

                    <FormField
                      control={botForm.control}
                      name="defaultStrategy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strategia predefinita</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona strategia predefinita" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {strategiesData?.strategies.map((strategy: any) => (
                                <SelectItem key={strategy.id} value={strategy.id.toString()}>
                                  {strategy.type.charAt(0).toUpperCase() + strategy.type.slice(1)} ({strategy.initialBet}€)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Strategia utilizzata all'avvio automatico del bot
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={botForm.control}
                      name="logLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Livello di log</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona livello di log" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="error">Solo errori</SelectItem>
                              <SelectItem value="warning">Errori e avvisi</SelectItem>
                              <SelectItem value="info">Informazioni generali</SelectItem>
                              <SelectItem value="debug">Debug (dettagliato)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Dettaglio delle informazioni nei log del bot
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={botForm.control}
                      name="screenshotFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequenza screenshot</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona frequenza screenshot" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="never">Mai</SelectItem>
                              <SelectItem value="errors">Solo su errori</SelectItem>
                              <SelectItem value="wins">Su vincite</SelectItem>
                              <SelectItem value="always">Ad ogni giro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Quando il bot deve catturare screenshot dell'interfaccia
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={botForm.control}
                      name="maxSessionTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durata massima sessione (minuti)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={5}
                              max={1440}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Durata massima di una sessione di gioco automatizzata (0 = nessun limite)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={botForm.control}
                      name="enableEmergencyStop"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Stop d'emergenza</FormLabel>
                            <FormDescription>
                              Ferma automaticamente il bot in caso di condizioni critiche
                            </FormDescription>
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

                    {botForm.watch("enableEmergencyStop") && (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="text-sm font-medium flex items-center">
                          <ShieldAlert className="mr-2 h-4 w-4 text-amber-500" />
                          Condizioni di stop d'emergenza
                        </h3>

                        <FormField
                          control={botForm.control}
                          name="emergencyStopConditions.maxConsecutiveLosses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Perdite consecutive massime</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  max={100}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                Numero massimo di perdite consecutive prima dello stop automatico
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={botForm.control}
                          name="emergencyStopConditions.balanceThreshold"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Soglia minima saldo (€)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                Ferma il bot quando il saldo scende sotto questa soglia
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </form>
                </Form>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => botForm.reset()}
                disabled={isBotLoading || saveBotSettings.isPending}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Ripristina
              </Button>
              <Button
                onClick={botForm.handleSubmit(onSubmitBotSettings)}
                disabled={isBotLoading || saveBotSettings.isPending}
              >
                {saveBotSettings.isPending ? (
                  <>
                    <CircleDashed className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salva impostazioni
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Sezione Impostazioni Casinò */}
        <TabsContent value="casino">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni Casinò</CardTitle>
              <CardDescription>
                Configura le impostazioni di connessione al casinò e preferenze di gioco
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCasinoLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <Form {...casinoForm}>
                  <form onSubmit={casinoForm.handleSubmit(onSubmitCasinoSettings)} className="space-y-6">
                    <FormField
                      control={casinoForm.control}
                      name="casinoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL del casinò</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Indirizzo del casinò online da utilizzare
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={casinoForm.control}
                      name="gameType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo di gioco</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona tipo di gioco" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="europeanRoulette">Roulette Europea (37 numeri)</SelectItem>
                              <SelectItem value="americanRoulette">Roulette Americana (38 numeri)</SelectItem>
                              <SelectItem value="liveCasino">Roulette Live con croupier</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Tipo di roulette da utilizzare per le puntate
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={casinoForm.control}
                      name="preferredTable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tavolo preferito</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Nome del tavolo da utilizzare (solo per casinò live)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <FormField
                      control={casinoForm.control}
                      name="credentials.saveCredentials"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Salva credenziali</FormLabel>
                            <FormDescription>
                              Salva le credenziali per il login automatico
                            </FormDescription>
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

                    {casinoForm.watch("credentials.saveCredentials") && (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <div className="flex items-center text-amber-500 mb-2">
                          <Lock className="h-4 w-4 mr-2" />
                          <p className="text-xs">Le credenziali vengono salvate in modo sicuro e utilizzate solo per l'accesso automatico</p>
                        </div>

                        <FormField
                          control={casinoForm.control}
                          name="credentials.username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username PlanetWin365</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={casinoForm.control}
                          name="credentials.password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password PlanetWin365</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <Alert>
                      <Rocket className="h-4 w-4" />
                      <AlertTitle>Modalità Demo</AlertTitle>
                      <AlertDescription>
                        L'applicazione è attualmente in modalità demo. Nessuna connessione reale viene effettuata al casinò e nessun denaro viene utilizzato.
                      </AlertDescription>
                    </Alert>
                  </form>
                </Form>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => casinoForm.reset()}
                disabled={isCasinoLoading || saveCasinoSettings.isPending}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Ripristina
              </Button>
              <Button
                onClick={casinoForm.handleSubmit(onSubmitCasinoSettings)}
                disabled={isCasinoLoading || saveCasinoSettings.isPending}
              >
                {saveCasinoSettings.isPending ? (
                  <>
                    <CircleDashed className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salva impostazioni
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
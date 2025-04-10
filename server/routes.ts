import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { sikulixBot } from "./sikulix";
import { enhancedSikulixConnector } from "./enhancedSikulixConnector";
import { sikulixManager } from "./sikulixManager";
import { sikulixImageManager } from "./sikulixImageManager";
import { botLogSchema, gameResultSchema, strategySchema } from "@shared/schema";
import OpenAI from "openai";
import { buttonAutomationService, ButtonConfig } from "./automationService";
import { WebSocketServer, WebSocket } from 'ws';

// Initialize OpenAI
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "sk-demo-key"
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Inizializza il WebSocket Server per la comunicazione in tempo reale
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Configura il WebSocket per la comunicazione in tempo reale
  wss.on('connection', (ws) => {
    console.log('Client WebSocket connesso');
    
    // Invia lo stato iniziale immediatamente
    sendStatusUpdate(ws);
    sendAllLogsUpdate(ws);
    sendAllResultsUpdate(ws);
    
    // Gestisci i messaggi in entrata
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Messaggio ricevuto dal client:', data);
        
        if (data.type === 'startBot' && data.strategy) {
          handleBotCommand(data, ws);
        } else if (data.type === 'stopBot') {
          sikulixBot.stop().then(() => {
            sendStatusUpdate(ws);
          });
        } else if (data.type === 'request_status' || data.type === 'getStatus') {
          sendStatusUpdate(ws);
        } else if (data.type === 'getLogs') {
          sendAllLogsUpdate(ws);
        } else if (data.type === 'getResults') {
          sendAllResultsUpdate(ws);
        } else {
          console.log('Tipo di messaggio sconosciuto:', data.type);
        }
      } catch (error) {
        console.error('Errore nella gestione del messaggio WebSocket:', error);
      }
    });
    
    // Invia aggiornamenti di stato quando il bot emette eventi
    sikulixBot.on('log', (log) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'botLog',
          data: log
        }));
      }
    });
  });
  
  // Inizializza il modulo SikuliX avanzato
  await enhancedSikulixConnector.initialize();

  // ----- Strategy Endpoints -----
  
  // Get current strategy
  app.get("/api/strategy/current", (req, res) => {
    const strategy = storage.getCurrentStrategy();
    res.json(strategy);
  });

  // Get all strategies
  app.get("/api/strategy", async (req, res) => {
    const strategies = await storage.getStrategies();
    res.json({ strategies });
  });

  // Get a strategy by ID
  app.get("/api/strategy/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID non valido" });
      }
      
      const strategy = await storage.getStrategy(id);
      if (!strategy) {
        return res.status(404).json({ message: "Strategia non trovata" });
      }
      
      res.json(strategy);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errorMessage });
    }
  });

  // Save a strategy
  app.post("/api/strategy", async (req, res) => {
    try {
      const validatedData = strategySchema.parse(req.body);
      const strategy = await storage.saveStrategy(validatedData);
      res.json(strategy);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(400).json({ message: errorMessage });
    }
  });
  
  // Delete a strategy
  app.delete("/api/strategy/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID non valido" });
      }
      
      const success = await storage.deleteStrategy(id);
      if (!success) {
        return res.status(404).json({ message: "Strategia non trovata" });
      }
      
      res.json({ success: true, message: "Strategia eliminata con successo" });
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errorMessage });
    }
  });
  
  // Analyze a strategy using AI
  app.post("/api/strategy/analyze", async (req, res) => {
    try {
      const strategy = strategySchema.parse(req.body);
      
      // Analyze strategy using OpenAI
      const gameResults = storage.getAllGameResults();
      const analysis = await generateAIInsights(gameResults, strategy);
      
      // Save insights
      await storage.saveAIInsights(analysis);
      
      res.json({ success: true, analysis });
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errorMessage });
    }
  });

  // ----- Bot Control Endpoints -----
  
  // Get bot status
  app.get("/api/bot/status", (req, res) => {
    const status = sikulixBot.getStatus();
    res.json({
      active: status.active,
      strategy: status.strategy,
      startTime: status.active ? new Date().toISOString() : null,
      currentSession: storage.getCurrentSession()
    });
  });

  // Start bot
  app.post("/api/bot/start", async (req, res) => {
    try {
      const validatedData = strategySchema.parse(req.body);
      
      // Save strategy if it's new
      await storage.saveStrategy(validatedData);
      
      // Start the bot
      await sikulixBot.start(validatedData);
      
      // Initialize a new session
      storage.startNewSession();
      
      res.json({ success: true, message: "Bot started successfully" });
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(400).json({ message: errorMessage });
    }
  });

  // Stop bot
  app.post("/api/bot/stop", async (req, res) => {
    try {
      await sikulixBot.stop();
      res.json({ success: true, message: "Bot stopped successfully" });
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(400).json({ message: errorMessage });
    }
  });

  // Get bot logs
  app.get("/api/bot/logs", (req, res) => {
    const logs = sikulixBot.getLogs().map((log, index) => ({
      id: index,
      ...log
    }));
    res.json({ logs });
  });

  // Export bot logs
  app.get("/api/bot/logs/export", (req, res) => {
    const logs = sikulixBot.getLogs();
    const formattedLogs = logs.map(log => `[${log.timestamp}] [${log.type}] ${log.message}`).join('\n');
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=bot-logs.txt');
    res.send(formattedLogs);
  });

  // Clear bot logs
  app.delete("/api/bot/logs", (req, res) => {
    sikulixBot.clearLogs();
    res.json({ success: true, message: "Logs cleared successfully" });
  });

  // ----- Game Results Endpoints -----

  // Export game results
  app.get("/api/results/export", (req, res) => {
    const results = storage.getAllGameResults();
    
    // Format as CSV
    const header = "Time,Number,Color,Bet Type,Bet Amount,Outcome,Profit\n";
    const rows = results.map(r => 
      `${r.time},${r.number},${r.color},${r.betType},${r.betAmount},${r.outcome},${r.profit || ''}`
    ).join('\n');
    
    const csv = header + rows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=game-results.csv');
    res.send(csv);
  });

  // ----- Stats Endpoints -----
  
  // Get dashboard stats
  app.get("/api/stats", (req, res) => {
    const stats = storage.getStats();
    res.json(stats);
  });

  // Get performance chart data
  app.get("/api/performance", (req, res) => {
    const timeRange = (req.query.timeRange as string) || 'day';
    const performanceData = storage.getPerformanceData(timeRange);
    res.json(performanceData);
  });

  // ----- AI Analysis Endpoints -----
  
  // Get AI insights
  app.get("/api/ai/insights", async (req, res) => {
    try {
      const insights = await storage.getAIInsights();
      
      if (!insights) {
        // Generate initial insights if none exist
        const gameResults = storage.getAllGameResults();
        const currentStrategy = storage.getCurrentStrategy();
        
        if (gameResults.length > 0 && currentStrategy) {
          const newInsights = await generateAIInsights(gameResults, currentStrategy);
          await storage.saveAIInsights(newInsights);
          res.json(newInsights);
        } else {
          res.status(404).json({ message: "Not enough data for insights" });
        }
      } else {
        res.json(insights);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errorMessage });
    }
  });

  // Request full AI analysis
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const gameResults = storage.getAllGameResults();
      const currentStrategy = storage.getCurrentStrategy();
      
      if (gameResults.length === 0 || !currentStrategy) {
        res.status(400).json({ message: "Not enough data for analysis" });
        return;
      }
      
      // Generate new insights
      const insights = await generateAIInsights(gameResults, currentStrategy);
      await storage.saveAIInsights(insights);
      
      res.json({ success: true, message: "Analysis completed" });
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errorMessage });
    }
  });

  // Questo evento viene gestito con WebSockets

  // ----- Button Automation Endpoints -----
  
  // Get all button configurations
  app.get("/api/automations/buttons", (req, res) => {
    const buttons = buttonAutomationService.getButtonConfigs();
    res.json({ buttons });
  });
  
  // ----- Reports Endpoints -----
  
  // Get all results (for reports)
  app.get("/api/results", (req, res) => {
    if (req.query.all === "true") {
      const results = storage.getAllGameResults();
      res.json({ results });
      return;
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    
    const results = storage.getGameResults(page, limit);
    const total = storage.getGameResultsCount();
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        startIndex: (page - 1) * limit + 1,
        endIndex: Math.min(page * limit, total)
      }
    });
  });
  
  // Generate summary report (text response for demonstration)
  app.get("/api/reports/summary", (req, res) => {
    const results = storage.getAllGameResults();
    const stats = storage.getStats();
    const currentStrategy = storage.getCurrentStrategy();
    
    // Calculate summary data
    const totalGames = results.length;
    const wins = results.filter(r => r.outcome === 'Win').length;
    const losses = results.filter(r => r.outcome === 'Loss').length;
    const winRate = totalGames > 0 ? (wins / totalGames * 100).toFixed(2) : "0.00";
    
    // Format results as simple report text for demonstration
    const report = `
    DAVIDE ROULETTE - REPORT RIASSUNTIVO
    -----------------------------------
    
    Generato il: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
    
    STATISTICHE GENERALI:
    - Totale Round: ${totalGames}
    - Vittorie: ${wins}
    - Perdite: ${losses}
    - Percentuale Vittoria: ${winRate}%
    
    STRATEGIA ATTUALE:
    - Tipo: ${currentStrategy?.type || "N/A"}
    - Puntata Iniziale: ${currentStrategy?.initialBet || "N/A"}
    - Stop Loss: ${currentStrategy?.stopLoss || "N/A"}
    
    ANDAMENTO ULTIMA SESSIONE:
    - Durata Sessione: ${stats?.activePeriod || "N/A"}
    - Saldo Iniziale: ${stats?.startingBalance || "N/A"}
    - Saldo Corrente: ${stats?.currentBalance || "N/A"}
    
    Questo report è stato generato automaticamente dal sistema Davide Roulette.
    `;
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=roulette-summary-report.txt');
    res.send(report);
  });
  
  // Generate statistics report (text response for demonstration)
  app.get("/api/reports/statistics", (req, res) => {
    const results = storage.getAllGameResults();
    const totalGames = results.length;
    
    // Calculate number frequencies
    const numberFrequency: Record<number, number> = {};
    results.forEach(result => {
      numberFrequency[result.number] = (numberFrequency[result.number] || 0) + 1;
    });
    
    // Sort numbers by frequency
    const sortedNumbers = Object.entries(numberFrequency)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map(([number, count]) => `${number}: ${count} volte`);
    
    // Calculate color frequencies
    const redCount = results.filter(r => r.color === 'Red').length;
    const blackCount = results.filter(r => r.color === 'Black').length;
    const greenCount = results.filter(r => r.color === 'Green').length;
    
    // Format report
    const report = `
    DAVIDE ROULETTE - REPORT STATISTICO DETTAGLIATO
    ----------------------------------------------
    
    Generato il: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
    
    STATISTICHE NUMERI:
    I numeri più frequenti (in ordine decrescente):
    ${sortedNumbers.slice(0, 10).join('\n    ')}
    
    STATISTICHE COLORI:
    - Rosso: ${redCount} (${totalGames > 0 ? (redCount / totalGames * 100).toFixed(2) : 0}%)
    - Nero: ${blackCount} (${totalGames > 0 ? (blackCount / totalGames * 100).toFixed(2) : 0}%)
    - Verde: ${greenCount} (${totalGames > 0 ? (greenCount / totalGames * 100).toFixed(2) : 0}%)
    
    SEQUENZE:
    - Sequenza più lunga di rossi: ${calculateLongestSequence(results, (r: any) => r.color === 'Red')}
    - Sequenza più lunga di neri: ${calculateLongestSequence(results, (r: any) => r.color === 'Black')}
    - Sequenza più lunga di vittorie: ${calculateLongestSequence(results, (r: any) => r.outcome === 'Win')}
    - Sequenza più lunga di perdite: ${calculateLongestSequence(results, (r: any) => r.outcome === 'Loss')}
    
    Questo report è stato generato automaticamente dal sistema Davide Roulette.
    `;
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=roulette-statistics-report.txt');
    res.send(report);
  });

  // Save a button configuration
  app.post("/api/automations/buttons", (req, res) => {
    try {
      const buttonConfig = req.body;
      const savedConfig = buttonAutomationService.saveButtonConfig(buttonConfig);
      res.json(savedConfig);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(400).json({ message: errorMessage });
    }
  });

  // Get a specific button configuration
  app.get("/api/automations/buttons/:id", (req, res) => {
    const { id } = req.params;
    const buttonConfig = buttonAutomationService.getButtonConfig(id);
    
    if (!buttonConfig) {
      res.status(404).json({ message: "Button configuration not found" });
      return;
    }
    
    res.json(buttonConfig);
  });
  
  // Delete a button configuration
  app.delete("/api/automations/buttons/:id", (req, res) => {
    const { id } = req.params;
    const success = buttonAutomationService.deleteButtonConfig(id);
    
    if (!success) {
      res.status(404).json({ message: "Button configuration not found" });
      return;
    }
    
    res.json({ success: true, message: "Button configuration deleted successfully" });
  });
  
  // Start button automation
  app.post("/api/automations/buttons/:id/start", async (req, res) => {
    try {
      const { id } = req.params;
      const buttonConfig = buttonAutomationService.getButtonConfig(id);
      
      if (!buttonConfig) {
        res.status(404).json({ message: "Button configuration not found" });
        return;
      }
      
      let strategy = null;
      
      // If the button is linked to a strategy, fetch it
      if (buttonConfig.linkedToStrategy && buttonConfig.selectedStrategy) {
        strategy = await storage.getStrategy(parseInt(buttonConfig.selectedStrategy));
        
        if (!strategy) {
          res.status(404).json({ message: "Linked strategy not found" });
          return;
        }
      }
      
      const success = buttonAutomationService.startButtonAutomation(id, strategy || undefined);
      
      if (!success) {
        res.status(400).json({ message: "Failed to start button automation" });
        return;
      }
      
      res.json({ success: true, message: "Button automation started successfully" });
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errorMessage });
    }
  });
  
  // Stop button automation
  app.post("/api/automations/buttons/:id/stop", (req, res) => {
    const { id } = req.params;
    const success = buttonAutomationService.stopButtonAutomation(id);
    
    if (!success) {
      res.status(400).json({ message: "Failed to stop button automation" });
      return;
    }
    
    res.json({ success: true, message: "Button automation stopped successfully" });
  });
  
  // Get active buttons
  app.get("/api/automations/buttons/active", (req, res) => {
    const activeButtons = buttonAutomationService.getActiveButtons();
    res.json({ activeButtons });
  });
  
  // ----- Settings Endpoints -----

  // Get general settings
  app.get("/api/settings/general", (req, res) => {
    // In questo esempio restituiamo delle impostazioni predefinite
    // In un'applicazione reale si recupererebbero dal database
    res.json({
      language: "it",
      theme: "system",
      notifications: true,
      sounds: true,
      autoSaveInterval: 5,
      devMode: false,
    });
  });

  // Save general settings
  app.post("/api/settings/general", (req, res) => {
    try {
      // In un'applicazione reale salveremmo questi dati nel database
      // Per ora restituiamo semplicemente i dati ricevuti
      res.json(req.body);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(400).json({ message: errorMessage });
    }
  });

  // Get account settings
  app.get("/api/settings/account", (req, res) => {
    // In questo esempio restituiamo delle impostazioni predefinite
    res.json({
      username: "Dinquart84",
      email: "user@example.com",
      displayName: "Davide",
      changePassword: false,
    });
  });

  // Save account settings
  app.post("/api/settings/account", (req, res) => {
    try {
      // In un'applicazione reale salveremmo questi dati nel database
      res.json(req.body);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(400).json({ message: errorMessage });
    }
  });

  // Get bot settings
  app.get("/api/settings/bot", (req, res) => {
    // In questo esempio restituiamo delle impostazioni predefinite
    res.json({
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
    });
  });

  // Save bot settings
  app.post("/api/settings/bot", (req, res) => {
    try {
      // In un'applicazione reale salveremmo questi dati nel database
      res.json(req.body);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(400).json({ message: errorMessage });
    }
  });

  // Get casino settings
  app.get("/api/settings/casino", (req, res) => {
    // In questo esempio restituiamo delle impostazioni predefinite
    res.json({
      casinoUrl: "https://www.planetwin365.it",
      credentials: {
        saveCredentials: false,
        username: "",
        password: "",
      },
      gameType: "europeanRoulette",
      preferredTable: "Roulette Live",
    });
  });

  // Save casino settings
  app.post("/api/settings/casino", (req, res) => {
    try {
      // In un'applicazione reale salveremmo questi dati nel database
      res.json(req.body);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(400).json({ message: errorMessage });
    }
  });

  // Reset endpoint
  app.post("/api/reset", (req, res) => {
    try {
      const { type } = req.body;
      
      // In un'applicazione reale eseguiremmo le operazioni di reset appropriate
      switch (type) {
        case "all":
          // Reset completo
          sikulixBot.clearLogs();
          break;
        case "statistics":
          // Reset solo statistiche
          break;
        case "strategies":
          // Reset solo strategie
          break;
        case "logs":
          // Reset solo log
          sikulixBot.clearLogs();
          break;
      }
      
      res.json({ success: true, message: `Reset ${type} completato con successo` });
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errorMessage });
    }
  });

  // Setup event listeners for button automation service
  buttonAutomationService.on('log', (log) => {
    sikulixBot.addLog(log.type, log.message);
  });
  
  buttonAutomationService.on('result', (result) => {
    if (result.outcome === 'win') {
      const timestamp = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      sikulixBot.addLog('success', `Automazione pulsante: Risultato vincente dopo ${result.pressCount} pressioni!`);
    }
  });

  // Configurazione WebSocket per la comunicazione in tempo reale
  wss.on('connection', (ws) => {
    console.log('Client WebSocket connesso');
    
    // Invia un messaggio di benvenuto
    ws.send(JSON.stringify({
      type: 'connect',
      message: 'Connesso al server Davide Roulette',
      timestamp: new Date().toISOString()
    }));
    
    // Ascolta per messaggi dal client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Messaggio ricevuto dal client:', data);
        
        // Gestisce i vari tipi di messaggi
        switch (data.type) {
          case 'bot_command':
            handleBotCommand(data, ws);
            break;
            
          case 'request_status':
            sendStatusUpdate(ws);
            break;
            
          default:
            console.log('Tipo di messaggio sconosciuto:', data.type);
            break;
        }
      } catch (error) {
        console.error('Errore nella gestione del messaggio WebSocket:', error);
      }
    });
    
    // Gestisce la disconnessione
    ws.on('close', () => {
      console.log('Client WebSocket disconnesso');
    });
    
    // Invia aggiornamenti periodici sullo stato del bot
    const statusInterval = setInterval(() => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        sendStatusUpdate(ws);
      } else {
        clearInterval(statusInterval);
      }
    }, 5000);
  });
  
  // Configurazione degli event handler per gli eventi di SikuliX
  enhancedSikulixConnector.on('bot-started', (data) => {
    broadcastToClients({
      type: 'bot_started',
      data,
      timestamp: new Date().toISOString()
    });
  });
  
  enhancedSikulixConnector.on('bot-stopped', (data) => {
    broadcastToClients({
      type: 'bot_stopped',
      data,
      timestamp: new Date().toISOString()
    });
  });
  
  enhancedSikulixConnector.on('session-update', (data) => {
    broadcastToClients({
      type: 'session_update',
      data,
      timestamp: new Date().toISOString()
    });
  });
  
  enhancedSikulixConnector.on('result', (result) => {
    broadcastToClients({
      type: 'game_result',
      data: result,
      timestamp: new Date().toISOString()
    });
  });
  
  enhancedSikulixConnector.on('log', (log) => {
    broadcastToClients({
      type: 'bot_log',
      data: log,
      timestamp: new Date().toISOString()
    });
  });
  
  // Aggiornata la funzione broadcastToClients per evitare duplicazioni
  const broadcastToClients = (message: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(message));
      }
    });
  };
  
  // Aggiornata la funzione handleBotCommand per evitare duplicazioni
  const handleBotCommand = async (data: any, ws: any) => {
    try {
      switch (data.command) {
        case 'start':
          if (data.strategy) {
            await enhancedSikulixConnector.startBot(data.strategy);
            ws.send(JSON.stringify({
              type: 'command_response',
              command: 'start',
              success: true,
              message: 'Bot avviato correttamente',
              timestamp: new Date().toISOString()
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'command_response',
              command: 'start',
              success: false,
              message: 'Strategia non specificata',
              timestamp: new Date().toISOString()
            }));
          }
          break;
          
        case 'stop':
          await enhancedSikulixConnector.stopAllBots();
          ws.send(JSON.stringify({
            type: 'command_response',
            command: 'stop',
            success: true,
            message: 'Bot fermato correttamente',
            timestamp: new Date().toISOString()
          }));
          break;
          
        default:
          ws.send(JSON.stringify({
            type: 'command_response',
            command: data.command,
            success: false,
            message: 'Comando sconosciuto',
            timestamp: new Date().toISOString()
          }));
          break;
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      ws.send(JSON.stringify({
        type: 'command_response',
        command: data.command,
        success: false,
        message: errorMessage,
        timestamp: new Date().toISOString()
      }));
    }
  }
  
  // Funzione per inviare un aggiornamento sullo stato del bot
  const sendStatusUpdate = (ws: any) => {
    const status = enhancedSikulixConnector.getBotStatus();
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'botStatus',
        data: status,
        timestamp: new Date().toISOString()
      }));
    }
  }
  
  const sendAllLogsUpdate = (ws: any) => {
    const logs = sikulixBot.getLogs();
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'allLogs',
        data: logs,
        timestamp: new Date().toISOString()
      }));
    }
  }
  
  const sendAllResultsUpdate = (ws: any) => {
    const results = storage.getAllGameResults();
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'allResults',
        data: results,
        timestamp: new Date().toISOString()
      }));
    }
  }
  
  // Aggiungi endpoint per la gestione delle risorse di SikuliX
  
  // Endpoint per verificare lo stato di installazione di SikuliX
  app.get("/api/sikulix/status", async (req, res) => {
    try {
      const isInstalled = await sikulixManager.checkInstallation();
      const requirements = await sikulixManager.checkSystemRequirements();
      
      res.json({
        installed: isInstalled,
        requirements,
        readyToUse: isInstalled && requirements.java
      });
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errorMessage });
    }
  });
  
  // Endpoint per installare SikuliX
  app.post("/api/sikulix/install", async (req, res) => {
    try {
      const result = await sikulixManager.installSikuliX();
      res.json({
        success: result,
        message: result ? "SikuliX installato correttamente" : "Errore nell'installazione di SikuliX"
      });
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errorMessage });
    }
  });
  
  // Endpoint per ottenere l'elenco delle immagini di SikuliX
  app.get("/api/sikulix/images", (req, res) => {
    try {
      const images = sikulixImageManager.getAllImageMetadata();
      res.json({ images });
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errorMessage });
    }
  });
  
  // Endpoint per avviare il bot con una strategia avanzata
  app.post("/api/sikulix/start", async (req, res) => {
    try {
      const strategy = strategySchema.parse(req.body);
      
      // Salva la strategia se è nuova
      await storage.saveStrategy(strategy);
      
      // Avvia il bot avanzato
      const result = await enhancedSikulixConnector.startBot(strategy);
      
      // Inizializza una nuova sessione
      storage.startNewSession();
      
      res.json({ 
        success: result, 
        message: "Bot avviato correttamente"
      });
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(400).json({ message: errorMessage });
    }
  });
  
  // Endpoint per fermare tutti i bot
  app.post("/api/sikulix/stop", async (req, res) => {
    try {
      const result = await enhancedSikulixConnector.stopAllBots();
      res.json({ 
        success: result, 
        message: "Tutti i bot sono stati fermati"
      });
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(400).json({ message: errorMessage });
    }
  });
  
  // Endpoint per ottenere lo stato di tutti i bot
  app.get("/api/sikulix/status/all", (req, res) => {
    try {
      const status = enhancedSikulixConnector.getBotStatus();
      res.json(status);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errorMessage });
    }
  });
  
  // Rimosso duplicate delle helper functions per WebSocket handling

  // Configura eventi globali per la comunicazione tramite WebSocket
  sikulixBot.on('result', async (result) => {
    const gameResult = await storage.addGameResult({
      id: storage.getNextGameResultId(),
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }),
      number: result.number,
      color: result.color,
      betType: result.betType,
      betAmount: result.betAmount,
      outcome: result.outcome,
      profit: result.outcome === 'Win' ? result.profit : undefined
    });
    
    await storage.updateSession(gameResult);
    
    // Invia il risultato a tutti i client WebSocket connessi
    broadcastToClients({
      type: 'gameResult',
      data: gameResult
    });
    
    broadcastToClients({
      type: 'botStatus',
      data: {
        active: sikulixBot.getStatus().active,
        strategy: sikulixBot.getStatus().strategy,
        startTime: sikulixBot.getStatus().active ? new Date().toISOString() : null,
        stats: storage.getCurrentSession()
      }
    });
  });

  return httpServer;
}

// Helper function to calculate the longest sequence matching a condition
function calculateLongestSequence(results: any[], predicate: (result: any) => boolean): number {
  let longestSequence = 0;
  let currentSequence = 0;
  
  for (const result of results) {
    if (predicate(result)) {
      currentSequence++;
      longestSequence = Math.max(longestSequence, currentSequence);
    } else {
      currentSequence = 0;
    }
  }
  
  return longestSequence;
}

// Helper function to generate AI insights
async function generateAIInsights(
  gameResults: Array<any>, 
  currentStrategy: any
): Promise<any> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert AI assistant specialized in roulette strategy analysis and optimization.
Your task is to provide data-driven insights based on game results and the current betting strategy.
You should think critically about the statistical patterns, success rates, and risk factors in roulette.

For your analysis, consider:
1. The mathematics behind the current strategy (Martingale, Fibonacci, D'Alembert, etc.)
2. Statistical anomalies in the results (hot/cold numbers, color streaks)
3. Risk to reward ratios 
4. Bankroll management implications
5. Progression of bets over time
6. Sustainability of the strategy

Return your analysis as a JSON object with these fields:
- strategyAnalysis: A technical evaluation of the current strategy's effectiveness
- riskAssessment: An evaluation of financial risk and potential loss scenarios
- trendDetection: Identification of any meaningful patterns in the results
- recommendedAdjustments: Specific recommendations to optimize the current strategy

Keep each insight concise but comprehensive (under 100 words per section).`
        },
        {
          role: "user",
          content: JSON.stringify({
            gameResults: gameResults.slice(-50), // Last 50 results
            currentStrategy,
            currentBankroll: 1000, // Assumed starting bankroll
            sessionDuration: gameResults.length > 0 ? `${gameResults.length} rounds` : "New session"
          })
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content || "{}";
    const insights = JSON.parse(content);
    
    return {
      ...insights,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error generating AI insights:", error);
    
    // Fallback insights if API fails
    return {
      strategyAnalysis: "Unable to generate strategy analysis at this time. Please try again later.",
      riskAssessment: "Risk assessment is currently unavailable. This could be due to API connectivity issues.",
      trendDetection: "Trend detection is currently unavailable. Please ensure you have sufficient game history.",
      recommendedAdjustments: "Strategy recommendations cannot be generated at this moment.",
      lastUpdated: new Date().toISOString()
    };
  }
}

# Davide Roulette - Sistema Avanzato di Automazione per Roulette

Un sistema completo per automatizzare le strategie di scommessa alla roulette con monitoraggio in tempo reale, analisi e approfondimenti potenziati dall'intelligenza artificiale.

## Panoramica

Davide Roulette è un sistema modulare che integra:
- **Dashboard Interattiva:** Configura strategie e visualizza statistiche e report in tempo reale
- **Automazione Bot:** Utilizza SikuliX per interagire con i siti dei casinò tramite riconoscimento visivo
- **Analisi AI:** Sfrutta GPT-4o per analizzare i dati delle scommesse e fornire approfondimenti strategici
- **Comunicazione Real-time:** Sistema WebSocket integrato per aggiornamenti istantanei

## Caratteristiche Principali

### Dashboard
- Selezione semplificata del tipo di strategia (senza dettagli per evitare confusione)
- Monitoraggio delle prestazioni in tempo reale con WebSocket
- Storico completo dei risultati di gioco
- Log di attività del bot con aggiornamenti istantanei
- Insights e raccomandazioni potenziate dall'AI
- Interfaccia utente responsive e intuitiva

### Strategie di Scommessa
- **Martingala:** Raddoppia la puntata dopo ogni perdita
- **Fibonacci:** Sequenza progressiva basata sui numeri di Fibonacci
- **D'Alembert:** Incremento graduale (più conservativo)
- **Personalizzata:** Imposta i tuoi parametri specifici

### Opzioni di Puntata
- Puntate sui colori (rosso/nero)
- Puntate su pari/dispari
- Puntate sulle dozzine (prima/seconda/terza)
- Configurazione delle condizioni di ingresso

### Sistema di Automazione Bot
- Navigazione e interazione con i casinò tramite SikuliX
- Posizionamento automatico delle puntate basato sulle strategie configurate
- Rilevamento dei risultati e applicazione della strategia selezionata
- Logging dettagliato delle attività con trasmissione in tempo reale
- Supporto per modalità multi-account (fino a 3 account simultanei)
- Supporto specifico per Roulette Speed LIVE di PlanetWin365

### Analisi AI
- Valutazione delle prestazioni della strategia
- Valutazione del rischio con raccomandazioni
- Rilevamento di pattern e tendenze nei risultati
- Suggerimenti per l'ottimizzazione delle strategie
- Possibilità di importare dataset CSV esterni (min. 100.000 righe)

### Sistema di Allarmi
- Notifiche configurabili in base a vari trigger
- Opzioni di notifica via email o Telegram
- Condizioni di arresto automatico configurabili

### Comunicazione in Tempo Reale
- Aggiornamenti istantanei dello stato del bot tramite WebSocket
- Trasmissione in diretta dei risultati delle puntate
- Monitoraggio attivo delle sessioni di gioco
- Controllo remoto delle operazioni del bot

## Architettura del Sistema

### Frontend
- React con componenti funzionali e hooks
- Tailwind CSS per UI responsive
- Recharts per visualizzazione dati
- Componenti UI di Shadcn
- Comunicazione WebSocket per aggiornamenti in tempo reale

### Backend
- Node.js con Express
- Architettura modulare basata su servizi
- Storage in memoria (futura integrazione con MongoDB)
- SikuliX per automazione visiva
- Integrazione API OpenAI GPT-4o
- Server WebSocket per comunicazione bidirezionale

### Moduli Principali
- **WebSocketProvider:** Gestisce la connessione WebSocket lato client
- **BotActivityMonitor:** Visualizza i log dell'attività del bot in tempo reale
- **sikulixBot:** Interfaccia principale per l'automazione
- **enhancedSikulixConnector:** Connettore avanzato con supporto multi-account
- **sikulixManager:** Gestisce l'installazione e la configurazione di SikuliX
- **sikulixImageManager:** Gestisce le immagini per il riconoscimento visivo
- **buttonAutomationService:** Gestisce l'automazione dei pulsanti
- **AIInsights:** Componente per l'analisi AI delle strategie

## Componenti Tecniche

### Integrazione con PlanetWin365
- Supporto specifico per l'interfaccia del casinò PlanetWin365
- Riconoscimento automatico degli elementi dell'interfaccia
- Navigazione intelligente all'interno del sito
- Gestione automatica del login e dell'accesso alle tabelle della roulette

### SikuliX Integration
- API Java wrapper per il controllo SikuliX
- Sistema di immagini per il riconoscimento visivo
- Gestione del movimento del mouse e dei clic
- Rilevamento automatico dei risultati della roulette

### WebSocket Communication
- Comunicazione bidirezionale in tempo reale
- Trasmissione istantanea degli eventi del bot
- Monitoraggio dello stato e delle statistiche
- Controllo remoto delle operazioni del bot

### Sistema di Sicurezza
- Rilevamento automatico di anomalie
- Funzionalità di stop-loss configurabile
- Limiti di sessione e di puntata
- Sistema di backup e recovery

## Requisiti di Sistema

### Prerequisiti
- Node.js (v16+)
- Java Runtime Environment (per SikuliX)
- SikuliX setup (v2.0.5+)
- Account PlanetWin365 (per utilizzo reale)
- Accesso a Internet stabile

### Requisiti Hardware
- Windows, macOS o Linux
- Minimo 8GB di RAM
- Display con risoluzione almeno 1920x1080
- Processore multi-core per il riconoscimento delle immagini

### Requisiti Software
- Browser moderno (Chrome, Firefox, Edge)
- Java 8+ installato
- OpenAI API Key (per l'analisi AI)

### Ambiente di Sviluppo
- TypeScript per type safety
- ESLint per qualità del codice
- React Dev Tools per debugging frontend
- WebSocket debugging tools

### Variabili d'Ambiente
- OPENAI_API_KEY: Chiave API OpenAI per l'analisi AI
- NODE_ENV: 'development' o 'production'

## Installazione e Setup

```bash
# Clona il repository
git clone https://github.com/tuo-username/davide-roulette.git
cd davide-roulette

# Installa le dipendenze
npm install

# Avvia l'applicazione in modalità sviluppo
npm run dev
```

## Configurazione di SikuliX
1. Installare Java JRE 8+ sul sistema
2. Scaricare SikuliX v2.0.5 o superiore
3. Eseguire l'installazione guidata di SikuliX
4. Configurare il percorso di SikuliX nell'applicazione

## Utilizzo

### Configurazione Strategie
1. Vai alla sezione "Configurazione Strategie" 
2. Seleziona una delle strategie predefinite o crea una personalizzata
3. Imposta i parametri dettagliati (puntata iniziale, progressione, stop-loss, ecc.)
4. Salva la strategia

### Avvio del Bot
1. Vai alla dashboard principale
2. Seleziona semplicemente il tipo di strategia da usare (senza dettagli per evitare confusione)
3. Clicca su "Avvia Bot"
4. Monitora in tempo reale l'andamento tramite i vari indicatori

### Analisi AI
1. Vai alla sezione "Analisi AI"
2. Seleziona un dataset di risultati o utilizza quelli registrati
3. Clicca su "Genera Insights" per ottenere l'analisi AI
4. Esamina i suggerimenti e le raccomandazioni

## Flusso Operativo
1. Configurazione delle strategie e dei parametri
2. Avvio del bot con la strategia selezionata
3. SikuliX interagisce con il casinò online
4. I risultati vengono registrati e analizzati in tempo reale
5. L'AI fornisce insights e suggerimenti di ottimizzazione
6. L'utente può modificare le strategie o interrompere il bot in qualsiasi momento

## Struttura del Progetto

```
davide-roulette/
├── client/                   # Frontend React
│   ├── src/
│   │   ├── components/       # Componenti UI riutilizzabili
│   │   ├── hooks/            # React hooks personalizzati
│   │   ├── lib/              # Utility e servizi
│   │   ├── pages/            # Pagine dell'applicazione
│   │   └── App.tsx           # Componente principale
├── server/                   # Backend Express
│   ├── automationService.ts  # Servizio di automazione pulsanti
│   ├── index.ts              # Entry point server
│   ├── routes.ts             # API routes
│   ├── sikulix.ts            # Integrazione SikuliX base
│   ├── sikulixConnector.ts   # Connettore SikuliX
│   ├── sikulixManager.ts     # Gestione SikuliX
│   ├── enhancedSikulixConnector.ts # Connettore avanzato
│   ├── sikulixImageManager.ts # Gestione immagini
│   ├── storage.ts            # Storage dei dati
│   └── vite.ts               # Configurazione Vite
├── shared/                   # Codice condiviso
│   └── schema.ts             # Schema dati condiviso
├── scripts/                  # Script di utilità
│   └── sikulix/              # Script SikuliX
│       └── PlanetWin365Bot.js # Script bot
└── package.json              # Dipendenze e script
```

## Collaboratori

- Davide (Ideatore e Proprietario del Progetto)
- Team di Sviluppo

## Licenza

Questo progetto è proprietario. Tutti i diritti sono riservati.

---

*Nota: Questo sistema è stato creato solo per scopi dimostrativi e didattici. L'utilizzo di bot su siti di casinò può essere contrario ai termini di servizio di tali piattaforme. Utilizzare responsabilmente e unicamente su conti demo.*

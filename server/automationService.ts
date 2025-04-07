/**
 * Servizio di automazione per i pulsanti di gioco
 * 
 * Questo modulo gestisce le configurazioni e l'esecuzione delle automazioni
 * dei pulsanti di gioco attraverso SikuliX
 */
import { EventEmitter } from 'events';
import { Strategy } from '@shared/schema';

export interface ButtonConfig {
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

class ButtonAutomationService extends EventEmitter {
  private buttonConfigs: Map<string, ButtonConfig>;
  private activeButtons: Set<string>;
  private automationIntervals: Map<string, NodeJS.Timeout>;
  private currentId: number;

  constructor() {
    super();
    this.buttonConfigs = new Map();
    this.activeButtons = new Set();
    this.automationIntervals = new Map();
    this.currentId = 1;

    // Aggiungere configurazione di esempio per la demo
    this.addDemoData();
  }

  private addDemoData(): void {
    const demoButton: ButtonConfig = {
      id: 'button-1',
      name: 'Pulsante Spin',
      pressInterval: 5,
      pressCount: 10,
      targetArea: 'spin-button',
      coordinates: { x: 650, y: 450 },
      pressPattern: 'sequential',
      waitBetweenPress: 2,
      stopOnWin: true,
      linkedToStrategy: true,
      selectedStrategy: '1',
      createdAt: new Date().toISOString()
    };

    this.buttonConfigs.set(demoButton.id, demoButton);
    this.currentId = 2;
  }

  /**
   * Salva una configurazione di pulsante
   */
  saveButtonConfig(config: Omit<ButtonConfig, 'id' | 'createdAt'>): ButtonConfig {
    const id = `button-${this.currentId++}`;
    const newConfig: ButtonConfig = {
      ...config,
      id,
      createdAt: new Date().toISOString()
    };

    this.buttonConfigs.set(id, newConfig);
    return newConfig;
  }

  /**
   * Recupera tutte le configurazioni di pulsante
   */
  getButtonConfigs(): ButtonConfig[] {
    return Array.from(this.buttonConfigs.values());
  }

  /**
   * Recupera una specifica configurazione di pulsante
   */
  getButtonConfig(id: string): ButtonConfig | undefined {
    return this.buttonConfigs.get(id);
  }

  /**
   * Elimina una configurazione di pulsante
   */
  deleteButtonConfig(id: string): boolean {
    // Se il pulsante è attivo, fermalo prima di eliminarlo
    if (this.activeButtons.has(id)) {
      this.stopButtonAutomation(id);
    }
    
    return this.buttonConfigs.delete(id);
  }

  /**
   * Avvia l'automazione di un pulsante
   */
  startButtonAutomation(id: string, strategy?: Strategy): boolean {
    const config = this.buttonConfigs.get(id);
    if (!config) return false;

    // Se è già attivo, non fare nulla
    if (this.activeButtons.has(id)) return true;

    // Aggiungere alla lista dei pulsanti attivi
    this.activeButtons.add(id);

    // Registra l'avvio nel log
    this.emit('log', {
      type: 'info',
      message: `Automazione "${config.name}" avviata`
    });

    // In un ambiente reale, qui si avvierebbe SikuliX per automatizzare i clic
    // Per la demo, simuliamo l'automazione con intervalli
    let pressCount = 0;
    const interval = setInterval(() => {
      pressCount++;
      
      // Simula la pressione del pulsante
      this.simulateButtonPress(config, pressCount);

      // Se abbiamo raggiunto il numero massimo di pressioni, ferma l'automazione
      if (pressCount >= config.pressCount) {
        this.stopButtonAutomation(id);
      }
    }, config.pressInterval * 1000);

    // Salva l'intervallo per poterlo fermare in seguito
    this.automationIntervals.set(id, interval);
    
    return true;
  }

  /**
   * Ferma l'automazione di un pulsante
   */
  stopButtonAutomation(id: string): boolean {
    // Se il pulsante non è attivo, non fare nulla
    if (!this.activeButtons.has(id)) return false;

    // Ferma l'intervallo
    const interval = this.automationIntervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.automationIntervals.delete(id);
    }

    // Rimuovi dalla lista dei pulsanti attivi
    this.activeButtons.delete(id);

    // Registra lo stop nel log
    const config = this.buttonConfigs.get(id);
    if (config) {
      this.emit('log', {
        type: 'info',
        message: `Automazione "${config.name}" fermata`
      });
    }

    return true;
  }

  /**
   * Verifica se un pulsante è attualmente in esecuzione
   */
  isButtonActive(id: string): boolean {
    return this.activeButtons.has(id);
  }

  /**
   * Recupera lo stato di tutti i pulsanti attivi
   */
  getActiveButtons(): string[] {
    return Array.from(this.activeButtons);
  }

  /**
   * Simula la pressione di un pulsante (per scopi dimostrativi)
   */
  private simulateButtonPress(config: ButtonConfig, pressCount: number): void {
    // Calcola le coordinate effettive in base al pattern
    let x = config.coordinates.x;
    let y = config.coordinates.y;

    if (config.pressPattern === 'random') {
      // Aggiungi un offset casuale per simulare clic in posizioni leggermente diverse
      x += Math.floor(Math.random() * 10) - 5;
      y += Math.floor(Math.random() * 10) - 5;
    } else if (config.pressPattern === 'alternating') {
      // Alterna tra due posizioni diverse
      x += (pressCount % 2 === 0) ? 10 : -10;
    }

    // Emetti un evento di log per la pressione
    this.emit('log', {
      type: 'info',
      message: `Pressione #${pressCount} su "${config.name}" alle coordinate (${x}, ${y})`
    });

    // Simula la possibilità di vittoria per il pulsante stopOnWin
    if (config.stopOnWin && Math.random() > 0.8) {
      this.emit('result', {
        buttonId: config.id,
        outcome: 'win',
        pressCount
      });

      this.emit('log', {
        type: 'success',
        message: `Vittoria rilevata per "${config.name}" dopo ${pressCount} pressioni!`
      });

      // Ferma l'automazione se stopOnWin è attivo
      this.stopButtonAutomation(config.id);
    }
  }
}

export const buttonAutomationService = new ButtonAutomationService();
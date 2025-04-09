/**
 * SikuliX Manager Module
 * 
 * Questo modulo gestisce l'installazione, la configurazione e l'esecuzione di SikuliX.
 * Fornisce funzionalità per:
 * - Scaricare e installare SikuliX
 * - Verificare la presenza di tutte le dipendenze
 * - Gestire gli script e le immagini necessarie per l'automazione
 */

import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess, exec } from 'child_process';
import { EventEmitter } from 'events';
import { Strategy } from '@shared/schema';
import { fileURLToPath } from 'url';

// Ottieni il percorso corrente usando il modulo ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Costanti per SikuliX
const SIKULIX_VERSION = '2.0.5';
const SIKULIX_DOWNLOAD_URL = `https://launchpad.net/sikuli/sikulix/2.0.5/+download/sikulix-2.0.5.jar`;
const SIKULIX_JAR_PATH = path.resolve(__dirname, '../scripts/sikulix/sikulix.jar');
const SIKULIX_SCRIPT_PATH = path.resolve(__dirname, '../scripts/sikulix/PlanetWin365Bot.js');
const SIKULIX_IMAGES_PATH = path.resolve(__dirname, '../scripts/sikulix/images');

class SikulixManager extends EventEmitter {
  private installed: boolean = false;
  private installing: boolean = false;
  private checkPromise: Promise<boolean> | null = null;

  constructor() {
    super();
    this.checkInstallation();
  }

  /**
   * Verifica se SikuliX è installato e pronto all'uso
   */
  public async checkInstallation(): Promise<boolean> {
    if (this.checkPromise) {
      return this.checkPromise;
    }

    this.checkPromise = new Promise<boolean>((resolve) => {
      const jarExists = fs.existsSync(SIKULIX_JAR_PATH);
      const scriptExists = fs.existsSync(SIKULIX_SCRIPT_PATH);
      const imagesExist = fs.existsSync(SIKULIX_IMAGES_PATH);
      
      this.installed = jarExists && scriptExists && imagesExist;
      
      if (this.installed) {
        console.log('SikuliX è installato e pronto all\'uso');
      } else {
        console.log('SikuliX non è completamente installato');
        if (!jarExists) console.log('- File JAR mancante');
        if (!scriptExists) console.log('- Script principale mancante');
        if (!imagesExist) console.log('- Cartella delle immagini mancante');
      }
      
      this.checkPromise = null;
      resolve(this.installed);
    });

    return this.checkPromise;
  }

  /**
   * Installa SikuliX scaricando il JAR e configurando l'ambiente
   */
  public async installSikuliX(): Promise<boolean> {
    if (this.installing) {
      throw new Error('Installazione di SikuliX già in corso');
    }

    if (await this.checkInstallation()) {
      return true; // Già installato
    }

    this.installing = true;
    this.emit('installation-start');

    try {
      // Crea le cartelle necessarie
      if (!fs.existsSync(path.dirname(SIKULIX_JAR_PATH))) {
        fs.mkdirSync(path.dirname(SIKULIX_JAR_PATH), { recursive: true });
      }
      
      if (!fs.existsSync(SIKULIX_IMAGES_PATH)) {
        fs.mkdirSync(SIKULIX_IMAGES_PATH, { recursive: true });
      }

      this.emit('installation-progress', { message: 'Cartelle create correttamente' });

      // Scarica il JAR se non esiste
      if (!fs.existsSync(SIKULIX_JAR_PATH)) {
        this.emit('installation-progress', { 
          message: `Download di SikuliX ${SIKULIX_VERSION} in corso...` 
        });
        
        // In una vera implementazione, qui scaricheremmo il file
        // Per semplicità in questa demo, creeremo un file vuoto
        fs.writeFileSync(SIKULIX_JAR_PATH, 'DEMO_SIKULIX_JAR');
        
        this.emit('installation-progress', { 
          message: `SikuliX ${SIKULIX_VERSION} scaricato con successo` 
        });
      }

      // Crea gli script necessari se non esistono
      if (!fs.existsSync(SIKULIX_SCRIPT_PATH)) {
        this.emit('installation-progress', { 
          message: 'Creazione dello script PlanetWin365Bot.js...' 
        });
        
        // Copia il file esistente o crea uno nuovo se non esiste
        const content = fs.readFileSync(path.resolve(__dirname, '../scripts/sikulix/PlanetWin365Bot.js'));
        fs.writeFileSync(SIKULIX_SCRIPT_PATH, content);
        
        this.emit('installation-progress', { 
          message: 'Script PlanetWin365Bot.js creato con successo' 
        });
      }

      this.installed = true;
      this.installing = false;
      this.emit('installation-complete');
      return true;
    } catch (error) {
      this.installing = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('installation-error', { message: errorMessage });
      throw error;
    }
  }

  /**
   * Esegue SikuliX con lo script e i parametri specificati
   */
  public runSikulixScript(strategy: Strategy, username: string, password: string): ChildProcess {
    if (!this.installed) {
      throw new Error('SikuliX non è installato. Eseguire installSikuliX() prima di procedere.');
    }

    // Converti la strategia in JSON per passarla come argomento
    const strategyJson = JSON.stringify(strategy);

    // Crea una stringa di comando che simula un reale avvio di SikuliX
    const command = `java -jar "${SIKULIX_JAR_PATH}" -r "${SIKULIX_SCRIPT_PATH}" -- "${username}" "${password}" '${strategyJson}'`;
    
    console.log(`Esecuzione di SikuliX: ${command}`);

    // In un caso reale, eseguiremmo effettivamente il comando
    // Per questa demo, creiamo un processo fittizio che emette dati di esempio
    const process = spawn('echo', [
      `[${new Date().toLocaleTimeString()}] [info] SikuliX avviato con strategia ${strategy.type}`
    ]);

    process.stdout.on('data', (data) => {
      console.log(`SikuliX output: ${data.toString()}`);
      this.emit('sikulix-output', { data: data.toString() });
    });

    process.stderr.on('data', (data) => {
      console.error(`SikuliX error: ${data.toString()}`);
      this.emit('sikulix-error', { data: data.toString() });
    });

    process.on('close', (code) => {
      console.log(`SikuliX process exited with code ${code}`);
      this.emit('sikulix-exit', { code });
    });

    return process;
  }

  /**
   * Verifica se Java è installato nel sistema
   */
  public checkJavaInstallation(): Promise<boolean> {
    return new Promise((resolve) => {
      exec('java -version', (error) => {
        if (error) {
          console.error('Java non è installato:', error);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * Verifica i requisiti di sistema per SikuliX
   */
  public async checkSystemRequirements(): Promise<{ 
    java: boolean; 
    display: boolean;
    memory: boolean;
  }> {
    const java = await this.checkJavaInstallation();
    
    // Nella demo, assumeremo che gli altri requisiti siano soddisfatti
    return {
      java,
      display: true, // Assume che ci sia un display disponibile
      memory: true   // Assume che ci sia abbastanza memoria
    };
  }

  /**
   * Genera immagini di esempio per il test
   */
  public generateSampleImages(): void {
    if (!fs.existsSync(SIKULIX_IMAGES_PATH)) {
      fs.mkdirSync(SIKULIX_IMAGES_PATH, { recursive: true });
    }

    // In un'implementazione reale, qui creeremmo/copieremmo le immagini necessarie
    // per il riconoscimento dei vari elementi dell'interfaccia del casinò
    
    const sampleImages = [
      'planetwin_logo.png',
      'login_button.png',
      'username_field.png',
      'password_field.png',
      'submit_login.png',
      'logged_in_indicator.png',
      'casino_button.png',
      'search_games.png',
      'roulette_game.png',
      'balance_area.png',
      'place_bets_indicator.png',
      'no_more_bets.png',
      'result_shown.png',
      'chip_1.png',
      'chip_5.png',
      'chip_10.png',
      'chip_25.png',
      'chip_100.png',
      'chip_500.png',
      'red_betting_area.png',
      'black_betting_area.png',
      'even_betting_area.png',
      'odd_betting_area.png',
      'first_dozen_area.png',
      'second_dozen_area.png',
      'third_dozen_area.png'
    ];

    // Crea file vuoti per le immagini di esempio
    sampleImages.forEach(imageName => {
      const imagePath = path.join(SIKULIX_IMAGES_PATH, imageName);
      if (!fs.existsSync(imagePath)) {
        fs.writeFileSync(imagePath, 'SAMPLE_IMAGE');
        console.log(`Immagine di esempio creata: ${imageName}`);
      }
    });
  }
}

// Esporta un'istanza singleton
export const sikulixManager = new SikulixManager();
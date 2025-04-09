/**
 * SikuliX Image Manager
 * 
 * Questo modulo gestisce l'upload, il download e la manipolazione delle immagini
 * utilizzate da SikuliX per il riconoscimento visivo degli elementi nell'interfaccia del casinò.
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';

// Ottieni il percorso corrente usando il modulo ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Percorso alla cartella delle immagini di SikuliX
const IMAGES_FOLDER = path.resolve(__dirname, '../scripts/sikulix/images');

// Categorie di immagini per facilitare l'organizzazione
enum ImageCategory {
  LOGIN = 'login',
  NAVIGATION = 'navigation',
  GAME = 'game',
  CHIPS = 'chips',
  BETTING = 'betting',
  RESULTS = 'results'
}

// Metadati per le immagini
interface ImageMetadata {
  name: string;
  category: ImageCategory;
  description: string;
  targetElement: string;
  lastUpdated: Date;
  dimensions?: { width: number; height: number };
  matchThreshold?: number; // Soglia di corrispondenza (0.0-1.0)
}

class SikulixImageManager extends EventEmitter {
  private imageMetadata: Map<string, ImageMetadata> = new Map();
  
  constructor() {
    super();
    this.ensureImagesFolder();
    this.loadMetadata();
  }
  
  /**
   * Assicura che la cartella delle immagini esista
   */
  private ensureImagesFolder(): void {
    if (!fs.existsSync(IMAGES_FOLDER)) {
      fs.mkdirSync(IMAGES_FOLDER, { recursive: true });
    }
  }
  
  /**
   * Carica i metadati per tutte le immagini esistenti
   */
  private loadMetadata(): void {
    try {
      const metadataFile = path.join(IMAGES_FOLDER, 'metadata.json');
      
      if (fs.existsSync(metadataFile)) {
        const data = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
        
        if (Array.isArray(data)) {
          data.forEach(item => {
            this.imageMetadata.set(item.name, {
              ...item,
              lastUpdated: new Date(item.lastUpdated)
            });
          });
        }
      } else {
        // Se non esiste il file dei metadati, crea un file vuoto
        this.saveMetadata();
      }
    } catch (error) {
      console.error('Errore nel caricamento dei metadati delle immagini:', error);
    }
  }
  
  /**
   * Salva i metadati su disco
   */
  private saveMetadata(): void {
    try {
      const metadataFile = path.join(IMAGES_FOLDER, 'metadata.json');
      const data = Array.from(this.imageMetadata.values());
      
      fs.writeFileSync(metadataFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error('Errore nel salvataggio dei metadati delle immagini:', error);
    }
  }
  
  /**
   * Salva un'immagine nella cartella delle immagini di SikuliX
   */
  public saveImage(
    filename: string, 
    imageBuffer: Buffer,
    metadata: Omit<ImageMetadata, 'name' | 'lastUpdated'>
  ): boolean {
    try {
      const imagePath = path.join(IMAGES_FOLDER, filename);
      
      // Salva l'immagine su disco
      fs.writeFileSync(imagePath, imageBuffer);
      
      // Aggiorna i metadati
      this.imageMetadata.set(filename, {
        name: filename,
        ...metadata,
        lastUpdated: new Date()
      });
      
      // Salva i metadati aggiornati
      this.saveMetadata();
      
      this.emit('image-saved', { filename });
      return true;
    } catch (error) {
      console.error('Errore nel salvataggio dell\'immagine:', error);
      return false;
    }
  }
  
  /**
   * Ottiene il buffer di un'immagine dal disco
   */
  public getImage(filename: string): Buffer | null {
    try {
      const imagePath = path.join(IMAGES_FOLDER, filename);
      
      if (fs.existsSync(imagePath)) {
        return fs.readFileSync(imagePath);
      }
      
      return null;
    } catch (error) {
      console.error('Errore nel recupero dell\'immagine:', error);
      return null;
    }
  }
  
  /**
   * Ottiene i metadati di un'immagine
   */
  public getImageMetadata(filename: string): ImageMetadata | null {
    return this.imageMetadata.get(filename) || null;
  }
  
  /**
   * Ottiene i metadati di tutte le immagini
   */
  public getAllImageMetadata(): ImageMetadata[] {
    return Array.from(this.imageMetadata.values());
  }
  
  /**
   * Aggiorna i metadati di un'immagine
   */
  public updateImageMetadata(
    filename: string, 
    metadata: Partial<Omit<ImageMetadata, 'name' | 'lastUpdated'>>
  ): boolean {
    try {
      const existing = this.imageMetadata.get(filename);
      
      if (!existing) {
        return false;
      }
      
      this.imageMetadata.set(filename, {
        ...existing,
        ...metadata,
        lastUpdated: new Date()
      });
      
      this.saveMetadata();
      return true;
    } catch (error) {
      console.error('Errore nell\'aggiornamento dei metadati dell\'immagine:', error);
      return false;
    }
  }
  
  /**
   * Elimina un'immagine e i suoi metadati
   */
  public deleteImage(filename: string): boolean {
    try {
      const imagePath = path.join(IMAGES_FOLDER, filename);
      
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      
      this.imageMetadata.delete(filename);
      this.saveMetadata();
      
      this.emit('image-deleted', { filename });
      return true;
    } catch (error) {
      console.error('Errore nell\'eliminazione dell\'immagine:', error);
      return false;
    }
  }
  
  /**
   * Ottiene un elenco di tutte le immagini per categoria
   */
  public getImagesByCategory(category: ImageCategory): ImageMetadata[] {
    return Array.from(this.imageMetadata.values())
      .filter(metadata => metadata.category === category);
  }
  
  /**
   * Genera immagini di esempio per il testing
   */
  public generateSampleImages(): void {
    const sampleImages: { 
      filename: string; 
      category: ImageCategory;
      description: string;
      targetElement: string;
    }[] = [
      { 
        filename: 'planetwin_logo.png', 
        category: ImageCategory.NAVIGATION,
        description: 'Logo del sito PlanetWin365',
        targetElement: 'Logo del casinò nella navbar'
      },
      { 
        filename: 'login_button.png', 
        category: ImageCategory.LOGIN,
        description: 'Pulsante per accedere al form di login',
        targetElement: 'Pulsante Accedi nella navbar'
      },
      { 
        filename: 'username_field.png', 
        category: ImageCategory.LOGIN,
        description: 'Campo username nella form di login',
        targetElement: 'Campo di input per username'
      },
      { 
        filename: 'red_betting_area.png', 
        category: ImageCategory.BETTING,
        description: 'Area per scommettere sul rosso',
        targetElement: 'Pulsante ROSSO nel tavolo da roulette'
      },
      { 
        filename: 'black_betting_area.png', 
        category: ImageCategory.BETTING,
        description: 'Area per scommettere sul nero',
        targetElement: 'Pulsante NERO nel tavolo da roulette'
      },
      { 
        filename: 'first_dozen_area.png', 
        category: ImageCategory.BETTING,
        description: 'Area per scommettere sulla prima dozzina (1-12)',
        targetElement: 'Pulsante 1st 12 nel tavolo da roulette'
      },
      { 
        filename: 'second_dozen_area.png', 
        category: ImageCategory.BETTING,
        description: 'Area per scommettere sulla seconda dozzina (13-24)',
        targetElement: 'Pulsante 2nd 12 nel tavolo da roulette'
      },
      { 
        filename: 'third_dozen_area.png', 
        category: ImageCategory.BETTING,
        description: 'Area per scommettere sulla terza dozzina (25-36)',
        targetElement: 'Pulsante 3rd 12 nel tavolo da roulette'
      }
    ];
    
    // Crea un'immagine finta e i metadati per ogni esempio
    sampleImages.forEach(sample => {
      try {
        // Crea un buffer vuoto per simulare un'immagine
        const imageBuffer = Buffer.from('Sample Image Data');
        
        // Salva l'immagine con i metadati
        this.saveImage(sample.filename, imageBuffer, {
          category: sample.category,
          description: sample.description,
          targetElement: sample.targetElement,
          matchThreshold: 0.8
        });
        
        console.log(`Immagine di esempio creata: ${sample.filename}`);
      } catch (error) {
        console.error(`Errore nella creazione dell'immagine di esempio ${sample.filename}:`, error);
      }
    });
  }
}

// Esporta un'istanza singleton
export const sikulixImageManager = new SikulixImageManager();
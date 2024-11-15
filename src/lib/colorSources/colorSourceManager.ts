import { ColorSource, PantoneColorResult } from './types';
import { FirebaseSource } from './firebaseSource';
import { SpektranSource } from './spektranSource';
import { PantoneApiSource } from './pantoneApiSource';

export class ColorSourceManager {
  private sources: ColorSource[] = [];
  private availableSources: ColorSource[] = [];
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private cache: Map<string, PantoneColorResult> = new Map();

  constructor() {
    this.sources = [
      new FirebaseSource(),
      new PantoneApiSource(),
      new SpektranSource()
    ];
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      this.availableSources = [];
      
      const availabilityChecks = this.sources.map(async source => {
        try {
          const timeoutPromise = new Promise<boolean>((_, reject) => {
            const id = setTimeout(() => {
              clearTimeout(id);
              reject(new Error('Timeout'));
            }, 5000);
          });

          const isAvailable = await Promise.race([
            source.isAvailable(),
            timeoutPromise
          ]);
          
          if (isAvailable) {
            this.availableSources.push(source);
          }
        } catch (error) {
          console.error(`Error checking source ${source.name}:`, error);
        }
      });

      await Promise.all(availabilityChecks);
      this.initialized = true;
      this.initPromise = null;
    })();

    return this.initPromise;
  }

  async getHexByCode(code: string): Promise<PantoneColorResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const normalizedCode = code.trim().toUpperCase();
    const cachedResult = this.cache.get(normalizedCode);
    if (cachedResult) {
      return cachedResult;
    }

    const results = await Promise.all(
      this.availableSources.map(async source => {
        try {
          const timeoutPromise = new Promise<null>((resolve) => {
            const id = setTimeout(() => {
              clearTimeout(id);
              resolve(null);
            }, 5000);
          });

          const hex = await Promise.race([
            source.getHexByCode(normalizedCode),
            timeoutPromise
          ]);
          
          if (hex) {
            return { hex, source: source.name };
          }
          return null;
        } catch (error) {
          console.error(`Error with source ${source.name}:`, error);
          return null;
        }
      })
    );

    const firstResult = results.find(result => result !== null);
    if (firstResult) {
      this.cache.set(normalizedCode, firstResult);
      return firstResult;
    }

    const errorResult = {
      hex: null,
      source: 'none',
      error: `Color ${normalizedCode} not found in any available source`
    };

    this.cache.set(normalizedCode, errorResult);
    const timeoutId = setTimeout(() => {
      clearTimeout(timeoutId);
      this.cache.delete(normalizedCode);
    }, 5 * 60 * 1000);

    return errorResult;
  }

  getAvailableSources(): string[] {
    return this.availableSources.map(source => source.name);
  }

  clearCache(): void {
    this.cache.clear();
  }

  async reinitialize(): Promise<void> {
    this.initialized = false;
    this.initPromise = null;
    this.clearCache();
    await this.initialize();
  }
}

export const colorSourceManager = new ColorSourceManager();
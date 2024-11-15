import { ColorSource, PantoneColorResult } from './types';
import { FirebaseSource } from './firebaseSource';
import { SpektranSource } from './spektranSource';
import { PantoneApiSource } from './pantoneApiSource';

class ColorSourceManager {
  private sources: ColorSource[] = [];
  private availableSources: ColorSource[] = [];
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private cache: Map<string, PantoneColorResult> = new Map();

  constructor() {
    // Приоритет источников: сначала локальная база, потом внешние API
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
      
      // Проверяем все источники параллельно
      const availabilityChecks = this.sources.map(async source => {
        try {
          const isAvailable = await Promise.race([
            source.isAvailable(),
            new Promise<boolean>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 5000)
            )
          ]);
          
          if (isAvailable) {
            this.availableSources.push(source);
            console.log(`Color source available: ${source.name}`);
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

    // Нормализуем код
    const normalizedCode = code.trim().toUpperCase();

    // Проверяем кэш
    const cachedResult = this.cache.get(normalizedCode);
    if (cachedResult) {
      return cachedResult;
    }

    // Проверяем все источники параллельно с таймаутом
    const results = await Promise.all(
      this.availableSources.map(async source => {
        try {
          const hex = await Promise.race([
            source.getHexByCode(normalizedCode),
            new Promise<null>((resolve) => 
              setTimeout(() => resolve(null), 5000)
            )
          ]);
          
          if (hex) {
            console.log(`Found color ${normalizedCode} in ${source.name}: ${hex}`);
            return { hex, source: source.name };
          }
          return null;
        } catch (error) {
          console.error(`Error with source ${source.name}:`, error);
          return null;
        }
      })
    );

    // Берем первый успешный результат
    const firstResult = results.find(result => result !== null);
    if (firstResult) {
      // Сохраняем в кэш
      this.cache.set(normalizedCode, firstResult);
      return firstResult;
    }

    const errorResult = {
      hex: null,
      source: 'none',
      error: `Color ${normalizedCode} not found in any available source`
    };

    // Сохраняем отрицательный результат в кэш на короткое время
    this.cache.set(normalizedCode, errorResult);
    setTimeout(() => this.cache.delete(normalizedCode), 5 * 60 * 1000); // Удаляем через 5 минут

    return errorResult;
  }

  getAvailableSources(): string[] {
    return this.availableSources.map(source => source.name);
  }

  // Метод для очистки кэша
  clearCache(): void {
    this.cache.clear();
  }

  // Метод для принудительной переинициализации источников
  async reinitialize(): Promise<void> {
    this.initialized = false;
    this.initPromise = null;
    this.clearCache();
    await this.initialize();
  }
}

// Create and export a singleton instance
export const colorSourceManager = new ColorSourceManager();
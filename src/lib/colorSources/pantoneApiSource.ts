import { ColorSource } from './types';
import { normalizeHexColor } from '../../utils/colorUtils';

export class PantoneApiSource implements ColorSource {
  name = 'Pantone API';
  private apiKey = import.meta.env.VITE_PANTONE_API_KEY;
  private baseUrl = 'https://api.pantone.com/v1';

  async getHexByCode(code: string): Promise<string | null> {
    if (!this.apiKey) return null;

    try {
      // Нормализуем код (убираем пробелы и приводим к верхнему регистру)
      const normalizedCode = code.trim().toUpperCase();
      
      // Пробуем несколько эндпоинтов API
      const endpoints = [
        `/colors/${normalizedCode}`,
        `/colors/search?q=${encodeURIComponent(normalizedCode)}`,
        `/colors/closest?code=${encodeURIComponent(normalizedCode)}`
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) continue;
        
        const data = await response.json();
        
        // Обрабатываем разные форматы ответа
        const hex = data.hex || data.colors?.[0]?.hex || null;
        if (hex) return normalizeHexColor(hex);
      }

      return null;
    } catch (error) {
      console.error('Pantone API source error:', error);
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
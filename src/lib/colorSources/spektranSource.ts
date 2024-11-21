import { ColorSource } from './types';
import { normalizeHexColor } from '../../utils/colorUtils';

export class SpektranSource implements ColorSource {
  name = 'Spektran';

  async getHexByCode(code: string): Promise<string | null> {
    try {
      const response = await fetch(`https://cors-anywhere.herokuapp.com/https://spektran.com/search?q=${encodeURIComponent(code)}`);
      if (!response.ok) return null;
      
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Ищем элемент с цветом по нескольким селекторам
      const colorElement = 
        doc.querySelector('.color-hex') || 
        doc.querySelector('[data-color-hex]') ||
        doc.querySelector('.pantone-color-value');
        
      if (!colorElement) return null;
      
      const hex = colorElement.textContent?.trim() || 
                 colorElement.getAttribute('data-color-hex') || 
                 null;
                 
      return hex ? normalizeHexColor(hex) : null;
    } catch (error) {
      console.error('Spektran source error:', error);
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('https://cors-anywhere.herokuapp.com/https://spektran.com');
      return response.ok;
    } catch {
      return false;
    }
  }
}
import { normalizeHexColor } from './colorUtils';

export async function getPantoneHexFromSpektran(pantoneCode: string): Promise<string | null> {
  try {
    const response = await fetch(`https://spektran.com/search?q=${encodeURIComponent(pantoneCode)}`);
    const html = await response.text();
    
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Find the color element (this selector needs to be adjusted based on the actual website structure)
    const colorElement = doc.querySelector('.color-hex');
    if (!colorElement) return null;
    
    const hex = colorElement.textContent?.trim();
    return hex ? normalizeHexColor(hex) : null;
  } catch (error) {
    console.error('Error fetching Pantone color:', error);
    return null;
  }
}
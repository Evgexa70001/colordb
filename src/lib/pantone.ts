import { normalizeHexColor } from '../utils/colorUtils';

export async function getPantoneHexByCode(code: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.example.com/pantone/${encodeURIComponent(code)}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.hex ? normalizeHexColor(data.hex) : null;
  } catch (error) {
    console.error('Error fetching Pantone color:', error);
    return null;
  }
}
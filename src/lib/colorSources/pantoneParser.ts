import axios from 'axios';
import * as cheerio from 'cheerio';

interface PantoneColor {
  code: string;
  hex: string;
}

async function parsePantoneColors(): Promise<PantoneColor[]> {
  try {
    // Получаем HTML страницы
    const response = await axios.get('https://www.pantone-colours.com/');
    const html = response.data;
    const $ = cheerio.load(html);
    
    const colors: PantoneColor[] = [];

    // Ищем все элементы с цветами Pantone
    // Нужно будет адаптировать селекторы после анализа структуры страницы
    $('div[style*="background-color"]').each((_, element) => {
      const $element = $(element);
      const code = $element.text().trim();
      const style = $element.attr('style') || '';
      const hexMatch = style.match(/background-color:\s*(#[A-Fa-f0-9]{6})/);
      
      if (code && hexMatch) {
        colors.push({
          code: code.replace('Pantone ', ''),
          hex: hexMatch[1]
        });
      }
    });

    return colors;

  } catch (error) {
    console.error('Ошибка при парсинге Pantone цветов:', error);
    return [];
  }
}

// Функция для поиска конкретного цвета по коду
async function getPantoneHex(code: string): Promise<string | null> {
  try {
    const colors = await parsePantoneColors();
    const color = colors.find(c => c.code === code);
    return color ? color.hex : null;
  } catch (error) {
    console.error('Ошибка при поиске цвета:', error);
    return null;
  }
}

export { parsePantoneColors, getPantoneHex };
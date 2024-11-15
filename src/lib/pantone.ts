import { collection, getDocs, query, where, addDoc, DocumentData } from 'firebase/firestore';
import { db } from './firebase';

interface PantoneReference {
  code: string;
  hex: string;
  name?: string;
}

export async function getPantoneHexByCode(code: string): Promise<string | null> {
  try {
    // Нормализуем код (убираем пробелы и приводим к верхнему регистру)
    const normalizedCode = code.trim().toUpperCase();
    
    const pantoneRef = collection(db, 'pantoneColors');
    const q = query(pantoneRef, where('code', '==', normalizedCode));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('Color not found:', normalizedCode);
      return null;
    }

    const color = snapshot.docs[0].data();
    console.log('Found color:', normalizedCode, color.hex, color.name);
    return color.hex;
  } catch (error) {
    console.error('Error fetching Pantone color:', error);
    return null;
  }
}

// Функция для добавления тестовых данных
export async function addTestPantoneColors(): Promise<void> {
  const testColors = [
    { code: 'P100', name: 'Pantone Yellow', hex: '#FEDF00' },
    { code: 'P151', name: 'Pantone Orange 021', hex: '#FE5000' },
    { code: 'P185', name: 'Pantone Red', hex: '#E4002B' },
    { code: 'P285', name: 'Pantone Process Blue', hex: '#0077C8' },
    { code: 'P354', name: 'Pantone Green', hex: '#00B140' }
  ];

  const pantoneRef = collection(db, 'pantoneColors');

  for (const color of testColors) {
    try {
      // Проверяем, существует ли уже такой цвет
      const q = query(pantoneRef, where('code', '==', color.code));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await addDoc(pantoneRef, {
          ...color,
          createdAt: new Date().toISOString()
        });
        console.log('Added color:', color.code);
      }
    } catch (error) {
      console.error('Error adding color:', color.code, error);
    }
  }
}
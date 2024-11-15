import { collection, writeBatch, getDocs, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { PantoneColor } from '../types';

export async function importPantoneColors(): Promise<boolean> {
  try {
    const batch = writeBatch(db);
    const colorsRef = collection(db, 'colors');

    // Получаем существующие цвета для проверки дубликатов
    const snapshot = await getDocs(colorsRef);
    const existingColors = new Set(snapshot.docs.map(doc => doc.data().name));

    // Массив цветов Pantone для импорта
    const pantoneColors: Omit<PantoneColor, 'id'>[] = [
      {
        name: 'PANTONE 100 C',
        hex: '#F4ED7C',
        category: 'Pantone Coated',
        inStock: true
      },
      // Добавьте больше цветов по необходимости
    ];

    let addedCount = 0;

    for (const color of pantoneColors) {
      if (!existingColors.has(color.name)) {
        const docRef = doc(colorsRef);
        batch.set(docRef, {
          ...color,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        addedCount++;
      }
    }

    if (addedCount > 0) {
      await batch.commit();
    }

    return true;
  } catch (error) {
    console.error('Error importing Pantone colors:', error);
    return false;
  }
}
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  DocumentReference,
  FirestoreError,
  writeBatch,
  enableNetwork,
  disableNetwork,
} from 'firebase/firestore';
import { db } from './firebase';
import type { PantoneColor } from '../types';
import toast from 'react-hot-toast';

let isOffline = false;

export async function setOfflineMode(offline: boolean) {
  if (offline === isOffline) return;
  isOffline = offline;
  try {
    if (offline) {
      await disableNetwork(db);
    } else {
      await enableNetwork(db);
    }
  } catch (error) {
    console.error('Error setting offline mode:', error);
  }
}

export async function getColors(): Promise<PantoneColor[]> {
  try {
    const colorsRef = collection(db, 'colors');
    const snapshot = await getDocs(colorsRef);
    return snapshot.docs
      .map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as PantoneColor),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    const firestoreError = error as FirestoreError;
    if (firestoreError.code === 'failed-precondition' || firestoreError.code === 'unavailable') {
      toast.error(
        'Работаем в офлайн режиме. Изменения будут синхронизированы при восстановлении соединения.',
      );
      return [];
    }
    throw new Error(`Failed to fetch colors: ${firestoreError.message}`);
  }
}

export async function saveColor(color: Omit<PantoneColor, 'id'>): Promise<DocumentReference> {
  try {
    const colorsRef = collection(db, 'colors');
    const docRef = await addDoc(colorsRef, {
      name: color.name,
      hex: color.hex,
      recipe: color.recipe || '',
      customers: color.customers || [],
      inStock: color.inStock ?? true,
      category: color.category || 'Uncategorized',
      notes: color.notes || '',
      manager: color.manager || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef;
  } catch (error) {
    const firestoreError = error as FirestoreError;
    if (firestoreError.code === 'failed-precondition' || firestoreError.code === 'unavailable') {
      toast.error('Изменения будут сохранены после восстановления соединения');
      throw new Error('offline');
    }
    throw error;
  }
}

export async function updateColor(color: PantoneColor): Promise<void> {
  try {
    const colorRef = doc(db, 'colors', color.id);
    const updateData = {
      name: color.name,
      hex: color.hex,
      recipe: color.recipe || '',
      customers: color.customers || [],
      category: color.category || 'Uncategorized',
      inStock: color.inStock,
      notes: color.notes || '',
      manager: color.manager || '',
      updatedAt: serverTimestamp(),
    };
    await updateDoc(colorRef, updateData);
  } catch (error) {
    const firestoreError = error as FirestoreError;
    if (firestoreError.code === 'failed-precondition' || firestoreError.code === 'unavailable') {
      toast.error('Изменения будут сохранены после восстановления соединения');
      throw new Error('offline');
    }
    throw error;
  }
}

export async function deleteColor(colorId: string): Promise<void> {
  try {
    const colorRef = doc(db, 'colors', colorId);
    await deleteDoc(colorRef);
  } catch (error) {
    const firestoreError = error as FirestoreError;
    if (firestoreError.code === 'failed-precondition' || firestoreError.code === 'unavailable') {
      toast.error('Удаление будет выполнено после восстановления соединения');
      throw new Error('offline');
    }
    throw error;
  }
}

export async function deleteColorsWithoutRecipes(): Promise<number> {
  try {
    const colorsRef = collection(db, 'colors');
    const snapshot = await getDocs(colorsRef);
    const batch = writeBatch(db);
    let deletedCount = 0;

    snapshot.docs.forEach((doc) => {
      const color = doc.data();
      if (!color.recipe || color.recipe.trim() === '') {
        batch.delete(doc.ref);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      await batch.commit();
    }

    return deletedCount;
  } catch (error) {
    const firestoreError = error as FirestoreError;
    if (firestoreError.code === 'failed-precondition' || firestoreError.code === 'unavailable') {
      toast.error('Операция будет выполнена после восстановления соединения');
      throw new Error('offline');
    }
    throw error;
  }
}

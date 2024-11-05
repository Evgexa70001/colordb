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
} from 'firebase/firestore';
import { db } from './firebase';
import type { PantoneColor } from '../types';

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
    throw new Error(`Failed to fetch colors: ${firestoreError.message}`);
  }
}

export async function saveColor(color: Omit<PantoneColor, 'id'>): Promise<DocumentReference> {
  try {
    const colorsRef = collection(db, 'colors');
    const docRef = await addDoc(colorsRef, {
      ...color,
      recipe: color.recipe || '',
      customers: color.customers || [],
      inStock: color.inStock ?? true,
      category: color.category || 'Uncategorized',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef;
  } catch (error) {
    const firestoreError = error as FirestoreError;
    throw new Error(`Failed to save color: ${firestoreError.message}`);
  }
}

export async function updateColor(color: PantoneColor): Promise<void> {
  try {
    const colorRef = doc(db, 'colors', color.id);
    await updateDoc(colorRef, {
      ...color,
      recipe: color.recipe || '',
      customers: color.customers || [],
      category: color.category || 'Uncategorized',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    const firestoreError = error as FirestoreError;
    throw new Error(`Failed to update color: ${firestoreError.message}`);
  }
}

export async function deleteColor(colorId: string): Promise<void> {
  try {
    const colorRef = doc(db, 'colors', colorId);
    await deleteDoc(colorRef);
  } catch (error) {
    const firestoreError = error as FirestoreError;
    throw new Error(`Failed to delete color: ${firestoreError.message}`);
  }
}

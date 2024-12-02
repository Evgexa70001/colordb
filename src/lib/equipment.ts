import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import type { Equipment } from '../types';

const COLLECTION_NAME = 'equipment';

export const saveEquipment = async (equipment: Omit<Equipment, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...equipment,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving equipment:', error);
    throw error;
  }
};

export const getEquipment = async (): Promise<Equipment[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Equipment[];
  } catch (error) {
    console.error('Error getting equipment:', error);
    throw error;
  }
};

export const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating equipment:', error);
    throw error;
  }
};

export const deleteEquipment = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting equipment:', error);
    throw error;
  }
};

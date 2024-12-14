import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { PantoneColor } from '../types';

export const getCustomers = async (): Promise<string[]> => {
  const colorsRef = collection(db, 'colors');
  const snapshot = await getDocs(colorsRef);
  const customers = new Set<string>();

  snapshot.forEach((doc) => {
    const color = doc.data() as PantoneColor;
    color.customers?.forEach((customer) => customers.add(customer));
  });

  return Array.from(customers).sort();
};

import { ColorSource } from './types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { normalizeHexColor } from '../../utils/colorUtils';

export class FirebaseSource implements ColorSource {
  name = 'Firebase';

  async getHexByCode(code: string): Promise<string | null> {
    try {
      const normalizedCode = code.trim().toUpperCase();
      const pantoneRef = collection(db, 'pantoneColors');
      const q = query(pantoneRef, where('code', '==', normalizedCode));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      const color = snapshot.docs[0].data();
      return normalizeHexColor(color.hex);
    } catch (error) {
      console.error('Firebase source error:', error);
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const pantoneRef = collection(db, 'pantoneColors');
      const q = query(pantoneRef, where('code', '==', 'P100'));
      await getDocs(q);
      return true;
    } catch {
      return false;
    }
  }
}
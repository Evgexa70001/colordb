import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  deleteDoc,
  doc,
  serverTimestamp,
  FirestoreError,
} from 'firebase/firestore';
import { db } from './firebase';
import { updateColor, getColors } from './colors';

export const UNCATEGORIZEDS = 'Без группы';

export async function getGroups(): Promise<string[]> {
  try {
    const groupsRef = collection(db, 'groups');
    const snapshot = await getDocs(groupsRef);
    const groups = snapshot.docs
      .map((doc) => ({ id: doc.id, name: doc.data().name as string }))
      .filter((gr) => gr.name && gr.name !== UNCATEGORIZEDS)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((gr) => gr.name);

    return groups;
  } catch (error) {
    const firestoreError = error as FirestoreError;
    throw new Error(`Failed to fetch groups: ${firestoreError.message}`);
  }
}

export async function getGroupsByName(name: string) {
  try {
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where('name', '==', name));
    const snapshot = await getDocs(q);
    return snapshot.docs[0]?.id;
  } catch (error) {
    const firestoreError = error as FirestoreError;
    throw new Error(`Failed to fetch groups: ${firestoreError.message}`);
  }
}

export async function addGroup(name: string): Promise<void> {
  if (!name.trim()) {
    throw new Error('Groups name cannot be empty');
  }

  try {
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where('name', '==', name.trim()));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      throw new Error('Groups already exists');
    }

    await addDoc(groupsRef, {
      name: name.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    const firestoreError = error as FirestoreError;
    throw new Error(`Failed to add category: ${firestoreError.message}`);
  }
}

export async function deleteGroup(groupName: string): Promise<void> {
  try {
    const groupId = await getGroupsByName(groupName);
    if (!groupId) {
      throw new Error('Groups not found');
    }

    const colors = await getColors();
    const affectedColors = colors.filter((color) => color.group === groupName);

    await Promise.all(
      affectedColors.map((color) =>
        updateColor({
          ...color,
          group: UNCATEGORIZEDS,
        }),
      ),
    );

    const groupRef = doc(db, 'groups', groupId);
    await deleteDoc(groupRef);
  } catch (error) {
    const firestoreError = error as FirestoreError;
    throw new Error(`Failed to delete category: ${firestoreError.message}`);
  }
}

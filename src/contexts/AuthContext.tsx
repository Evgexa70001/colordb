import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

async function getUserData(firebaseUser: FirebaseUser): Promise<User> {
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  const userData = userDoc.data();
  
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    isAdmin: userData?.isAdmin || false
  };
}

async function createUserDocument(firebaseUser: FirebaseUser): Promise<void> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  await setDoc(userRef, {
    email: firebaseUser.email,
    isAdmin: false, // By default, new users are not admins
    createdAt: new Date().toISOString()
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUserData(firebaseUser);
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const userData = await getUserData(result.user);
    setUser(userData);
  };

  const signUp = async (email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await createUserDocument(result.user);
    const userData = await getUserData(result.user);
    setUser(userData);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

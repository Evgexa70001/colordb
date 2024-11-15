import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, CACHE_SIZE_UNLIMITED, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCiJ0J2cy6sNVEyS68ktDzk4Mi9WSnQUyU",
  authDomain: "color-1836e.firebaseapp.com",
  databaseURL: "https://color-1836e-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "color-1836e",
  storageBucket: "color-1836e.appspot.com",
  messagingSenderId: "1072738220251",
  appId: "1:1072738220251:web:75b90b1f46049f524e34fe",
  measurementId: "G-37M539W8DK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with settings for better offline support
export const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

export const storage = getStorage(app);

// Enable offline persistence
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support offline persistence');
  }
});
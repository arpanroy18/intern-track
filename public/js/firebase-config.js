// Firebase Configuration
// Replace these values with your Firebase project configuration
// Get these from Firebase Console > Project Settings > General > Your apps > Web app

const firebaseConfig = {
    apiKey: "REMOVED_FIREBASE_API_KEY",
    authDomain: "REMOVED_FIREBASE_DOMAIN",
    projectId: "REMOVED_PROJECT_ID",
    storageBucket: "REMOVED_PROJECT_ID.REMOVED_STORAGE_BUCKET",
    messagingSenderId: "REMOVED_SENDER_ID",
    appId: "1:REMOVED_SENDER_ID:web:0dc82c61d4d796fba8e8db",
    measurementId: "REMOVED_MEASUREMENT_ID"
  };

// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app; 
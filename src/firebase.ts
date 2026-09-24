import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

export const COLLECTIONS = {
  users: "users",
  recipes: "recipes",
  reviews: "reviews",
  ingredientUsage: "ingredient_usage",
} as const;

function readFirebaseConfig() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim();
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = import.meta.env.VITE_FIREBASE_APP_ID?.trim();

  if (!apiKey || !projectId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain: authDomain || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: storageBucket || `${projectId}.firebasestorage.app`,
    messagingSenderId,
    appId,
  };
}

export function isFirebaseConfigured() {
  return Boolean(readFirebaseConfig());
}

export function getFirebaseApp(): FirebaseApp {
  const config = readFirebaseConfig();
  if (!config) {
    throw new Error("Missing Firebase configuration");
  }

  return getApps()[0] ?? initializeApp(config);
}

export function getDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

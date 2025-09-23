import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  type Firestore,
} from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { requireUser } from "./requireUser";

const firebaseConfig = {
  apiKey: "AIzaSyD5sFh4IgUPuhsaG-W7mhDh2zUWP2zu9j8",
  authDomain: "j9-website-44747.firebaseapp.com",
  projectId: "j9-website-44747",
  storageBucket: "j9-website-44747.firebasestorage.app",
  messagingSenderId: "221968728428",
  appId: "1:221968728428:web:ef1f8ad0288325e54af349",
  measurementId: "G-1W3BKE5502",
};

let cachedApp: FirebaseApp | undefined;
let cachedDb: Firestore | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (cachedApp) return cachedApp;
  const apps = getApps();
  cachedApp = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
  return cachedApp;
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getFirebaseDb(): Firestore {
  if (cachedDb) return cachedDb;
  const app = getFirebaseApp();
  try {
    // Prefer long polling to avoid WebChannel terminate 400 noise behind certain proxies
    cachedDb = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true as unknown as boolean,
      useFetchStreams: false as unknown as boolean,
    } as any);
  } catch (_e) {
    cachedDb = getFirestore(app);
  }
  return cachedDb;
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp());
}

export function initAnalytics(): Analytics | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return getAnalytics(getFirebaseApp());
  } catch (err) {
    return undefined;
  }
}

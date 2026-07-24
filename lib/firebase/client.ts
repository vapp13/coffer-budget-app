import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Avoid re-initializing on hot reload / multiple imports.
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

/**
 * Offline data availability is handled by Firestore's own official
 * persistent local cache (IndexedDB), not by generically caching Firestore's
 * network responses in the service worker — the SDK already scopes this
 * cache securely to the current auth state, so there's no risk of one
 * account's cached data leaking into another's session the way a naive
 * HTTP-level cache could. This is what lets previously-loaded screens keep
 * showing real data while offline.
 *
 * `persistentLocalCache` needs IndexedDB, which doesn't exist during the
 * build's static-generation pass (Node, not a browser) — fall back to the
 * plain in-memory client there. `initializeFirestore` also throws if called
 * twice for the same app (e.g. on a dev hot-reload), so fall back to
 * `getFirestore` in that case too.
 */
function createFirestoreClient() {
  if (typeof window === "undefined") {
    return getFirestore(firebaseApp);
  }
  try {
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    return getFirestore(firebaseApp);
  }
}

export const db = createFirestoreClient();

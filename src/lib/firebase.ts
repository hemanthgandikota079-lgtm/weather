import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  type Firestore,
} from 'firebase/firestore';

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
};

function hasFirebaseConfig(config: typeof firebaseConfig) {
  // Require the minimal set for client SDK to initialize. messagingSenderId is optional for some setups.
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
}

let app: ReturnType<typeof initializeApp> | null = null;
export let auth: Auth | null = null;
export let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (hasFirebaseConfig(firebaseConfig)) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
} else {
  // Clear, actionable warning for developers when env is missing.
  // Refer to README or .env.example for the required VITE_FIREBASE_* variables.
  console.warn(
    'Firebase is not configured. Add the VITE_FIREBASE_* values to your environment (see .env.example or README) to enable authentication and Firestore features.'
  );
}

export const isFirebaseConfigured = Boolean(app && auth && db && googleProvider);

export function getFirebaseAuth() {
  if (!auth) {
    throw new Error(
      'Firebase authentication is not configured. Ensure the VITE_FIREBASE_API_KEY and VITE_FIREBASE_AUTH_DOMAIN environment variables are set. See .env.example in the repository.'
    );
  }
  return auth;
}

export function getFirebaseDb() {
  if (!db) {
    throw new Error(
      'Firebase Firestore is not configured. Ensure the VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_APP_ID environment variables are set. See .env.example in the repository.'
    );
  }
  return db;
}

export function getGoogleProvider() {
  if (!googleProvider) {
    throw new Error(
      'Firebase Google provider is not configured. Ensure the VITE_FIREBASE_* environment variables are set. See .env.example in the repository.'
    );
  }
  return googleProvider;
}

export async function signUpWithEmail(email: string, password: string, name: string) {
  const authInstance = getFirebaseAuth();
  const dbInstance = getFirebaseDb();
  const credential = await createUserWithEmailAndPassword(authInstance, email, password);
  await addDoc(collection(dbInstance, 'users'), {
    uid: credential.user.uid,
    name,
    email: credential.user.email,
    createdAt: new Date().toISOString(),
  });
  return credential.user;
}

export async function signInWithEmailPassword(email: string, password: string) {
  const authInstance = getFirebaseAuth();
  const credential = await signInWithEmailAndPassword(authInstance, email, password);
  return credential.user;
}

export async function signInWithGoogle() {
  // Defensive: fail fast with a helpful message if Firebase isn't configured.
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Google sign-in requires the VITE_FIREBASE_* environment variables (see .env.example).' 
    );
  }

  const authInstance = getFirebaseAuth();
  const dbInstance = getFirebaseDb();
  const provider = getGoogleProvider();
  const credential = await signInWithPopup(authInstance, provider);
  const user = credential.user;

  try {
    const usersRef = collection(dbInstance, 'users');
    const existing = await getDocs(query(usersRef, where('uid', '==', user.uid), limit(1)));
    if (existing.empty) {
      await addDoc(usersRef, {
        uid: user.uid,
        name: user.displayName || 'Weather User',
        email: user.email,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    // If Firestore write fails for any reason, log a warning but still return the authenticated user.
    console.warn('Failed to persist Google user profile to Firestore:', (err as Error).message || err);
  }

  return user;
}

export async function logOut() {
  const authInstance = getFirebaseAuth();
  await signOut(authInstance);
}

export function observeAuth(callback: (user: User | null) => void) {
  // If auth is not configured, return a no-op unsubscribe and warn rather than throwing.
  if (!isFirebaseConfigured) {
    console.warn('observeAuth called but Firebase is not configured. Callback will not be invoked.');
    return () => undefined;
  }

  const authInstance = getFirebaseAuth();
  return onAuthStateChanged(authInstance, callback);
}

export async function saveUserHistory(uid: string, location: string) {
  const dbInstance = getFirebaseDb();
  await addDoc(collection(dbInstance, 'history'), {
    uid,
    location,
    createdAt: new Date().toISOString(),
  });
}

export async function fetchUserHistory(uid: string) {
  const dbInstance = getFirebaseDb();
  const q = query(collection(dbInstance, 'history'), where('uid', '==', uid), orderBy('createdAt', 'desc'), limit(8));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as { location: string }) }));
}

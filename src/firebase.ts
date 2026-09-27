import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import config from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use the specific firestoreDatabaseId if configured, or default
let db: ReturnType<typeof getFirestore>;
try {
  if (config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)') {
    db = initializeFirestore(app, {}, config.firestoreDatabaseId);
  } else {
    db = getFirestore(app);
  }
} catch {
  db = getFirestore(app);
}

const auth = getAuth(app);

export { app, db, auth };

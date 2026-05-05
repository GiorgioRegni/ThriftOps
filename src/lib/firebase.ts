import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectStorageEmulator, getStorage } from "firebase/storage";

export const useFirebaseEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";

const requiredFirebaseEnv = [
  { key: "VITE_FIREBASE_API_KEY", value: import.meta.env.VITE_FIREBASE_API_KEY },
  { key: "VITE_FIREBASE_AUTH_DOMAIN", value: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN },
  { key: "VITE_FIREBASE_PROJECT_ID", value: import.meta.env.VITE_FIREBASE_PROJECT_ID },
  { key: "VITE_FIREBASE_STORAGE_BUCKET", value: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET },
  { key: "VITE_FIREBASE_MESSAGING_SENDER_ID", value: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID },
  { key: "VITE_FIREBASE_APP_ID", value: import.meta.env.VITE_FIREBASE_APP_ID }
] as const;

export const missingFirebaseEnv = requiredFirebaseEnv.filter(({ value }) => !value).map(({ key }) => key);
export const isFirebaseConfigured = missingFirebaseEnv.length === 0;

const demoProjectId = "demo-thriftops";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${demoProjectId}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || demoProjectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${demoProjectId}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo-app-id",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

let emulatorsConnected = false;

if (import.meta.env.DEV && useFirebaseEmulators && !emulatorsConnected) {
  const authHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1";
  const authPort = Number(import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT || 17099);
  const storageHost = import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST || "127.0.0.1";
  const storagePort = Number(import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_PORT || 17199);

  connectAuthEmulator(auth, `http://${authHost}:${authPort}`, { disableWarnings: true });
  connectStorageEmulator(storage, storageHost, storagePort);
  emulatorsConnected = true;
}

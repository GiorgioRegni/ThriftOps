import { initializeApp, cert, getApps, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const credential = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
  : applicationDefault();

if (!getApps().length) {
  initializeApp({
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT
  });
}

export const adminAuth = getAuth();
export const adminFirestore = getFirestore();

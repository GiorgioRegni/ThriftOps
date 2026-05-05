import { readFileSync } from "node:fs";
import { applicationDefault, cert, initializeApp, getApps, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;

const serviceAccount = serviceAccountJson
  ? JSON.parse(serviceAccountJson) as ServiceAccount
  : serviceAccountPath
    ? JSON.parse(readFileSync(serviceAccountPath, "utf8")) as ServiceAccount
    : undefined;

const serviceAccountProjectId = serviceAccount
  ? (serviceAccount as ServiceAccount & { project_id?: string }).projectId || (serviceAccount as ServiceAccount & { project_id?: string }).project_id
  : undefined;

if (!getApps().length) {
  initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    projectId: projectId || serviceAccountProjectId
  });
}

export const adminAuth = getAuth();
export const adminFirestore = getFirestore();

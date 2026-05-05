import { adminFirestore } from "./firebaseAdmin.js";

export const mirrorOrgOwner = async (input: { orgId: string; uid: string; email: string; displayName: string; orgName: string }) => {
  const now = new Date();
  const batch = adminFirestore.batch();
  batch.set(adminFirestore.doc(`orgs/${input.orgId}`), {
    id: input.orgId,
    name: input.orgName,
    ownerUid: input.uid,
    mirroredFrom: "supabase-prisma",
    updatedAt: now,
    createdAt: now
  });
  batch.set(adminFirestore.doc(`orgs/${input.orgId}/members/${input.uid}`), {
    uid: input.uid,
    email: input.email,
    displayName: input.displayName,
    role: "owner",
    mirroredFrom: "supabase-prisma",
    updatedAt: now,
    createdAt: now
  });
  await batch.commit();
};

export const mirrorOrgUpdate = async (orgId: string, patch: Record<string, unknown>) => {
  await adminFirestore.doc(`orgs/${orgId}`).set({ ...patch, updatedAt: new Date() }, { merge: true });
};

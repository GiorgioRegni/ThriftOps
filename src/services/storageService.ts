import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../lib/firebase";
import type { ItemPhoto, PhotoKind } from "../types/domain";

export const uploadOrgImage = async (orgId: string, path: string, file: File, kind: PhotoKind = "other"): Promise<ItemPhoto> => {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `orgs/${orgId}/${path}/${crypto.randomUUID()}-${safeName}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);
  return {
    id: crypto.randomUUID(),
    url,
    storagePath,
    kind,
    createdAt: new Date().toISOString()
  };
};

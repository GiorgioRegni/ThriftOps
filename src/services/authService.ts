import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, type UserCredential } from "firebase/auth";
import { auth } from "../lib/firebase";

export const signUpWithEmail = async (email: string, password: string, displayName: string): Promise<UserCredential> => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(credential.user, { displayName });
  return credential;
};

export const signInWithEmail = (email: string, password: string): Promise<UserCredential> => signInWithEmailAndPassword(auth, email, password);
export const logout = (): Promise<void> => signOut(auth);

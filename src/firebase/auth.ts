import { auth } from './config';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

export const signInWithEmail = async (email: string, password: string) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const signOutUser = async () => {
  await signOut(auth);
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

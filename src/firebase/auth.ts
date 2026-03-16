import {
  connectAuthEmulator,
  deleteUser,
  getAuth,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

import { app, useEmulators } from './config';

export const auth = getAuth(app);

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
    disableWarnings: true,
  });

  // Expose sign-in helper for E2E tests
  (window as unknown as Record<string, unknown>).__testSignIn = (
    email: string,
    password: string,
  ) => signInWithEmailAndPassword(auth, email, password);
}

interface ErrorHandlerProps {
  onError: (error: string | null) => void;
}

export const signInWithGoogle = async ({ onError }: ErrorHandlerProps) => {
  const provider = new GoogleAuthProvider();

  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    if (error instanceof Error) {
      onError(error.message);
    } else {
      onError('Unexpected error occurred');
    }
  }
};

export const logoutUser = async () => {
  await signOut(auth);
  localStorage.clear();
};

/**
 * Re-authenticate the current user via Google popup.
 * Call before sensitive operations (e.g., account deletion).
 * Throws if user cancels or re-auth fails.
 */
export const reauthenticate = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }
  const provider = new GoogleAuthProvider();
  await reauthenticateWithPopup(user, provider);
};

export const deleteAccount = async (): Promise<void> => {
  const user = auth.currentUser;
  if (user) {
    await deleteUser(user);
  }
};

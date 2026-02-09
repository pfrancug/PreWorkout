import {
  deleteUser,
  getAuth,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

import { app } from './config';

export const auth = getAuth(app);

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

export const deleteAccount = async (): Promise<void> => {
  const user = auth.currentUser;
  if (user) {
    const provider = new GoogleAuthProvider();
    await reauthenticateWithPopup(user, provider);
    await deleteUser(user);
  }
};

import type { Dispatch, SetStateAction } from 'react';

import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

import { app } from './config';

export const auth = getAuth(app);

interface ErrorHandlerProps {
  onError: Dispatch<SetStateAction<string | null>>;
}

interface AuthCredentials extends ErrorHandlerProps {
  email: string;
  password: string;
}

interface HandleErrorProps extends ErrorHandlerProps {
  error: unknown;
}

const handleError = ({ error, onError }: HandleErrorProps) => {
  if (error instanceof FirebaseError) {
    onError(error.message);
  } else {
    onError('Unexpected error occurred');
  }
};

export const registerUser = async ({
  email,
  password,
  onError,
}: AuthCredentials) => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    handleError({ error, onError });
  }
};

export const loginUser = async ({
  email,
  password,
  onError,
}: AuthCredentials) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    handleError({ error, onError });
  }
};

export const signInWithGoogle = async ({ onError }: ErrorHandlerProps) => {
  const provider = new GoogleAuthProvider();

  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    handleError({ error, onError });
  }
};

export const logoutUser = async () => {
  await signOut(auth);
};

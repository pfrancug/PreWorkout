import type { Dispatch, SetStateAction } from 'react';

import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
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
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    console.log('User registered:', user.email);
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
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    console.log('User logged in:', user.email);
  } catch (error) {
    handleError({ error, onError });
  }
};

export const signInWithGoogle = async ({ onError }: ErrorHandlerProps) => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log('Signed in with Google:', user.email, user.displayName);
  } catch (error) {
    handleError({ error, onError });
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log('User logged out successfully.');
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

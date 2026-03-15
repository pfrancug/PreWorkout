import type { User } from 'firebase/auth';
import type { ReactNode } from 'react';

import { auth } from '@firebase-config/auth';
import { updateUserDirectory } from '@firebase-config/database';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { AuthContext } from './AuthContext';

interface Props {
  children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTrainer, setIsTrainer] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const token = await firebaseUser.getIdTokenResult();
        setIsAdmin(token.claims.admin === true);
        setIsTrainer(token.claims.trainer === true);

        // Populate user directory entry
        updateUserDirectory(
          firebaseUser.uid,
          firebaseUser.email ?? '',
          firebaseUser.displayName ?? '',
        ).catch(() => {
          // Silently fail — non-critical
        });
      } else {
        setIsAdmin(false);
        setIsTrainer(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isTrainer }}>
      {children}
    </AuthContext.Provider>
  );
};

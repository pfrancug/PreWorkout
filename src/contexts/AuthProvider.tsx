import type { User } from 'firebase/auth';
import type { ReactNode } from 'react';

import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { auth } from '../firebase/auth';
import { AuthContext } from './AuthContext';

interface Props {
  children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

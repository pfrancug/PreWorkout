import type { User } from 'firebase/auth';

import { createContext } from 'react';

export type IAuthContext = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isTrainer: boolean;
};

export const AuthContext = createContext<IAuthContext | null>(null);

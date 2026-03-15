import { useAuth } from '@contexts/useAuth';
import { Navigate } from 'react-router-dom';

export const TrainerRoute = ({ children }: { children: React.ReactNode }) => {
  const { isTrainer } = useAuth();

  if (!isTrainer) {
    return <Navigate replace to={'/'} />;
  }

  return <>{children}</>;
};

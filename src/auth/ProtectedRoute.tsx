import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps): JSX.Element {
  const { sessao, carregando } = useAuth();

  if (carregando) return <SplashScreen />;
  if (!sessao) return <LoginScreen />;
  return <>{children}</>;
}

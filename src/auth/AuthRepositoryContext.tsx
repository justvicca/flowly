import type { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { AuthService } from './AuthService';
import { FirebaseAuthRepository } from './FirebaseAuthRepository';

interface AuthRepositoryProviderProps {
  children: ReactNode;
}

export function AuthRepositoryProvider({ children }: AuthRepositoryProviderProps): JSX.Element {
  const repo = new FirebaseAuthRepository();
  const service = new AuthService(repo);
  return <AuthProvider authService={service}>{children}</AuthProvider>;
}

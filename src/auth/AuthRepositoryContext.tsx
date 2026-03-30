import type { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { AuthService } from './AuthService';
import { MockAuthRepository } from './MockAuthRepository';

interface AuthRepositoryProviderProps {
  children: ReactNode;
}

/**
 * Convenience wrapper that creates a MockAuthRepository + AuthService
 * and provides them via AuthProvider.
 *
 * Swap MockAuthRepository for FirebaseAuthRepository when ready for production.
 */
export function AuthRepositoryProvider({ children }: AuthRepositoryProviderProps): JSX.Element {
  const repo = new MockAuthRepository();
  const service = new AuthService(repo);
  return <AuthProvider authService={service}>{children}</AuthProvider>;
}

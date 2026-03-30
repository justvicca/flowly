import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { UserProfile, Sessao } from './IAuthRepository';
import type { AuthService } from './AuthService';

export interface AuthState {
  usuario: UserProfile | null;
  sessao: Sessao | null;
  carregando: boolean;
  erro: string | null;
}

export interface AuthContextValue extends AuthState {
  loginComEmail(email: string, senha: string): Promise<void>;
  registrarComEmail(nome: string, email: string, senha: string): Promise<void>;
  loginComGoogle(): Promise<void>;
  loginComApple(): Promise<void>;
  logout(): Promise<void>;
  recuperarSenha(email: string): Promise<void>;
}

// --- Reducer ---

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SESSAO'; payload: Sessao }
  | { type: 'CLEAR_SESSAO' }
  | { type: 'SET_ERRO'; payload: string | null };

const initialState: AuthState = {
  usuario: null,
  sessao: null,
  carregando: true,
  erro: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, carregando: action.payload };
    case 'SET_SESSAO':
      return {
        ...state,
        sessao: action.payload,
        usuario: action.payload.usuario,
        carregando: false,
        erro: null,
      };
    case 'CLEAR_SESSAO':
      return { ...state, sessao: null, usuario: null, carregando: false, erro: null };
    case 'SET_ERRO':
      return { ...state, erro: action.payload, carregando: false };
    default:
      return state;
  }
}

// --- Context ---

export const AuthContext = createContext<AuthContextValue | null>(null);

// --- Provider ---

interface AuthProviderProps {
  authService: AuthService;
  children: ReactNode;
}

export function AuthProvider({ authService, children }: AuthProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    authService
      .obterSessaoAtual()
      .then((sessao) => {
        if (sessao) {
          dispatch({ type: 'SET_SESSAO', payload: sessao });
        } else {
          dispatch({ type: 'CLEAR_SESSAO' });
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Erro ao verificar sessão.';
        dispatch({ type: 'SET_ERRO', payload: msg });
      });
  }, [authService]);

  async function loginComEmail(email: string, senha: string): Promise<void> {
    dispatch({ type: 'SET_LOADING', payload: true });
    const result = await authService.loginComEmail(email, senha);
    if (result.sucesso) {
      dispatch({ type: 'SET_SESSAO', payload: result.sessao });
    } else {
      dispatch({ type: 'SET_ERRO', payload: result.erro });
    }
  }

  async function registrarComEmail(nome: string, email: string, senha: string): Promise<void> {
    dispatch({ type: 'SET_LOADING', payload: true });
    const result = await authService.registrarComEmail(nome, email, senha);
    if (result.sucesso) {
      dispatch({ type: 'SET_SESSAO', payload: result.sessao });
    } else {
      dispatch({ type: 'SET_ERRO', payload: result.erro });
    }
  }

  async function loginComGoogle(): Promise<void> {
    dispatch({ type: 'SET_LOADING', payload: true });
    const result = await authService.loginComGoogle();
    if (result.sucesso) {
      dispatch({ type: 'SET_SESSAO', payload: result.sessao });
    } else {
      dispatch({ type: 'SET_ERRO', payload: result.erro || null });
    }
  }

  async function loginComApple(): Promise<void> {
    dispatch({ type: 'SET_LOADING', payload: true });
    const result = await authService.loginComApple();
    if (result.sucesso) {
      dispatch({ type: 'SET_SESSAO', payload: result.sessao });
    } else {
      dispatch({ type: 'SET_ERRO', payload: result.erro || null });
    }
  }

  async function logout(): Promise<void> {
    await authService.logout();
    dispatch({ type: 'CLEAR_SESSAO' });
  }

  async function recuperarSenha(email: string): Promise<void> {
    await authService.recuperarSenha(email);
  }

  const value: AuthContextValue = {
    ...state,
    loginComEmail,
    registrarComEmail,
    loginComGoogle,
    loginComApple,
    logout,
    recuperarSenha,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// --- Hook ---

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return ctx;
}

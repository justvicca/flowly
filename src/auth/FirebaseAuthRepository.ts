import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from '../firebase';
import type { IAuthRepository, UserProfile, Sessao, AuthResult } from './IAuthRepository';

function toProfile(user: User): UserProfile {
  return {
    id: user.uid,
    nome: user.displayName ?? user.email?.split('@')[0] ?? 'Usuário',
    email: user.email ?? '',
    fotoPerfil: user.photoURL ?? undefined,
  };
}

async function toSessao(user: User): Promise<Sessao> {
  const token = await user.getIdToken();
  const decoded = JSON.parse(atob(token.split('.')[1]));
  return {
    usuario: toProfile(user),
    token,
    expiresAt: decoded.exp * 1000,
  };
}

const googleProvider = new GoogleAuthProvider();

export class FirebaseAuthRepository implements IAuthRepository {
  async registrarComEmail(nome: string, email: string, senha: string): Promise<AuthResult> {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    await updateProfile(cred.user, { displayName: nome });
    return { sucesso: true, sessao: await toSessao(cred.user) };
  }

  async loginComEmail(email: string, senha: string): Promise<AuthResult> {
    const cred = await signInWithEmailAndPassword(auth, email, senha);
    return { sucesso: true, sessao: await toSessao(cred.user) };
  }

  async loginComGoogle(): Promise<AuthResult> {
    const cred = await signInWithPopup(auth, googleProvider);
    return { sucesso: true, sessao: await toSessao(cred.user) };
  }

  async loginComApple(): Promise<AuthResult> {
    return { sucesso: false, erro: 'auth/apple-not-available' };
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  async recuperarSenha(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  async obterSessaoAtual(): Promise<Sessao | null> {
    return new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, async (user) => {
        unsub();
        if (!user) { resolve(null); return; }
        try {
          resolve(await toSessao(user));
        } catch {
          resolve(null);
        }
      });
    });
  }

  async renovarToken(): Promise<Sessao | null> {
    const user = auth.currentUser;
    if (!user) return null;
    await user.getIdToken(true); // força refresh
    return toSessao(user);
  }
}

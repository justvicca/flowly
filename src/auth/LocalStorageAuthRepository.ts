import type { IAuthRepository, UserProfile, Sessao, AuthResult } from './IAuthRepository';

const KEY_USERS = 'flowly:auth:users';
const KEY_SESSAO = 'flowly:auth:sessao';

interface StoredUser {
  userId: string;
  nome: string;
  email: string;
  senhaHash: string;
}

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(KEY_USERS);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]): void {
  localStorage.setItem(KEY_USERS, JSON.stringify(users));
}

function loadSessao(): Sessao | null {
  try {
    const raw = localStorage.getItem(KEY_SESSAO);
    if (!raw) return null;
    const sessao = JSON.parse(raw) as Sessao;
    // Verifica se o token ainda é válido
    if (sessao.expiresAt < Date.now()) {
      localStorage.removeItem(KEY_SESSAO);
      return null;
    }
    return sessao;
  } catch {
    return null;
  }
}

function saveSessao(sessao: Sessao | null): void {
  if (sessao) {
    localStorage.setItem(KEY_SESSAO, JSON.stringify(sessao));
  } else {
    localStorage.removeItem(KEY_SESSAO);
  }
}

function criarSessao(usuario: UserProfile): Sessao {
  return {
    usuario,
    token: `ls-token-${usuario.id}-${Date.now()}`,
    expiresAt: Date.now() + 30 * 24 * 3600 * 1000, // 30 dias
  };
}

export class LocalStorageAuthRepository implements IAuthRepository {
  async registrarComEmail(nome: string, email: string, senha: string): Promise<AuthResult> {
    const users = loadUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { sucesso: false, erro: 'auth/email-already-in-use' };
    }
    const userId = crypto.randomUUID();
    users.push({ userId, nome, email: email.toLowerCase(), senhaHash: senha });
    saveUsers(users);

    const perfil: UserProfile = { id: userId, nome, email: email.toLowerCase() };
    const sessao = criarSessao(perfil);
    saveSessao(sessao);
    return { sucesso: true, sessao };
  }

  async loginComEmail(email: string, senha: string): Promise<AuthResult> {
    const users = loadUsers();
    const user = users.find((u) => u.email === email.toLowerCase());
    if (!user || user.senhaHash !== senha) {
      return { sucesso: false, erro: 'auth/wrong-password' };
    }
    const perfil: UserProfile = { id: user.userId, nome: user.nome, email: user.email };
    const sessao = criarSessao(perfil);
    saveSessao(sessao);
    return { sucesso: true, sessao };
  }

  async loginComGoogle(): Promise<AuthResult> {
    return { sucesso: false, erro: 'auth/google-not-available' };
  }

  async loginComApple(): Promise<AuthResult> {
    return { sucesso: false, erro: 'auth/apple-not-available' };
  }

  async logout(): Promise<void> {
    saveSessao(null);
  }

  async recuperarSenha(_email: string): Promise<void> {
    // Sem backend por enquanto — no-op
  }

  async obterSessaoAtual(): Promise<Sessao | null> {
    return loadSessao();
  }

  async renovarToken(): Promise<Sessao | null> {
    const sessao = loadSessao();
    if (!sessao) return null;
    const renovada = criarSessao(sessao.usuario);
    saveSessao(renovada);
    return renovada;
  }
}

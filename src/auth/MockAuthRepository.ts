import { IAuthRepository, UserProfile, Sessao, AuthResult } from './IAuthRepository';

interface StoredUser {
  nome: string;
  senhaHash: string;
  userId: string;
}

const GOOGLE_FIXED_PROFILE: UserProfile = {
  id: 'mock-google-uid-fixed',
  nome: 'Usuário Google',
  email: 'usuario.google@gmail.com',
  fotoPerfil: 'https://example.com/google-avatar.png',
};

const APPLE_FIXED_PROFILE: UserProfile = {
  id: 'mock-apple-uid-fixed',
  nome: 'Usuário Apple',
  email: 'usuario.apple@icloud.com',
};

function criarSessao(usuario: UserProfile): Sessao {
  return {
    usuario,
    token: `mock-token-${usuario.id}-${Date.now()}`,
    expiresAt: Date.now() + 3600000,
  };
}

export class MockAuthRepository implements IAuthRepository {
  private usuarios = new Map<string, StoredUser>();
  private sessaoAtual: Sessao | null = null;

  async registrarComEmail(nome: string, email: string, senha: string): Promise<AuthResult> {
    if (this.usuarios.has(email)) {
      return { sucesso: false, erro: 'auth/email-already-in-use' };
    }

    const userId = crypto.randomUUID();
    this.usuarios.set(email, { nome, senhaHash: senha, userId });

    const perfil: UserProfile = { id: userId, nome, email };
    const sessao = criarSessao(perfil);
    this.sessaoAtual = sessao;

    return { sucesso: true, sessao };
  }

  async loginComEmail(email: string, senha: string): Promise<AuthResult> {
    const usuario = this.usuarios.get(email);

    if (!usuario || usuario.senhaHash !== senha) {
      return { sucesso: false, erro: 'auth/wrong-password' };
    }

    const perfil: UserProfile = { id: usuario.userId, nome: usuario.nome, email };
    const sessao = criarSessao(perfil);
    this.sessaoAtual = sessao;

    return { sucesso: true, sessao };
  }

  async loginComGoogle(): Promise<AuthResult> {
    const sessao = criarSessao(GOOGLE_FIXED_PROFILE);
    this.sessaoAtual = sessao;
    return { sucesso: true, sessao };
  }

  async loginComApple(): Promise<AuthResult> {
    const sessao = criarSessao(APPLE_FIXED_PROFILE);
    this.sessaoAtual = sessao;
    return { sucesso: true, sessao };
  }

  async logout(): Promise<void> {
    this.sessaoAtual = null;
  }

  async recuperarSenha(_email: string): Promise<void> {
    // No-op no mock — simula envio de email sem chamada de rede
  }

  async obterSessaoAtual(): Promise<Sessao | null> {
    return this.sessaoAtual;
  }

  async renovarToken(): Promise<Sessao | null> {
    if (!this.sessaoAtual) return null;

    const sessaoRenovada: Sessao = {
      ...this.sessaoAtual,
      token: `mock-token-${this.sessaoAtual.usuario.id}-${Date.now()}`,
      expiresAt: Date.now() + 3600000,
    };
    this.sessaoAtual = sessaoRenovada;
    return sessaoRenovada;
  }
}

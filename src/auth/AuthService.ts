import type { IAuthRepository, AuthResult, Sessao } from './IAuthRepository';

function emailValido(email: string): boolean {
  const atIndex = email.indexOf('@');
  if (atIndex < 1) return false;
  const domain = email.slice(atIndex + 1);
  return domain.includes('.');
}

export class AuthService {
  constructor(private readonly repo: IAuthRepository) {}

  async registrarComEmail(nome: string, email: string, senha: string): Promise<AuthResult> {
    if (!nome.trim()) {
      return { sucesso: false, erro: 'O nome não pode estar vazio.' };
    }
    if (!emailValido(email)) {
      return { sucesso: false, erro: 'Digite um email válido, como exemplo@email.com.' };
    }
    if (senha.length < 8) {
      return { sucesso: false, erro: 'A senha precisa ter pelo menos 8 caracteres.' };
    }
    try {
      const result = await this.repo.registrarComEmail(nome, email, senha);
      if (!result.sucesso) {
        if (result.erro === 'auth/email-already-in-use') {
          return { sucesso: false, erro: 'Já existe uma conta com esse email. Tente fazer login.' };
        }
        return { sucesso: false, erro: 'Não foi possível criar a conta. Tente novamente.' };
      }
      return result;
    } catch {
      return { sucesso: false, erro: 'Não foi possível criar a conta. Tente novamente.' };
    }
  }

  async loginComEmail(email: string, senha: string): Promise<AuthResult> {
    if (!emailValido(email)) {
      return { sucesso: false, erro: 'Digite um email válido, como exemplo@email.com.' };
    }
    if (senha.length < 8) {
      return { sucesso: false, erro: 'A senha precisa ter pelo menos 8 caracteres.' };
    }
    try {
      const result = await this.repo.loginComEmail(email, senha);
      if (!result.sucesso) {
        if (result.erro === 'auth/wrong-password' || result.erro === 'auth/user-not-found') {
          return { sucesso: false, erro: 'Email ou senha incorretos. Verifique e tente novamente.' };
        }
        if (result.erro === 'auth/network-request-failed') {
          return { sucesso: false, erro: 'Não foi possível conectar. Verifique sua internet e tente novamente.' };
        }
        return { sucesso: false, erro: 'Não foi possível fazer login. Tente novamente.' };
      }
      return result;
    } catch {
      return { sucesso: false, erro: 'Não foi possível fazer login. Tente novamente.' };
    }
  }

  async loginComGoogle(): Promise<AuthResult> {
    try {
      const result = await this.repo.loginComGoogle();
      if (!result.sucesso) {
        if (result.erro === 'auth/popup-closed-by-user' || result.erro === 'auth/cancelled-popup-request') {
          return { sucesso: false, erro: '' };
        }
        return { sucesso: false, erro: 'Não foi possível entrar com o Google. Tente novamente ou use email e senha.' };
      }
      return result;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return { sucesso: false, erro: '' };
      }
      return { sucesso: false, erro: 'Não foi possível entrar com o Google. Tente novamente ou use email e senha.' };
    }
  }

  async loginComApple(): Promise<AuthResult> {
    try {
      const result = await this.repo.loginComApple();
      if (!result.sucesso) {
        if (result.erro === 'auth/popup-closed-by-user' || result.erro === 'auth/cancelled-popup-request') {
          return { sucesso: false, erro: '' };
        }
        return { sucesso: false, erro: 'Não foi possível entrar com o Apple ID. Tente novamente ou use email e senha.' };
      }
      return result;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return { sucesso: false, erro: '' };
      }
      return { sucesso: false, erro: 'Não foi possível entrar com o Apple ID. Tente novamente ou use email e senha.' };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.repo.logout();
    } catch {
      // swallow
    }
  }

  async recuperarSenha(email: string): Promise<void> {
    if (!emailValido(email)) {
      return;
    }
    try {
      await this.repo.recuperarSenha(email);
    } catch {
      // never throw to caller
    }
  }

  async obterSessaoAtual(): Promise<Sessao | null> {
    return this.repo.obterSessaoAtual();
  }

  async renovarToken(): Promise<Sessao | null> {
    return this.repo.renovarToken();
  }
}

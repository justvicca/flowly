export interface UserProfile {
  id: string;           // UID único do provedor
  nome: string;         // Nome de exibição
  email: string;        // Email do usuário
  fotoPerfil?: string;  // URL da foto (provedores sociais)
}

export interface Sessao {
  usuario: UserProfile;
  token: string;
  expiresAt: number;    // Unix timestamp de expiração
}

export type AuthResult =
  | { sucesso: true; sessao: Sessao }
  | { sucesso: false; erro: string };

export interface IAuthRepository {
  loginComEmail(email: string, senha: string): Promise<AuthResult>;
  registrarComEmail(nome: string, email: string, senha: string): Promise<AuthResult>;
  loginComGoogle(): Promise<AuthResult>;
  loginComApple(): Promise<AuthResult>;
  logout(): Promise<void>;
  recuperarSenha(email: string): Promise<void>;
  obterSessaoAtual(): Promise<Sessao | null>;
  renovarToken(): Promise<Sessao | null>;
}

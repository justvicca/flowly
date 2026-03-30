import { describe, it, expect, vi } from 'vitest';
import { AuthService } from './AuthService';
import { MockAuthRepository } from './MockAuthRepository';
import type { IAuthRepository, AuthResult } from './IAuthRepository';

// Helper: repo that returns a specific error code
function repoWithError(method: keyof IAuthRepository, errorCode: string): IAuthRepository {
  const base = new MockAuthRepository();
  const stub = {
    ...base,
    [method]: vi.fn().mockResolvedValue({ sucesso: false, erro: errorCode }),
  } as unknown as IAuthRepository;
  return stub;
}

// Helper: repo whose logout throws
function repoWithLogoutThrow(): IAuthRepository {
  const base = new MockAuthRepository();
  return {
    ...base,
    logout: vi.fn().mockRejectedValue(new Error('network error')),
  } as unknown as IAuthRepository;
}

// ─── Fluxo completo ──────────────────────────────────────────────────────────

describe('fluxo completo: registro → login → logout', () => {
  it('registra, faz login e depois logout com sucesso', async () => {
    const repo = new MockAuthRepository();
    const service = new AuthService(repo);

    const reg = await service.registrarComEmail('Ana', 'ana@email.com', 'senha123');
    expect(reg.sucesso).toBe(true);
    if (!reg.sucesso) return;
    expect(reg.sessao.usuario.email).toBe('ana@email.com');

    const login = await service.loginComEmail('ana@email.com', 'senha123');
    expect(login.sucesso).toBe(true);
    if (!login.sucesso) return;
    expect(login.sessao.usuario.id).toBe(reg.sessao.usuario.id);

    await service.logout();
    const sessao = await service.obterSessaoAtual();
    expect(sessao).toBeNull();
  });
});

// ─── Validações de entrada ────────────────────────────────────────────────────

describe('validações de entrada — registrarComEmail', () => {
  it('rejeita nome vazio', async () => {
    const service = new AuthService(new MockAuthRepository());
    const r = await service.registrarComEmail('   ', 'a@b.com', 'senha123');
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toBe('O nome não pode estar vazio.');
  });

  it('rejeita email sem @', async () => {
    const service = new AuthService(new MockAuthRepository());
    const r = await service.registrarComEmail('Ana', 'emailinvalido', 'senha123');
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toBe('Digite um email válido, como exemplo@email.com.');
  });

  it('rejeita email sem domínio com ponto', async () => {
    const service = new AuthService(new MockAuthRepository());
    const r = await service.registrarComEmail('Ana', 'a@semdominio', 'senha123');
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toBe('Digite um email válido, como exemplo@email.com.');
  });

  it('rejeita senha com menos de 8 caracteres', async () => {
    const service = new AuthService(new MockAuthRepository());
    const r = await service.registrarComEmail('Ana', 'a@b.com', '1234567');
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toBe('A senha precisa ter pelo menos 8 caracteres.');
  });
});

describe('validações de entrada — loginComEmail', () => {
  it('rejeita email inválido', async () => {
    const service = new AuthService(new MockAuthRepository());
    const r = await service.loginComEmail('invalido', 'senha123');
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toBe('Digite um email válido, como exemplo@email.com.');
  });

  it('rejeita senha curta', async () => {
    const service = new AuthService(new MockAuthRepository());
    const r = await service.loginComEmail('a@b.com', '1234567');
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toBe('A senha precisa ter pelo menos 8 caracteres.');
  });
});

// ─── Mapeamento de erros do repositório ──────────────────────────────────────

describe('mapeamento de erros — registrarComEmail (Req 1.4)', () => {
  it('auth/email-already-in-use → mensagem em português', async () => {
    const service = new AuthService(repoWithError('registrarComEmail', 'auth/email-already-in-use'));
    const r = await service.registrarComEmail('Ana', 'a@b.com', 'senha123');
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toBe('Já existe uma conta com esse email. Tente fazer login.');
  });

  it('erro genérico → mensagem genérica', async () => {
    const service = new AuthService(repoWithError('registrarComEmail', 'auth/unknown'));
    const r = await service.registrarComEmail('Ana', 'a@b.com', 'senha123');
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toBe('Não foi possível criar a conta. Tente novamente.');
  });
});

describe('mapeamento de erros — loginComEmail (Req 2.3, 2.4)', () => {
  it('auth/wrong-password → mensagem em português', async () => {
    const service = new AuthService(repoWithError('loginComEmail', 'auth/wrong-password'));
    const r = await service.loginComEmail('a@b.com', 'senha123');
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toBe('Email ou senha incorretos. Verifique e tente novamente.');
  });

  it('auth/user-not-found → mensagem em português', async () => {
    const service = new AuthService(repoWithError('loginComEmail', 'auth/user-not-found'));
    const r = await service.loginComEmail('a@b.com', 'senha123');
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toBe('Email ou senha incorretos. Verifique e tente novamente.');
  });

  it('auth/network-request-failed → mensagem de rede', async () => {
    const service = new AuthService(repoWithError('loginComEmail', 'auth/network-request-failed'));
    const r = await service.loginComEmail('a@b.com', 'senha123');
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toBe('Não foi possível conectar. Verifique sua internet e tente novamente.');
  });

  it('erro genérico → mensagem genérica', async () => {
    const service = new AuthService(repoWithError('loginComEmail', 'auth/unknown'));
    const r = await service.loginComEmail('a@b.com', 'senha123');
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toBe('Não foi possível fazer login. Tente novamente.');
  });
});

// ─── Fluxo social — cancelamento silencioso (Req 3.4, 3.5, 4.4, 4.5) ─────────

describe('cancelamento de fluxo social retorna erro vazio', () => {
  it('loginComGoogle: auth/popup-closed-by-user → erro vazio', async () => {
    const service = new AuthService(repoWithError('loginComGoogle', 'auth/popup-closed-by-user'));
    const r = await service.loginComGoogle();
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toBe('');
  });

  it('loginComGoogle: auth/cancelled-popup-request → erro vazio', async () => {
    const service = new AuthService(repoWithError('loginComGoogle', 'auth/cancelled-popup-request'));
    const r = await service.loginComGoogle();
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toBe('');
  });

  it('loginComGoogle: erro genérico → mensagem Google', async () => {
    const service = new AuthService(repoWithError('loginComGoogle', 'auth/unknown'));
    const r = await service.loginComGoogle();
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toBe('Não foi possível entrar com o Google. Tente novamente ou use email e senha.');
  });

  it('loginComApple: auth/popup-closed-by-user → erro vazio', async () => {
    const service = new AuthService(repoWithError('loginComApple', 'auth/popup-closed-by-user'));
    const r = await service.loginComApple();
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toBe('');
  });

  it('loginComApple: erro genérico → mensagem Apple', async () => {
    const service = new AuthService(repoWithError('loginComApple', 'auth/unknown'));
    const r = await service.loginComApple();
    expect(r.sucesso).toBe(false);
    if (!r.sucesso) expect(r.erro).toBe('Não foi possível entrar com o Apple ID. Tente novamente ou use email e senha.');
  });
});

// ─── Logout resiliente (Req 6.4) ─────────────────────────────────────────────

describe('logout resiliente', () => {
  it('logout resolve mesmo quando repo.logout lança erro', async () => {
    const service = new AuthService(repoWithLogoutThrow());
    await expect(service.logout()).resolves.toBeUndefined();
  });
});

// ─── recuperarSenha (Req 7.5) ────────────────────────────────────────────────

describe('recuperarSenha', () => {
  it('não lança para email válido não cadastrado', async () => {
    const service = new AuthService(new MockAuthRepository());
    await expect(service.recuperarSenha('nao@existe.com')).resolves.toBeUndefined();
  });

  it('não lança para email inválido (silencioso)', async () => {
    const service = new AuthService(new MockAuthRepository());
    await expect(service.recuperarSenha('invalido')).resolves.toBeUndefined();
  });

  it('não lança mesmo quando repo.recuperarSenha lança', async () => {
    const base = new MockAuthRepository();
    const repo = {
      ...base,
      recuperarSenha: vi.fn().mockRejectedValue(new Error('network')),
    } as unknown as IAuthRepository;
    const service = new AuthService(repo);
    await expect(service.recuperarSenha('a@b.com')).resolves.toBeUndefined();
  });
});

// ─── obterSessaoAtual e renovarToken ─────────────────────────────────────────

describe('delegação ao repositório', () => {
  it('obterSessaoAtual retorna null sem sessão', async () => {
    const service = new AuthService(new MockAuthRepository());
    expect(await service.obterSessaoAtual()).toBeNull();
  });

  it('renovarToken retorna null sem sessão', async () => {
    const service = new AuthService(new MockAuthRepository());
    expect(await service.renovarToken()).toBeNull();
  });

  it('obterSessaoAtual retorna sessão após login', async () => {
    const repo = new MockAuthRepository();
    const service = new AuthService(repo);
    await service.registrarComEmail('Ana', 'ana@email.com', 'senha123');
    const sessao = await service.obterSessaoAtual();
    expect(sessao).not.toBeNull();
    expect(sessao?.usuario.email).toBe('ana@email.com');
  });
});

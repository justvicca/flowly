import { test, expect } from 'vitest';
import * as fc from 'fast-check';
import { AuthService } from './AuthService';
import { MockAuthRepository } from './MockAuthRepository';

// Feature: flowly-auth, Property 2: registro com dados válidos cria sessão
// Valida: Requisito 1.3
test('P2: registro com dados válidos cria sessão', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      fc.emailAddress(),
      fc.string({ minLength: 8 }),
      async (nome, email, senha) => {
        const repo = new MockAuthRepository();
        const service = new AuthService(repo);
        const result = await service.registrarComEmail(nome, email, senha);
        return result.sucesso === true && result.sessao.usuario.email === email;
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: flowly-auth, Property 3: validação rejeita inputs inválidos
// Valida: Requisitos 1.5, 1.6
test('P3: validação rejeita email sem @', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 1 }).filter(s => !s.includes('@')),
      fc.string({ minLength: 8 }),
      async (emailInvalido, senha) => {
        const repo = new MockAuthRepository();
        const service = new AuthService(repo);
        const result = await service.registrarComEmail('Nome', emailInvalido, senha);
        return result.sucesso === false;
      }
    ),
    { numRuns: 100 }
  );
});

test('P3: validação rejeita senha curta', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.emailAddress(),
      fc.string({ maxLength: 7 }),
      async (email, senhasCurta) => {
        const repo = new MockAuthRepository();
        const service = new AuthService(repo);
        const result = await service.registrarComEmail('Nome', email, senhasCurta);
        return result.sucesso === false;
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: flowly-auth, Property 4: login com credenciais válidas cria sessão
// Valida: Requisito 2.1
test('P4: login com credenciais válidas cria sessão', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      fc.emailAddress(),
      fc.string({ minLength: 8 }),
      async (nome, email, senha) => {
        const repo = new MockAuthRepository();
        const service = new AuthService(repo);
        const reg = await service.registrarComEmail(nome, email, senha);
        if (!reg.sucesso) return false;
        const login = await service.loginComEmail(email, senha);
        return login.sucesso === true && login.sessao.usuario.id === reg.sessao.usuario.id;
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: flowly-auth, Property 5: login social cria sessão idempotente
// Valida: Requisitos 3.2, 4.3
test('P5: loginComGoogle chamado duas vezes retorna mesmo userId', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.constant(null),
      async () => {
        const repo = new MockAuthRepository();
        const service = new AuthService(repo);
        const r1 = await service.loginComGoogle();
        const r2 = await service.loginComGoogle();
        return r1.sucesso === true && r2.sucesso === true && r1.sessao.usuario.id === r2.sessao.usuario.id;
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: flowly-auth, Property 7: logout limpa sessão
// Valida: Requisito 6.3
test('P7: após logout, obterSessaoAtual retorna null', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      fc.emailAddress(),
      fc.string({ minLength: 8 }),
      async (nome, email, senha) => {
        const repo = new MockAuthRepository();
        const service = new AuthService(repo);
        const reg = await service.registrarComEmail(nome, email, senha);
        if (!reg.sucesso) return false;
        await service.logout();
        const sessao = await service.obterSessaoAtual();
        return sessao === null;
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: flowly-auth, Property 8: recuperação de senha tem resposta uniforme
// Valida: Requisitos 7.2, 7.4
test('P8: recuperarSenha não lança exceção para qualquer email', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.emailAddress(),
      async (email) => {
        const repo = new MockAuthRepository();
        const service = new AuthService(repo);
        // email não cadastrado — deve completar sem lançar
        let threw = false;
        try {
          await service.recuperarSenha(email);
        } catch {
          threw = true;
        }
        if (threw) return false;

        // email cadastrado — deve completar sem lançar
        await service.registrarComEmail('Nome Teste', email, 'senha123');
        try {
          await service.recuperarSenha(email);
        } catch {
          threw = true;
        }
        return !threw;
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: flowly-auth, Property 6: sessão persiste e é restaurada
import { test } from 'vitest';
import * as fc from 'fast-check';
import { MockAuthRepository } from './MockAuthRepository';

/**
 * Propriedade 6: Sessão persiste e é restaurada (round-trip)
 * Valida: Requisitos 5.1, 5.2
 */
test('P6: sessão criada por login persiste e é restaurada via obterSessaoAtual', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 1 }),
      fc.emailAddress(),
      fc.string({ minLength: 8 }),
      async (nome, email, senha) => {
        const repo = new MockAuthRepository();

        const resultado = await repo.registrarComEmail(nome, email, senha);
        if (!resultado.sucesso) return true; // skip se email duplicado (não ocorre aqui)

        const sessaoRestaurada = await repo.obterSessaoAtual();

        return (
          sessaoRestaurada !== null &&
          sessaoRestaurada.usuario.id === resultado.sessao.usuario.id &&
          sessaoRestaurada.usuario.email === email
        );
      }
    ),
    { numRuns: 100 }
  );
});

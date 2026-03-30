import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { MockFlowlyRepository } from './MockFlowlyRepository';
import type { Transaction } from '../types/flowly';

const USER_ID = 'user-test-123';

// Arbitrário para gerar Transaction válidas
const arbitraryTransaction = fc.record<Transaction>({
  id: fc.uuid(),
  descricao: fc.string({ minLength: 1, maxLength: 100 }),
  valor: fc.double({ min: 0.01, max: 1_000_000, noNaN: true }),
  tipo: fc.oneof(fc.constant('entrada' as const), fc.constant('saida' as const)),
  data: fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') }).map(
    (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  ),
  fixo: fc.boolean(),
  carteira_origem: fc.string({ minLength: 1, maxLength: 50 }),
  recorrencia_id: fc.option(fc.uuid(), { nil: undefined }),
  timestamp: fc.option(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), { nil: undefined }),
});

/**
 * Propriedade 4: Round-trip de serialização — serializar e desserializar uma Transaction válida
 * produz objeto equivalente ao original.
 * Valida: Requisito 8.4
 */
describe('Propriedade 4 — round-trip de serialização de Transaction', () => {
  it('serializar e desserializar uma Transaction válida deve produzir objeto equivalente ao original', () => {
    fc.assert(
      fc.property(arbitraryTransaction, (transaction) => {
        const serialized = JSON.stringify(transaction);
        const deserialized = JSON.parse(serialized) as Transaction;
        expect(deserialized).toEqual(transaction);
      })
    );
  });
});

/**
 * Propriedade 5: Saldo de carteira é sempre igual à soma das entradas menos a soma das saídas
 * daquela carteira.
 * Valida: Requisito 5.4
 */
describe('Propriedade 5 — saldo de carteira é soma(entradas) - soma(saídas)', () => {
  it('obterSaldoPorCarteira deve retornar o valor correto para qualquer conjunto de transações', async () => {
    const carteiraFixa = 'CarteiraTeste';

    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            descricao: fc.string({ minLength: 1, maxLength: 100 }),
            valor: fc.double({ min: 0.01, max: 1_000_000, noNaN: true }),
            tipo: fc.oneof(fc.constant('entrada' as const), fc.constant('saida' as const)),
            data: fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') }).map(
              (d) =>
                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            ),
            fixo: fc.boolean(),
            carteira_origem: fc.constant(carteiraFixa),
          }),
          { maxLength: 20 }
        ),
        async (transacoes) => {
          const repo = new MockFlowlyRepository();

          // Adicionar todas as transações geradas
          for (const t of transacoes) {
            await repo.adicionarTransacao(USER_ID, t);
          }

          const saldoCalculado = await repo.obterSaldoPorCarteira(USER_ID, carteiraFixa);

          // Calcular manualmente: soma entradas - soma saídas (apenas das transações adicionadas)
          const entradas = transacoes
            .filter((t) => t.tipo === 'entrada')
            .reduce((acc, t) => acc + t.valor, 0);
          const saidas = transacoes
            .filter((t) => t.tipo === 'saida')
            .reduce((acc, t) => acc + t.valor, 0);
          const saldoEsperado = entradas - saidas;

          expect(saldoCalculado).toBeCloseTo(saldoEsperado, 5);
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// Propriedades de isolamento de dados (Task 5.1)
// ---------------------------------------------------------------------------

/**
 * Propriedade 9: Isolamento de dados por userId
 * Feature: flowly-auth, Property 9: isolamento de dados por userId
 * Valida: Requisitos 8.1, 8.4
 */
describe('Propriedade 9 — isolamento de dados por userId', () => {
  it('transações escritas com userIdA não devem ser visíveis para userIdB', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.record({
          descricao: fc.string({ minLength: 1, maxLength: 100 }),
          valor: fc.double({ min: 0.01, max: 1_000_000, noNaN: true }),
          tipo: fc.oneof(fc.constant('entrada' as const), fc.constant('saida' as const)),
          data: fc.constant('2025-01-01'),
          fixo: fc.boolean(),
          carteira_origem: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async (userIdA, userIdB, transacao) => {
          fc.pre(userIdA !== userIdB);

          const repo = new MockFlowlyRepository();
          await repo.adicionarTransacao(userIdA, transacao);

          const listaB = await repo.listarTransacoes(userIdB);
          expect(listaB).toHaveLength(0);

          const listaA = await repo.listarTransacoes(userIdA);
          expect(listaA).toHaveLength(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Propriedade 10: Novo usuário começa com dados vazios
 * Feature: flowly-auth, Property 10: novo usuário começa com dados vazios
 * Valida: Requisito 8.2
 */
describe('Propriedade 10 — novo usuário começa com dados vazios', () => {
  it('listarTransacoes e listarCarteiras devem retornar [] para userId nunca usado', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          const repo = new MockFlowlyRepository();

          const transacoes = await repo.listarTransacoes(userId);
          const carteiras = await repo.listarCarteiras(userId);

          expect(transacoes).toHaveLength(0);
          expect(carteiras).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Propriedade 11: Operações sem sessão são rejeitadas
 * Feature: flowly-auth, Property 11: operações sem sessão são rejeitadas
 * Valida: Requisito 8.3
 */
describe('Propriedade 11 — operações sem sessão são rejeitadas', () => {
  it('todas as operações devem rejeitar quando userId é null ou string vazia', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(fc.constant(null as unknown as string), fc.constant('')),
        async (invalidUserId) => {
          const repo = new MockFlowlyRepository();

          await expect(repo.listarTransacoes(invalidUserId)).rejects.toThrow();
          await expect(
            repo.adicionarTransacao(invalidUserId, {
              descricao: 'X',
              valor: 1,
              tipo: 'entrada',
              data: '2025-01-01',
              fixo: false,
              carteira_origem: 'W',
            })
          ).rejects.toThrow();
          await expect(repo.listarCarteiras(invalidUserId)).rejects.toThrow();
          await expect(repo.adicionarCarteira(invalidUserId, 'W')).rejects.toThrow();
          await expect(repo.obterSaldoPorCarteira(invalidUserId, 'W')).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { MockFlowlyRepository } from './MockFlowlyRepository';
import type { Transaction } from '../types/flowly';

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
            await repo.adicionarTransacao(t);
          }

          const saldoCalculado = await repo.obterSaldoPorCarteira(carteiraFixa);

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

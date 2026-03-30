import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { gerarOcorrenciasDoMes } from './RecurrenceEngine';
import type { Transaction } from '../types/flowly';

// Arbitrário para gerar Transaction com fixo: true
const arbitraryFixedTransaction = fc.record<Transaction>({
  id: fc.uuid(),
  descricao: fc.string({ minLength: 1, maxLength: 100 }),
  valor: fc.double({ min: 0.01, max: 1_000_000, noNaN: true }),
  tipo: fc.oneof(fc.constant('entrada' as const), fc.constant('saida' as const)),
  data: fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') }).map(
    (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  ),
  fixo: fc.constant(true),
  carteira_origem: fc.string({ minLength: 1, maxLength: 50 }),
  recorrencia_id: fc.option(fc.uuid(), { nil: undefined }),
  timestamp: fc.option(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), { nil: undefined }),
});

// Mês alvo fixo para os testes
const MES_ALVO = '2024-03';

/**
 * Propriedade 6: Para qualquer conjunto de transações fixas, o número de ocorrências geradas
 * para um mês é sempre igual ao número de transações fixas.
 * Valida: Requisito 4.2
 */
describe('Propriedade 6 — número de ocorrências geradas é igual ao número de transações fixas', () => {
  it('deve gerar exatamente uma ocorrência por transação fixa', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryFixedTransaction, { maxLength: 20 }),
        (transacoesFixas) => {
          const ocorrencias = gerarOcorrenciasDoMes(transacoesFixas, MES_ALVO);
          expect(ocorrencias.length).toBe(transacoesFixas.length);
        }
      )
    );
  });
});

/**
 * Propriedade 7: Toda ocorrência gerada possui `id` único e diferente do `id` da transação base.
 * Valida: Requisitos 1.2, 4.2
 */
describe('Propriedade 7 — ids das ocorrências são únicos e diferentes dos ids base', () => {
  it('não deve haver ids duplicados e nenhum id deve coincidir com o id da transação base', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryFixedTransaction, { minLength: 1, maxLength: 20 }),
        (transacoesFixas) => {
          const ocorrencias = gerarOcorrenciasDoMes(transacoesFixas, MES_ALVO);

          const idsGerados = ocorrencias.map((o) => o.id);
          const idsBase = transacoesFixas.map((t) => t.id);

          // Todos os ids gerados devem ser únicos (sem duplicatas)
          const idsUnicos = new Set(idsGerados);
          expect(idsUnicos.size).toBe(idsGerados.length);

          // Nenhum id gerado deve coincidir com um id base
          for (const idGerado of idsGerados) {
            expect(idsBase).not.toContain(idGerado);
          }
        }
      )
    );
  });
});

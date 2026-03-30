import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validarTransacao } from './TransactionValidator';
import type { TransactionInput } from '../types/flowly';

// Base válida para usar nos testes de propriedade
const baseValida: TransactionInput = {
  descricao: 'Salário',
  valor: 1000,
  tipo: 'entrada',
  data: '2024-01-15',
  fixo: false,
  carteira_origem: 'Banco do Brasil',
};

/**
 * Propriedade 1: Qualquer valor ≤ 0 sempre resulta em `valido: false`
 * Valida: Requisito 1.3
 */
describe('Propriedade 1 — valor ≤ 0 sempre resulta em valido: false', () => {
  it('deve rejeitar qualquer valor <= 0', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(0),
          fc.float({ max: -Number.EPSILON, noNaN: true }),
          fc.integer({ max: -1 }).map(n => n),
        ),
        (valor) => {
          const input: TransactionInput = { ...baseValida, valor };
          const resultado = validarTransacao(input);
          expect(resultado.valido).toBe(false);
        }
      )
    );
  });
});

/**
 * Propriedade 2: Qualquer string que não seja "entrada" ou "saida" no campo `tipo` sempre resulta em `valido: false`
 * Valida: Requisito 1.4
 */
describe('Propriedade 2 — tipo inválido sempre resulta em valido: false', () => {
  it('deve rejeitar qualquer tipo que não seja "entrada" ou "saida"', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s !== 'entrada' && s !== 'saida'),
        (tipo) => {
          const input = { ...baseValida, tipo: tipo as TransactionInput['tipo'] };
          const resultado = validarTransacao(input);
          expect(resultado.valido).toBe(false);
        }
      )
    );
  });
});

/**
 * Propriedade 3: Qualquer string que não siga o padrão `YYYY-MM-DD` no campo `data` sempre resulta em `valido: false`
 * Valida: Requisito 1.5
 */
describe('Propriedade 3 — data fora do padrão YYYY-MM-DD sempre resulta em valido: false', () => {
  it('deve rejeitar qualquer data que não siga o formato YYYY-MM-DD', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !/^\d{4}-\d{2}-\d{2}$/.test(s)),
        (data) => {
          const input: TransactionInput = { ...baseValida, data };
          const resultado = validarTransacao(input);
          expect(resultado.valido).toBe(false);
        }
      )
    );
  });
});

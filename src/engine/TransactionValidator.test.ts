import { describe, it, expect } from 'vitest';
import { validarTransacao } from './TransactionValidator';
import type { TransactionInput } from '../types/flowly';

const validInput: TransactionInput = {
  descricao: 'Salário',
  valor: 1000,
  tipo: 'entrada',
  data: '2024-01-15',
  fixo: false,
  carteira_origem: 'Banco do Brasil',
};

describe('TransactionValidator — validarTransacao', () => {
  // Requisito 1.3: valor <= 0
  it('valor 0 → valido: false', () => {
    const result = validarTransacao({ ...validInput, valor: 0 });
    expect(result.valido).toBe(false);
  });

  it('valor negativo → valido: false', () => {
    const result = validarTransacao({ ...validInput, valor: -50 });
    expect(result.valido).toBe(false);
  });

  // Requisito 1.4: tipo inválido
  it('tipo em maiúsculas "Entrada" → valido: false', () => {
    const result = validarTransacao({ ...validInput, tipo: 'Entrada' as TransactionInput['tipo'] });
    expect(result.valido).toBe(false);
  });

  it('tipo em maiúsculas "SAIDA" → valido: false', () => {
    const result = validarTransacao({ ...validInput, tipo: 'SAIDA' as TransactionInput['tipo'] });
    expect(result.valido).toBe(false);
  });

  // Requisito 1.5: data com formato inválido
  it('data com separador "/" → valido: false', () => {
    const result = validarTransacao({ ...validInput, data: '2024/01/15' });
    expect(result.valido).toBe(false);
  });

  it('data com separador "." → valido: false', () => {
    const result = validarTransacao({ ...validInput, data: '2024.01.15' });
    expect(result.valido).toBe(false);
  });

  // Requisito 1.3 / descrição
  it('descrição só com espaços → valido: false', () => {
    const result = validarTransacao({ ...validInput, descricao: '   ' });
    expect(result.valido).toBe(false);
  });

  // carteira_origem vazia
  it('carteira_origem vazia → valido: false', () => {
    const result = validarTransacao({ ...validInput, carteira_origem: '' });
    expect(result.valido).toBe(false);
  });

  // input completamente válido
  it('input completamente válido → valido: true', () => {
    const result = validarTransacao(validInput);
    expect(result.valido).toBe(true);
  });
});

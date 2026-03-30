import { describe, it, expect } from 'vitest';
import { gerarOcorrenciasDoMes, atualizarRecorrencia } from './RecurrenceEngine';
import type { Transaction } from '../types/flowly';

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'base-id-1',
  descricao: 'Aluguel',
  valor: 1500,
  tipo: 'saida',
  data: '2024-01-15',
  fixo: true,
  carteira_origem: 'Banco do Brasil',
  ...overrides,
});

describe('gerarOcorrenciasDoMes', () => {
  // Requisito 4.2
  it('gera ocorrências para o mês corrente com datas corretas', () => {
    const transacoes = [
      makeTransaction({ id: 'id-1', data: '2024-01-10' }),
      makeTransaction({ id: 'id-2', data: '2024-01-20', tipo: 'entrada' }),
    ];

    const ocorrencias = gerarOcorrenciasDoMes(transacoes, '2024-03');

    expect(ocorrencias).toHaveLength(2);
    expect(ocorrencias[0].data).toBe('2024-03-10');
    expect(ocorrencias[1].data).toBe('2024-03-20');
  });

  // Requisito 4.2 — edge case: dia 31 em fevereiro
  it('usa o último dia do mês quando o dia original não existe no mês alvo (ex: 31 → fev 28)', () => {
    const transacoes = [makeTransaction({ id: 'id-1', data: '2024-01-31' })];

    const ocorrencias = gerarOcorrenciasDoMes(transacoes, '2024-02');

    expect(ocorrencias).toHaveLength(1);
    expect(ocorrencias[0].data).toBe('2024-02-29'); // 2024 é bissexto
  });

  it('usa o último dia do mês em ano não-bissexto (ex: 31 → fev 28)', () => {
    const transacoes = [makeTransaction({ id: 'id-1', data: '2023-01-31' })];

    const ocorrencias = gerarOcorrenciasDoMes(transacoes, '2023-02');

    expect(ocorrencias[0].data).toBe('2023-02-28');
  });

  // Requisito 4.2 — array vazio
  it('retorna array vazio quando não há transações fixas', () => {
    const ocorrencias = gerarOcorrenciasDoMes([], '2024-03');
    expect(ocorrencias).toHaveLength(0);
  });

  // Requisito 4.2 — ignora transações não-fixas
  it('ignora transações com fixo: false', () => {
    const transacoes = [
      makeTransaction({ id: 'id-1', fixo: false }),
      makeTransaction({ id: 'id-2', fixo: true }),
    ];

    const ocorrencias = gerarOcorrenciasDoMes(transacoes, '2024-03');

    expect(ocorrencias).toHaveLength(1);
    expect(ocorrencias[0].recorrencia_id).toBe('id-2');
  });

  it('gera novos ids diferentes do id base', () => {
    const transacoes = [makeTransaction({ id: 'base-id' })];
    const ocorrencias = gerarOcorrenciasDoMes(transacoes, '2024-03');

    expect(ocorrencias[0].id).not.toBe('base-id');
  });

  it('preserva recorrencia_id existente ou usa o id da transação base', () => {
    const comRecorrenciaId = makeTransaction({ id: 'occ-id', recorrencia_id: 'original-base' });
    const semRecorrenciaId = makeTransaction({ id: 'base-id', recorrencia_id: undefined });

    const [r1] = gerarOcorrenciasDoMes([comRecorrenciaId], '2024-03');
    const [r2] = gerarOcorrenciasDoMes([semRecorrenciaId], '2024-03');

    expect(r1.recorrencia_id).toBe('original-base');
    expect(r2.recorrencia_id).toBe('base-id');
  });
});

describe('atualizarRecorrencia', () => {
  const base = makeTransaction({ id: 'base-id', valor: 1500 });

  // Requisito 4.3
  it('apenasAtual: true — retorna array com uma única transação com o mesmo id', () => {
    const resultado = atualizarRecorrencia(base, 2000, true);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe('base-id');
    expect(resultado[0].valor).toBe(2000);
  });

  // Requisito 4.4
  it('apenasAtual: false — retorna a transação base atualizada com novo valor', () => {
    const resultado = atualizarRecorrencia(base, 2500, false);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe('base-id');
    expect(resultado[0].valor).toBe(2500);
  });

  it('apenasAtual: false — mantém todos os outros campos da transação base', () => {
    const resultado = atualizarRecorrencia(base, 999, false);

    expect(resultado[0].descricao).toBe(base.descricao);
    expect(resultado[0].tipo).toBe(base.tipo);
    expect(resultado[0].data).toBe(base.data);
    expect(resultado[0].fixo).toBe(base.fixo);
    expect(resultado[0].carteira_origem).toBe(base.carteira_origem);
  });
});

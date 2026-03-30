import { describe, it, expect, beforeEach } from 'vitest';
import { MockFlowlyRepository } from './MockFlowlyRepository';
import { TransactionInput } from '../types/flowly';

const transacaoBase: TransactionInput = {
  descricao: 'Teste',
  valor: 100,
  tipo: 'entrada',
  data: '2025-06-01',
  fixo: false,
  carteira_origem: 'Carteira Teste',
};

describe('MockFlowlyRepository', () => {
  let repo: MockFlowlyRepository;

  beforeEach(() => {
    repo = new MockFlowlyRepository();
  });

  // ─── adicionarTransacao ───────────────────────────────────────────────────

  it('adicionarTransacao: adiciona transação e ela aparece em listarTransacoes', async () => {
    const nova = await repo.adicionarTransacao(transacaoBase);

    expect(nova.id).toBeDefined();
    expect(nova.descricao).toBe('Teste');

    const lista = await repo.listarTransacoes();
    const encontrada = lista.find((t) => t.id === nova.id);
    expect(encontrada).toBeDefined();
    expect(encontrada?.valor).toBe(100);
  });

  // ─── removerTransacao ─────────────────────────────────────────────────────

  it('removerTransacao: remove transação e ela não aparece mais em listarTransacoes', async () => {
    const nova = await repo.adicionarTransacao(transacaoBase);

    await repo.removerTransacao(nova.id);

    const lista = await repo.listarTransacoes();
    const encontrada = lista.find((t) => t.id === nova.id);
    expect(encontrada).toBeUndefined();
  });

  it('removerTransacao: lança erro ao tentar remover id inexistente', async () => {
    await expect(repo.removerTransacao('id-inexistente')).rejects.toThrow();
  });

  // ─── atualizarTransacao ───────────────────────────────────────────────────

  it('atualizarTransacao: atualiza campo e a mudança é refletida em listarTransacoes', async () => {
    const nova = await repo.adicionarTransacao(transacaoBase);

    await repo.atualizarTransacao(nova.id, { descricao: 'Atualizado', valor: 250 });

    const lista = await repo.listarTransacoes();
    const atualizada = lista.find((t) => t.id === nova.id);
    expect(atualizada?.descricao).toBe('Atualizado');
    expect(atualizada?.valor).toBe(250);
  });

  it('atualizarTransacao: lança erro ao tentar atualizar id inexistente', async () => {
    await expect(
      repo.atualizarTransacao('id-inexistente', { descricao: 'X' })
    ).rejects.toThrow();
  });

  // ─── adicionarCarteira com nome duplicado ─────────────────────────────────

  it('adicionarCarteira: lança erro "Já existe uma carteira com esse nome." para nome duplicado', async () => {
    await repo.adicionarCarteira('Nova Carteira');

    await expect(repo.adicionarCarteira('Nova Carteira')).rejects.toThrow(
      'Já existe uma carteira com esse nome.'
    );
  });

  it('adicionarCarteira: comparação de nome duplicado é case-insensitive', async () => {
    await repo.adicionarCarteira('Poupança');

    await expect(repo.adicionarCarteira('poupança')).rejects.toThrow(
      'Já existe uma carteira com esse nome.'
    );
  });

  // ─── obterSaldoPorCarteira ────────────────────────────────────────────────

  it('obterSaldoPorCarteira: retorna 0 para carteira sem transações', async () => {
    await repo.adicionarCarteira('Carteira Vazia');

    const saldo = await repo.obterSaldoPorCarteira('Carteira Vazia');
    expect(saldo).toBe(0);
  });

  it('obterSaldoPorCarteira: retorna saldo correto com transações conhecidas', async () => {
    const carteira = 'Carteira Calculada';
    await repo.adicionarCarteira(carteira);

    await repo.adicionarTransacao({ ...transacaoBase, valor: 500, tipo: 'entrada', carteira_origem: carteira });
    await repo.adicionarTransacao({ ...transacaoBase, valor: 200, tipo: 'saida', carteira_origem: carteira });
    await repo.adicionarTransacao({ ...transacaoBase, valor: 100, tipo: 'entrada', carteira_origem: carteira });

    // saldo esperado: 500 + 100 - 200 = 400
    const saldo = await repo.obterSaldoPorCarteira(carteira);
    expect(saldo).toBe(400);
  });

  it('obterSaldoPorCarteira: retorna 0 para carteira inexistente (sem transações associadas)', async () => {
    const saldo = await repo.obterSaldoPorCarteira('Carteira Que Não Existe');
    expect(saldo).toBe(0);
  });
});

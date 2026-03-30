import { describe, it, expect, beforeEach } from 'vitest';
import { MockFlowlyRepository } from './MockFlowlyRepository';
import { TransactionInput } from '../types/flowly';

const USER_ID = 'user-test-123';

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
    const nova = await repo.adicionarTransacao(USER_ID, transacaoBase);

    expect(nova.id).toBeDefined();
    expect(nova.descricao).toBe('Teste');

    const lista = await repo.listarTransacoes(USER_ID);
    const encontrada = lista.find((t) => t.id === nova.id);
    expect(encontrada).toBeDefined();
    expect(encontrada?.valor).toBe(100);
  });

  // ─── removerTransacao ─────────────────────────────────────────────────────

  it('removerTransacao: remove transação e ela não aparece mais em listarTransacoes', async () => {
    const nova = await repo.adicionarTransacao(USER_ID, transacaoBase);

    await repo.removerTransacao(USER_ID, nova.id);

    const lista = await repo.listarTransacoes(USER_ID);
    const encontrada = lista.find((t) => t.id === nova.id);
    expect(encontrada).toBeUndefined();
  });

  it('removerTransacao: lança erro ao tentar remover id inexistente', async () => {
    await expect(repo.removerTransacao(USER_ID, 'id-inexistente')).rejects.toThrow();
  });

  // ─── atualizarTransacao ───────────────────────────────────────────────────

  it('atualizarTransacao: atualiza campo e a mudança é refletida em listarTransacoes', async () => {
    const nova = await repo.adicionarTransacao(USER_ID, transacaoBase);

    await repo.atualizarTransacao(USER_ID, nova.id, { descricao: 'Atualizado', valor: 250 });

    const lista = await repo.listarTransacoes(USER_ID);
    const atualizada = lista.find((t) => t.id === nova.id);
    expect(atualizada?.descricao).toBe('Atualizado');
    expect(atualizada?.valor).toBe(250);
  });

  it('atualizarTransacao: lança erro ao tentar atualizar id inexistente', async () => {
    await expect(
      repo.atualizarTransacao(USER_ID, 'id-inexistente', { descricao: 'X' })
    ).rejects.toThrow();
  });

  // ─── adicionarCarteira com nome duplicado ─────────────────────────────────

  it('adicionarCarteira: lança erro "Já existe uma carteira com esse nome." para nome duplicado', async () => {
    await repo.adicionarCarteira(USER_ID, 'Nova Carteira');

    await expect(repo.adicionarCarteira(USER_ID, 'Nova Carteira')).rejects.toThrow(
      'Já existe uma carteira com esse nome.'
    );
  });

  it('adicionarCarteira: comparação de nome duplicado é case-insensitive', async () => {
    await repo.adicionarCarteira(USER_ID, 'Poupança');

    await expect(repo.adicionarCarteira(USER_ID, 'poupança')).rejects.toThrow(
      'Já existe uma carteira com esse nome.'
    );
  });

  // ─── obterSaldoPorCarteira ────────────────────────────────────────────────

  it('obterSaldoPorCarteira: retorna 0 para carteira sem transações', async () => {
    await repo.adicionarCarteira(USER_ID, 'Carteira Vazia');

    const saldo = await repo.obterSaldoPorCarteira(USER_ID, 'Carteira Vazia');
    expect(saldo).toBe(0);
  });

  it('obterSaldoPorCarteira: retorna saldo correto com transações conhecidas', async () => {
    const carteira = 'Carteira Calculada';
    await repo.adicionarCarteira(USER_ID, carteira);

    await repo.adicionarTransacao(USER_ID, { ...transacaoBase, valor: 500, tipo: 'entrada', carteira_origem: carteira });
    await repo.adicionarTransacao(USER_ID, { ...transacaoBase, valor: 200, tipo: 'saida', carteira_origem: carteira });
    await repo.adicionarTransacao(USER_ID, { ...transacaoBase, valor: 100, tipo: 'entrada', carteira_origem: carteira });

    // saldo esperado: 500 + 100 - 200 = 400
    const saldo = await repo.obterSaldoPorCarteira(USER_ID, carteira);
    expect(saldo).toBe(400);
  });

  it('obterSaldoPorCarteira: retorna 0 para carteira inexistente (sem transações associadas)', async () => {
    const saldo = await repo.obterSaldoPorCarteira(USER_ID, 'Carteira Que Não Existe');
    expect(saldo).toBe(0);
  });

  // ─── isolamento de dados ──────────────────────────────────────────────────

  it('isolamento: transações de um usuário não aparecem para outro', async () => {
    const userA = 'user-a';
    const userB = 'user-b';

    await repo.adicionarTransacao(userA, transacaoBase);

    const listaB = await repo.listarTransacoes(userB);
    expect(listaB).toHaveLength(0);
  });

  // ─── rejeição de userId vazio ─────────────────────────────────────────────

  it('listarTransacoes: rejeita userId vazio', async () => {
    await expect(repo.listarTransacoes('')).rejects.toThrow('não autenticado');
  });

  it('adicionarTransacao: rejeita userId vazio', async () => {
    await expect(repo.adicionarTransacao('', transacaoBase)).rejects.toThrow('não autenticado');
  });
});

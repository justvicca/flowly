import { renderHook, act, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useFlowly } from './useFlowly';
import { MockFlowlyRepository } from '../repository/MockFlowlyRepository';
import { RepositoryContext } from '../repository/RepositoryContext';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWrapper(repo: MockFlowlyRepository) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(RepositoryContext.Provider, { value: repo }, children);
  };
}

// Empty repository — no seed data, clean state
function makeEmptyRepo(): MockFlowlyRepository {
  const repo = new MockFlowlyRepository();
  // Clear seed transactions by replacing internal state via the public API
  // We'll use a fresh instance and drain it via removerTransacao after listing
  return repo;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useFlowly', () => {
  let repo: MockFlowlyRepository;

  beforeEach(async () => {
    repo = new MockFlowlyRepository();
    // Remove all seed transactions so tests start from a known empty state
    const seed = await repo.listarTransacoes();
    for (const t of seed) {
      await repo.removerTransacao(t.id);
    }
  });

  // -------------------------------------------------------------------------
  // 3.2 — Adicionar transação válida
  // -------------------------------------------------------------------------

  it('adicionar transação válida: estado é atualizado com a nova transação', async () => {
    const wrapper = makeWrapper(repo);
    const { result } = renderHook(() => useFlowly(), { wrapper });

    // Wait for initialization
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.adicionarTransacao({
        descricao: 'Salário',
        valor: 3000,
        tipo: 'entrada',
        data: '2025-06-01',
        fixo: false,
        carteira_origem: 'Banco do Brasil',
      });
    });

    expect(result.current.erro).toBeNull();
    expect(result.current.transacoes).toHaveLength(1);
    expect(result.current.transacoes[0].descricao).toBe('Salário');
    expect(result.current.transacoes[0].valor).toBe(3000);
  });

  // -------------------------------------------------------------------------
  // 3.2 — Adicionar transação inválida (valor = 0)
  // -------------------------------------------------------------------------

  it('adicionar transação inválida (valor = 0): erro é definido e transação não é adicionada', async () => {
    const wrapper = makeWrapper(repo);
    const { result } = renderHook(() => useFlowly(), { wrapper });

    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.adicionarTransacao({
        descricao: 'Inválida',
        valor: 0,
        tipo: 'entrada',
        data: '2025-06-01',
        fixo: false,
        carteira_origem: 'Banco do Brasil',
      });
    });

    expect(result.current.erro).not.toBeNull();
    expect(result.current.transacoes).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // 3.3 — copiarTransacao: retorna TransactionInput com data de hoje
  // -------------------------------------------------------------------------

  it('copiarTransacao: retorna TransactionInput com a data atual', async () => {
    const wrapper = makeWrapper(repo);
    const { result } = renderHook(() => useFlowly(), { wrapper });

    await waitFor(() => expect(result.current.carregando).toBe(false));

    // Add a transaction first
    await act(async () => {
      await result.current.adicionarTransacao({
        descricao: 'Freelance',
        valor: 500,
        tipo: 'entrada',
        data: '2024-01-15',
        fixo: false,
        carteira_origem: 'Dinheiro na Mão',
      });
    });

    const transacao = result.current.transacoes[0];
    const hoje = new Date();
    const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

    let copia: ReturnType<typeof result.current.copiarTransacao> | undefined;
    act(() => {
      copia = result.current.copiarTransacao(transacao.id);
    });

    expect(copia).toBeDefined();
    expect(copia!.data).toBe(dataHoje);
    expect(copia!.descricao).toBe('Freelance');
    expect(copia!.valor).toBe(500);
    // id should not be present in TransactionInput
    expect((copia as Record<string, unknown>).id).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // 3.4 — duplicarTransacao: cria nova transação com mesmo dado e novo id
  // -------------------------------------------------------------------------

  it('duplicarTransacao: cria nova transação com os mesmos dados e um novo id', async () => {
    const wrapper = makeWrapper(repo);
    const { result } = renderHook(() => useFlowly(), { wrapper });

    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.adicionarTransacao({
        descricao: 'Aluguel',
        valor: 1200,
        tipo: 'saida',
        data: '2025-05-10',
        fixo: false,
        carteira_origem: 'Banco do Brasil',
      });
    });

    const original = result.current.transacoes[0];

    await act(async () => {
      await result.current.duplicarTransacao(original.id);
    });

    expect(result.current.transacoes).toHaveLength(2);
    const duplicata = result.current.transacoes.find((t) => t.id !== original.id);
    expect(duplicata).toBeDefined();
    expect(duplicata!.descricao).toBe('Aluguel');
    expect(duplicata!.valor).toBe(1200);
    expect(duplicata!.id).not.toBe(original.id);
  });

  // -------------------------------------------------------------------------
  // 3.5 — moverTransacao: atualiza carteira_origem
  // -------------------------------------------------------------------------

  it('moverTransacao: atualiza carteira_origem da transação', async () => {
    const wrapper = makeWrapper(repo);
    const { result } = renderHook(() => useFlowly(), { wrapper });

    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.adicionarTransacao({
        descricao: 'Compra',
        valor: 200,
        tipo: 'saida',
        data: '2025-05-20',
        fixo: false,
        carteira_origem: 'Banco do Brasil',
      });
    });

    const transacao = result.current.transacoes[0];

    await act(async () => {
      await result.current.moverTransacao(transacao.id, 'Dinheiro na Mão');
    });

    const atualizada = result.current.transacoes.find((t) => t.id === transacao.id);
    expect(atualizada).toBeDefined();
    expect(atualizada!.carteira_origem).toBe('Dinheiro na Mão');
  });

  // -------------------------------------------------------------------------
  // 3.6 / 3.7 — removerTransacao: remove a transação do estado
  // -------------------------------------------------------------------------

  it('removerTransacao: remove a transação do estado', async () => {
    const wrapper = makeWrapper(repo);
    const { result } = renderHook(() => useFlowly(), { wrapper });

    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.adicionarTransacao({
        descricao: 'Mercado',
        valor: 350,
        tipo: 'saida',
        data: '2025-05-25',
        fixo: false,
        carteira_origem: 'Banco do Brasil',
      });
    });

    expect(result.current.transacoes).toHaveLength(1);
    const id = result.current.transacoes[0].id;

    await act(async () => {
      await result.current.removerTransacao(id);
    });

    expect(result.current.transacoes).toHaveLength(0);
    expect(result.current.erro).toBeNull();
  });
});

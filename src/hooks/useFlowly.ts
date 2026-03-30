import { useCallback, useEffect, useReducer } from 'react';
import { gerarOcorrenciasDoMes } from '../engine/RecurrenceEngine';
import { validarTransacao } from '../engine/TransactionValidator';
import { useRepository } from '../repository/RepositoryContext';
import type { FlowlyState, Transaction, TransactionInput } from '../types/flowly';

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TRANSACOES'; payload: Transaction[] }
  | { type: 'SET_CARTEIRAS'; payload: { nome: string; saldo: number }[] };

const initialState: FlowlyState = {
  transacoes: [],
  carteiras: [],
  carregando: false,
  erro: null,
  sincronizando: false,
};

function reducer(state: FlowlyState, action: Action): FlowlyState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, carregando: action.payload };
    case 'SET_ERROR':
      return { ...state, erro: action.payload };
    case 'SET_TRANSACOES':
      return { ...state, transacoes: action.payload };
    case 'SET_CARTEIRAS':
      return { ...state, carteiras: action.payload };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFlowly() {
  const repo = useRepository();
  const [state, dispatch] = useReducer(reducer, initialState);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const recarregarTransacoes = useCallback(async () => {
    const transacoes = await repo.listarTransacoes();
    dispatch({ type: 'SET_TRANSACOES', payload: transacoes });
    return transacoes;
  }, [repo]);

  const recarregarCarteiras = useCallback(async () => {
    const carteiras = await repo.listarCarteiras();
    dispatch({ type: 'SET_CARTEIRAS', payload: carteiras });
  }, [repo]);

  // -------------------------------------------------------------------------
  // Inicialização
  // -------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function init() {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const [transacoes] = await Promise.all([
          repo.listarTransacoes(),
          repo.listarCarteiras(),
        ]);

        if (cancelled) return;

        // Gerar ocorrências do mês corrente para transações fixas
        const hoje = new Date();
        const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
        const fixas = transacoes.filter((t) => t.fixo);
        const ocorrencias = gerarOcorrenciasDoMes(fixas, mesAtual);

        // Adicionar apenas as ocorrências que ainda não existem no mês
        const idsRecorrenciaExistentes = new Set(
          transacoes
            .filter((t) => t.recorrencia_id && t.data.startsWith(mesAtual))
            .map((t) => t.recorrencia_id)
        );

        const novas = ocorrencias.filter(
          (o) => !idsRecorrenciaExistentes.has(o.recorrencia_id)
        );

        for (const ocorrencia of novas) {
          const { id: _id, ...input } = ocorrencia;
          await repo.adicionarTransacao(input);
        }

        // Recarregar estado final
        const [transacoesAtualizadas, carteirasAtualizadas] = await Promise.all([
          repo.listarTransacoes(),
          repo.listarCarteiras(),
        ]);

        if (cancelled) return;

        dispatch({ type: 'SET_TRANSACOES', payload: transacoesAtualizadas });
        dispatch({ type: 'SET_CARTEIRAS', payload: carteirasAtualizadas });
      } catch (err) {
        if (!cancelled) {
          dispatch({ type: 'SET_ERROR', payload: (err as Error).message });
        }
      } finally {
        if (!cancelled) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, [repo]);

  // -------------------------------------------------------------------------
  // Ações de transação
  // -------------------------------------------------------------------------

  const adicionarTransacao = useCallback(
    async (dados: TransactionInput): Promise<void> => {
      const resultado = validarTransacao(dados);
      if (!resultado.valido) {
        dispatch({ type: 'SET_ERROR', payload: resultado.erro });
        return;
      }

      dispatch({ type: 'SET_ERROR', payload: null });
      try {
        await repo.adicionarTransacao(dados);
        await Promise.all([recarregarTransacoes(), recarregarCarteiras()]);
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: (err as Error).message });
      }
    },
    [repo, recarregarTransacoes, recarregarCarteiras]
  );

  const copiarTransacao = useCallback(
    (id: string): TransactionInput => {
      const transacao = state.transacoes.find((t) => t.id === id);
      if (!transacao) {
        throw new Error(`Transação com id "${id}" não encontrada.`);
      }

      const hoje = new Date();
      const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

      const { id: _id, timestamp: _ts, ...input } = transacao;
      return { ...input, data: dataHoje };
    },
    [state.transacoes]
  );

  const duplicarTransacao = useCallback(
    async (id: string): Promise<void> => {
      const transacao = state.transacoes.find((t) => t.id === id);
      if (!transacao) {
        dispatch({ type: 'SET_ERROR', payload: `Transação com id "${id}" não encontrada.` });
        return;
      }

      const { id: _id, timestamp: _ts, ...input } = transacao;
      await adicionarTransacao(input);
    },
    [state.transacoes, adicionarTransacao]
  );

  const moverTransacao = useCallback(
    async (id: string, novaCarteira: string): Promise<void> => {
      try {
        await repo.atualizarTransacao(id, { carteira_origem: novaCarteira });
        await Promise.all([recarregarTransacoes(), recarregarCarteiras()]);
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: (err as Error).message });
      }
    },
    [repo, recarregarTransacoes, recarregarCarteiras]
  );

  const removerTransacao = useCallback(
    async (id: string): Promise<void> => {
      try {
        await repo.removerTransacao(id);
        await Promise.all([recarregarTransacoes(), recarregarCarteiras()]);
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: (err as Error).message });
      }
    },
    [repo, recarregarTransacoes, recarregarCarteiras]
  );

  // -------------------------------------------------------------------------
  // Ações de carteira
  // -------------------------------------------------------------------------

  const adicionarCarteira = useCallback(
    async (nome: string): Promise<void> => {
      try {
        await repo.adicionarCarteira(nome);
        await recarregarCarteiras();
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: (err as Error).message });
      }
    },
    [repo, recarregarCarteiras]
  );

  // -------------------------------------------------------------------------
  // Utilitários
  // -------------------------------------------------------------------------

  const obterSaldoTotal = useCallback((): number => {
    return state.carteiras.reduce((acc, c) => acc + c.saldo, 0);
  }, [state.carteiras]);

  // -------------------------------------------------------------------------
  // Retorno
  // -------------------------------------------------------------------------

  return {
    // Estado
    transacoes: state.transacoes,
    carteiras: state.carteiras,
    carregando: state.carregando,
    erro: state.erro,

    // Ações de transação
    adicionarTransacao,
    copiarTransacao,
    duplicarTransacao,
    moverTransacao,
    removerTransacao,

    // Ações de carteira
    adicionarCarteira,

    // Utilitários
    obterSaldoTotal,
  };
}

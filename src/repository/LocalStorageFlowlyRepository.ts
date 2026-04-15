import type { Transaction, TransactionFilter, Wallet } from '../types/flowly';
import type { IFlowlyRepository } from './IFlowlyRepository';

function assertUserId(userId: string | null | undefined): void {
  if (!userId) throw new Error('Operação não autorizada: usuário não autenticado.');
}

function keyTransacoes(userId: string) {
  return `flowly:transacoes:${userId}`;
}

function keyCarteiras(userId: string) {
  return `flowly:carteiras:${userId}`;
}

function loadTransacoes(userId: string): Transaction[] {
  try {
    const raw = localStorage.getItem(keyTransacoes(userId));
    return raw ? (JSON.parse(raw) as Transaction[]) : [];
  } catch {
    return [];
  }
}

function saveTransacoes(userId: string, lista: Transaction[]): void {
  localStorage.setItem(keyTransacoes(userId), JSON.stringify(lista));
}

function loadCarteiras(userId: string): Wallet[] {
  try {
    const raw = localStorage.getItem(keyCarteiras(userId));
    return raw ? (JSON.parse(raw) as Wallet[]) : [];
  } catch {
    return [];
  }
}

function saveCarteiras(userId: string, lista: Wallet[]): void {
  localStorage.setItem(keyCarteiras(userId), JSON.stringify(lista));
}

export class LocalStorageFlowlyRepository implements IFlowlyRepository {
  async listarTransacoes(userId: string, filtros?: TransactionFilter): Promise<Transaction[]> {
    assertUserId(userId);
    let lista = loadTransacoes(userId);

    if (filtros?.carteira) lista = lista.filter((t) => t.carteira_origem === filtros.carteira);
    if (filtros?.tipo) lista = lista.filter((t) => t.tipo === filtros.tipo);
    if (filtros?.dataInicio) lista = lista.filter((t) => t.data >= filtros.dataInicio!);
    if (filtros?.dataFim) lista = lista.filter((t) => t.data <= filtros.dataFim!);

    return lista;
  }

  async adicionarTransacao(userId: string, transacao: Omit<Transaction, 'id'>): Promise<Transaction> {
    assertUserId(userId);
    const lista = loadTransacoes(userId);
    const nova: Transaction = { ...transacao, id: crypto.randomUUID(), timestamp: Date.now() };
    lista.push(nova);
    saveTransacoes(userId, lista);
    return nova;
  }

  async atualizarTransacao(userId: string, id: string, dados: Partial<Transaction>): Promise<Transaction> {
    assertUserId(userId);
    const lista = loadTransacoes(userId);
    const idx = lista.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Transação "${id}" não encontrada.`);
    lista[idx] = { ...lista[idx], ...dados, id };
    saveTransacoes(userId, lista);
    return lista[idx];
  }

  async removerTransacao(userId: string, id: string): Promise<void> {
    assertUserId(userId);
    const lista = loadTransacoes(userId);
    const idx = lista.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Transação "${id}" não encontrada.`);
    lista.splice(idx, 1);
    saveTransacoes(userId, lista);
  }

  async listarCarteiras(userId: string): Promise<Wallet[]> {
    assertUserId(userId);
    const carteiras = loadCarteiras(userId);
    return Promise.all(
      carteiras.map(async (c) => ({
        nome: c.nome,
        moeda: c.moeda ?? 'BRL',
        saldo: await this.obterSaldoPorCarteira(userId, c.nome),
      }))
    );
  }

  async adicionarCarteira(userId: string, nome: string, moeda?: string): Promise<Wallet> {
    assertUserId(userId);
    const lista = loadCarteiras(userId);
    if (lista.some((c) => c.nome.toLowerCase() === nome.toLowerCase())) {
      throw new Error('Já existe uma carteira com esse nome.');
    }
    const nova: Wallet = { nome, saldo: 0, moeda: moeda ?? 'BRL' };
    lista.push(nova);
    saveCarteiras(userId, lista);
    return nova;
  }

  async obterSaldoPorCarteira(userId: string, nomeCarteira: string): Promise<number> {
    assertUserId(userId);
    const transacoes = loadTransacoes(userId).filter((t) => t.carteira_origem === nomeCarteira);
    const entradas = transacoes.filter((t) => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0);
    const saidas = transacoes.filter((t) => t.tipo === 'saida').reduce((s, t) => s + t.valor, 0);
    return entradas - saidas;
  }
}

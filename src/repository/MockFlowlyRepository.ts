import { Transaction, TransactionFilter, Wallet } from '../types/flowly';
import { IFlowlyRepository } from './IFlowlyRepository';

function assertUserId(userId: string | null | undefined): void {
  if (!userId) {
    throw new Error('Operação não autorizada: usuário não autenticado.');
  }
}

export class MockFlowlyRepository implements IFlowlyRepository {
  private transacoes: Map<string, Transaction[]> = new Map();
  private carteiras: Map<string, Wallet[]> = new Map();

  private getTransacoes(userId: string): Transaction[] {
    if (!this.transacoes.has(userId)) {
      this.transacoes.set(userId, []);
    }
    return this.transacoes.get(userId)!;
  }

  private getCarteiras(userId: string): Wallet[] {
    if (!this.carteiras.has(userId)) {
      this.carteiras.set(userId, []);
    }
    return this.carteiras.get(userId)!;
  }

  async listarTransacoes(userId: string, filtros?: TransactionFilter): Promise<Transaction[]> {
    assertUserId(userId);
    let resultado = [...this.getTransacoes(userId)];

    if (filtros?.carteira) {
      resultado = resultado.filter((t) => t.carteira_origem === filtros.carteira);
    }
    if (filtros?.tipo) {
      resultado = resultado.filter((t) => t.tipo === filtros.tipo);
    }
    if (filtros?.dataInicio) {
      resultado = resultado.filter((t) => t.data >= filtros.dataInicio!);
    }
    if (filtros?.dataFim) {
      resultado = resultado.filter((t) => t.data <= filtros.dataFim!);
    }

    return resultado;
  }

  async adicionarTransacao(userId: string, transacao: Omit<Transaction, 'id'>): Promise<Transaction> {
    assertUserId(userId);
    const nova: Transaction = {
      ...transacao,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    this.getTransacoes(userId).push(nova);
    return nova;
  }

  async atualizarTransacao(userId: string, id: string, dados: Partial<Transaction>): Promise<Transaction> {
    assertUserId(userId);
    const lista = this.getTransacoes(userId);
    const index = lista.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Transação com id "${id}" não encontrada.`);
    }
    lista[index] = { ...lista[index], ...dados, id };
    return lista[index];
  }

  async removerTransacao(userId: string, id: string): Promise<void> {
    assertUserId(userId);
    const lista = this.getTransacoes(userId);
    const index = lista.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Transação com id "${id}" não encontrada.`);
    }
    lista.splice(index, 1);
  }

  async listarCarteiras(userId: string): Promise<Wallet[]> {
    assertUserId(userId);
    const carteiras = this.getCarteiras(userId);
    const carteirasComSaldo = await Promise.all(
      carteiras.map(async (c) => ({
        nome: c.nome,
        saldo: await this.obterSaldoPorCarteira(userId, c.nome),
      }))
    );
    return carteirasComSaldo;
  }

  async adicionarCarteira(userId: string, nome: string): Promise<Wallet> {
    assertUserId(userId);
    const carteiras = this.getCarteiras(userId);
    const existe = carteiras.some(
      (c) => c.nome.toLowerCase() === nome.toLowerCase()
    );
    if (existe) {
      throw new Error('Já existe uma carteira com esse nome.');
    }
    const nova: Wallet = { nome, saldo: 0 };
    carteiras.push(nova);
    return nova;
  }

  async obterSaldoPorCarteira(userId: string, nomeCarteira: string): Promise<number> {
    assertUserId(userId);
    const transacoesDaCarteira = this.getTransacoes(userId).filter(
      (t) => t.carteira_origem === nomeCarteira
    );
    const entradas = transacoesDaCarteira
      .filter((t) => t.tipo === 'entrada')
      .reduce((acc, t) => acc + t.valor, 0);
    const saidas = transacoesDaCarteira
      .filter((t) => t.tipo === 'saida')
      .reduce((acc, t) => acc + t.valor, 0);
    return entradas - saidas;
  }
}

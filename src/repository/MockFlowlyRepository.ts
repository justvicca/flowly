import { Transaction, TransactionFilter, Wallet } from '../types/flowly';
import { IFlowlyRepository } from './IFlowlyRepository';

const SEED_TRANSACTIONS: Omit<Transaction, 'id'>[] = [
  {
    descricao: 'Salário',
    valor: 5000,
    tipo: 'entrada',
    data: '2025-01-05',
    fixo: true,
    carteira_origem: 'Banco do Brasil',
    recorrencia_id: 'rec-salario',
    timestamp: Date.now(),
  },
  {
    descricao: 'Aluguel',
    valor: 1500,
    tipo: 'saida',
    data: '2025-01-10',
    fixo: true,
    carteira_origem: 'Banco do Brasil',
    recorrencia_id: 'rec-aluguel',
    timestamp: Date.now(),
  },
  {
    descricao: 'Supermercado',
    valor: 350,
    tipo: 'saida',
    data: '2025-01-15',
    fixo: false,
    carteira_origem: 'Banco do Brasil',
    timestamp: Date.now(),
  },
  {
    descricao: 'Freelance design',
    valor: 800,
    tipo: 'entrada',
    data: '2025-01-20',
    fixo: false,
    carteira_origem: 'Dinheiro na Mão',
    timestamp: Date.now(),
  },
  {
    descricao: 'Farmácia',
    valor: 120,
    tipo: 'saida',
    data: '2025-01-22',
    fixo: false,
    carteira_origem: 'Dinheiro na Mão',
    timestamp: Date.now(),
  },
  {
    descricao: 'Conta de luz',
    valor: 180,
    tipo: 'saida',
    data: '2025-01-25',
    fixo: true,
    carteira_origem: 'Banco do Brasil',
    recorrencia_id: 'rec-luz',
    timestamp: Date.now(),
  },
];

export class MockFlowlyRepository implements IFlowlyRepository {
  private transacoes: Transaction[];
  private carteiras: Wallet[];

  constructor() {
    this.transacoes = SEED_TRANSACTIONS.map((t) => ({
      ...t,
      id: crypto.randomUUID(),
    }));

    this.carteiras = [
      { nome: 'Banco do Brasil', saldo: 0 },
      { nome: 'Dinheiro na Mão', saldo: 0 },
    ];
  }

  async listarTransacoes(filtros?: TransactionFilter): Promise<Transaction[]> {
    let resultado = [...this.transacoes];

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

  async adicionarTransacao(transacao: Omit<Transaction, 'id'>): Promise<Transaction> {
    const nova: Transaction = {
      ...transacao,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    this.transacoes.push(nova);
    return nova;
  }

  async atualizarTransacao(id: string, dados: Partial<Transaction>): Promise<Transaction> {
    const index = this.transacoes.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Transação com id "${id}" não encontrada.`);
    }
    this.transacoes[index] = { ...this.transacoes[index], ...dados, id };
    return this.transacoes[index];
  }

  async removerTransacao(id: string): Promise<void> {
    const index = this.transacoes.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Transação com id "${id}" não encontrada.`);
    }
    this.transacoes.splice(index, 1);
  }

  async listarCarteiras(): Promise<Wallet[]> {
    const carteirasComSaldo = await Promise.all(
      this.carteiras.map(async (c) => ({
        nome: c.nome,
        saldo: await this.obterSaldoPorCarteira(c.nome),
      }))
    );
    return carteirasComSaldo;
  }

  async adicionarCarteira(nome: string): Promise<Wallet> {
    const existe = this.carteiras.some(
      (c) => c.nome.toLowerCase() === nome.toLowerCase()
    );
    if (existe) {
      throw new Error('Já existe uma carteira com esse nome.');
    }
    const nova: Wallet = { nome, saldo: 0 };
    this.carteiras.push(nova);
    return nova;
  }

  async obterSaldoPorCarteira(nomeCarteira: string): Promise<number> {
    const transacoesDaCarteira = this.transacoes.filter(
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

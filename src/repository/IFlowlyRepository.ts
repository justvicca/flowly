import { Transaction, TransactionFilter, Wallet } from '../types/flowly';

export interface IFlowlyRepository {
  // Transações
  listarTransacoes(userId: string, filtros?: TransactionFilter): Promise<Transaction[]>;
  adicionarTransacao(userId: string, transacao: Omit<Transaction, 'id'>): Promise<Transaction>;
  atualizarTransacao(userId: string, id: string, dados: Partial<Transaction>): Promise<Transaction>;
  removerTransacao(userId: string, id: string): Promise<void>;

  // Carteiras
  listarCarteiras(userId: string): Promise<Wallet[]>;
  adicionarCarteira(userId: string, nome: string): Promise<Wallet>;
  obterSaldoPorCarteira(userId: string, nomeCarteira: string): Promise<number>;
}

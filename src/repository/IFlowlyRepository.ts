import { Transaction, TransactionFilter, Wallet } from '../types/flowly';

export interface IFlowlyRepository {
  // Transações
  listarTransacoes(filtros?: TransactionFilter): Promise<Transaction[]>;
  adicionarTransacao(transacao: Omit<Transaction, 'id'>): Promise<Transaction>;
  atualizarTransacao(id: string, dados: Partial<Transaction>): Promise<Transaction>;
  removerTransacao(id: string): Promise<void>;

  // Carteiras
  listarCarteiras(): Promise<Wallet[]>;
  adicionarCarteira(nome: string): Promise<Wallet>;
  obterSaldoPorCarteira(nomeCarteira: string): Promise<number>;
}

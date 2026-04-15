export interface Transaction {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  data: string;
  fixo: boolean;
  carteira_origem: string;
  recorrencia_id?: string;
  timestamp?: number;
}

export type TransactionInput = Omit<Transaction, 'id' | 'timestamp'>;

export interface Wallet {
  nome: string;
  saldo: number;
  moeda?: string; // ISO 4217 code, defaults to 'BRL' when absent
}

export type ValidationResult =
  | { valido: true }
  | { valido: false; erro: string };

export interface FlowlyState {
  transacoes: Transaction[];
  carteiras: Wallet[];
  carregando: boolean;
  erro: string | null;
  sincronizando: boolean;
}

export interface TransactionFilter {
  carteira?: string;
  tipo?: 'entrada' | 'saida';
  dataInicio?: string;
  dataFim?: string;
}

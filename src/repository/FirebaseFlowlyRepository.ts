import {
  getFirestore,
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { app } from '../firebase';
import type { Transaction, TransactionFilter, Wallet } from '../types/flowly';
import type { IFlowlyRepository } from './IFlowlyRepository';

const db = getFirestore(app);

function assertUserId(userId: string | null | undefined): void {
  if (!userId) throw new Error('Operação não autorizada: usuário não autenticado.');
}

export class FirebaseFlowlyRepository implements IFlowlyRepository {
  async listarTransacoes(userId: string, filtros?: TransactionFilter): Promise<Transaction[]> {
    assertUserId(userId);
    const ref = collection(db, 'users', userId, 'transacoes');
    const snap = await getDocs(ref);
    let lista = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));

    if (filtros?.carteira) lista = lista.filter((t) => t.carteira_origem === filtros.carteira);
    if (filtros?.tipo) lista = lista.filter((t) => t.tipo === filtros.tipo);
    if (filtros?.dataInicio) lista = lista.filter((t) => t.data >= filtros.dataInicio!);
    if (filtros?.dataFim) lista = lista.filter((t) => t.data <= filtros.dataFim!);

    return lista;
  }

  async adicionarTransacao(userId: string, transacao: Omit<Transaction, 'id'>): Promise<Transaction> {
    assertUserId(userId);
    const ref = collection(db, 'users', userId, 'transacoes');
    const docRef = await addDoc(ref, { ...transacao, timestamp: Date.now() });
    return { id: docRef.id, ...transacao, timestamp: Date.now() };
  }

  async atualizarTransacao(userId: string, id: string, dados: Partial<Transaction>): Promise<Transaction> {
    assertUserId(userId);
    const ref = doc(db, 'users', userId, 'transacoes', id);
    await updateDoc(ref, { ...dados } as Record<string, unknown>);
    const snap = await getDocs(collection(db, 'users', userId, 'transacoes'));
    const d = snap.docs.find((x) => x.id === id);
    if (!d) throw new Error(`Transação "${id}" não encontrada.`);
    return { id: d.id, ...d.data() } as Transaction;
  }

  async removerTransacao(userId: string, id: string): Promise<void> {
    assertUserId(userId);
    await deleteDoc(doc(db, 'users', userId, 'transacoes', id));
  }

  async listarCarteiras(userId: string): Promise<Wallet[]> {
    assertUserId(userId);
    const ref = collection(db, 'users', userId, 'carteiras');
    const snap = await getDocs(ref);
    const carteiras = snap.docs.map((d) => d.data().nome as string);

    return Promise.all(
      carteiras.map(async (nome) => ({
        nome,
        saldo: await this.obterSaldoPorCarteira(userId, nome),
      }))
    );
  }

  async adicionarCarteira(userId: string, nome: string): Promise<Wallet> {
    assertUserId(userId);
    const ref = collection(db, 'users', userId, 'carteiras');
    const snap = await getDocs(ref);
    const existe = snap.docs.some(
      (d) => (d.data().nome as string).toLowerCase() === nome.toLowerCase()
    );
    if (existe) throw new Error('Já existe uma carteira com esse nome.');
    await addDoc(ref, { nome });
    return { nome, saldo: 0 };
  }

  async obterSaldoPorCarteira(userId: string, nomeCarteira: string): Promise<number> {
    assertUserId(userId);
    const ref = collection(db, 'users', userId, 'transacoes');
    const snap = await getDocs(ref);
    const transacoes = snap.docs
      .map((d) => d.data() as Omit<Transaction, 'id'>)
      .filter((t) => t.carteira_origem === nomeCarteira);

    const entradas = transacoes.filter((t) => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0);
    const saidas = transacoes.filter((t) => t.tipo === 'saida').reduce((s, t) => s + t.valor, 0);
    return entradas - saidas;
  }
}

import { useState, useMemo } from 'react';
import type { Transaction } from '../../types/flowly';
import { ConfirmDialog } from '../ConfirmDialog';
import { TransactionItem } from './TransactionItem';

interface TransactionListProps {
  transacoes: Transaction[];
  carteiras: string[];
  onCopiar: (id: string) => void;
  onDuplicar: (id: string) => Promise<void>;
  onMover: (id: string, novaCarteira: string) => Promise<void>;
  onRemover: (id: string) => Promise<void>;
}

type Filtro = 'todos' | 'entrada' | 'saida' | 'fixo' | 'nao-fixo';

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'entrada', label: 'Ganhos' },
  { id: 'saida', label: 'Gastos' },
  { id: 'fixo', label: 'Fixos' },
  { id: 'nao-fixo', label: 'Não fixos' },
];

function nomeMes(mesStr: string): string {
  const [ano, mes] = mesStr.split('-');
  const data = new Date(Number(ano), Number(mes) - 1, 1);
  const mesNome = data.toLocaleString('pt-BR', { month: 'long' });
  return `${mesNome.charAt(0).toUpperCase()}${mesNome.slice(1)} ${ano}`;
}

function mesKey(data: string): string {
  return data.slice(0, 7); // "YYYY-MM"
}

function anoKey(data: string): string {
  return data.slice(0, 4); // "YYYY"
}

export function TransactionList({
  transacoes,
  carteiras,
  onCopiar,
  onDuplicar,
  onMover,
  onRemover,
}: TransactionListProps) {
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [busca, setBusca] = useState('');

  async function handleConfirmarRemocao() {
    if (!confirmandoId) return;
    const id = confirmandoId;
    setConfirmandoId(null);
    await onRemover(id);
    setMensagemSucesso(true);
    setTimeout(() => setMensagemSucesso(false), 3000);
  }

  // 1. Ordenar mais recentes primeiro
  // 2. Aplicar filtro de tipo/fixo
  // 3. Aplicar busca por descrição
  const transacoesFiltradas = useMemo(() => {
    return [...transacoes]
      .sort((a, b) => {
        // Mais novo primeiro: usa timestamp se disponível, senão data + id como desempate
        const tsA = a.timestamp ?? 0;
        const tsB = b.timestamp ?? 0;
        if (tsB !== tsA) return tsB - tsA;
        return b.data.localeCompare(a.data);
      })
      .filter((t) => {
        if (filtro === 'entrada') return t.tipo === 'entrada';
        if (filtro === 'saida') return t.tipo === 'saida';
        if (filtro === 'fixo') return t.fixo;
        if (filtro === 'nao-fixo') return !t.fixo;
        return true;
      })
      .filter((t) => {
        if (!busca.trim()) return true;
        return t.descricao.toLowerCase().includes(busca.trim().toLowerCase());
      });
  }, [transacoes, filtro, busca]);

  // Agrupar por mês (mês atual, mês passado, ...) e por ano passado (sem separação por mês)
  const grupos = useMemo(() => {
    const anoAtual = new Date().getFullYear().toString();

    const porMes: Map<string, Transaction[]> = new Map();
    const porAnoPassado: Map<string, Transaction[]> = new Map();

    for (const t of transacoesFiltradas) {
      const ano = anoKey(t.data);
      if (ano === anoAtual) {
        const mk = mesKey(t.data);
        if (!porMes.has(mk)) porMes.set(mk, []);
        porMes.get(mk)!.push(t);
      } else {
        if (!porAnoPassado.has(ano)) porAnoPassado.set(ano, []);
        porAnoPassado.get(ano)!.push(t);
      }
    }

    // Ordenar meses do mais recente para o mais antigo
    const mesesOrdenados = [...porMes.entries()].sort((a, b) => b[0].localeCompare(a[0]));
    const anosOrdenados = [...porAnoPassado.entries()].sort((a, b) => b[0].localeCompare(a[0]));

    return { mesesOrdenados, anosOrdenados };
  }, [transacoesFiltradas]);

  const btnFiltro = (id: Filtro): React.CSSProperties => ({
    padding: '6px 14px',
    border: '1px solid',
    borderColor: filtro === id ? 'var(--primary, #1565c0)' : 'var(--border, #ccc)',
    borderRadius: '20px',
    background: filtro === id ? 'var(--primary, #1565c0)' : 'var(--surface, #fff)',
    color: filtro === id ? 'var(--primary-text, #fff)' : 'var(--text2, #555)',
    fontSize: '13px',
    fontWeight: filtro === id ? 700 : 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  });

  const separadorStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text2, #757575)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    padding: '8px 0 4px',
    borderBottom: '1px solid var(--border, #e0e0e0)',
    marginBottom: '4px',
    marginTop: '12px',
  };

  const vazio = transacoesFiltradas.length === 0;

  return (
    <div>
      {/* Barra de pesquisa */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          placeholder="Pesquisar transações..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          aria-label="Pesquisar transações"
          style={{
            width: '100%',
            padding: '9px 12px 9px 38px',
            border: '1px solid var(--border, #ccc)',
            borderRadius: '6px',
            fontSize: '14px',
            boxSizing: 'border-box',
            outline: 'none',
            background: 'var(--surface, #fff)',
            color: 'var(--text, #333)',
          }}
        />
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {FILTROS.map((f) => (
          <button key={f.id} type="button" onClick={() => setFiltro(f.id)} style={btnFiltro(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Mensagem de sucesso após remoção */}
      {mensagemSucesso && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: '10px 16px',
            marginBottom: '16px',
            background: '#e8f5e9',
            border: '1px solid #a5d6a7',
            borderRadius: '4px',
            color: '#2e7d32',
            fontWeight: 500,
            fontSize: '14px',
          }}
        >
          Pronto! A transação foi removida.
        </div>
      )}

      {vazio && (
        <p style={{ color: '#757575', textAlign: 'center', padding: '24px 0' }}>
          Nenhuma transação encontrada.
        </p>
      )}

      {/* Grupos do ano atual — separados por mês */}
      {grupos.mesesOrdenados.map(([mk, lista]) => (
        <div key={mk}>
          <div style={separadorStyle}>{nomeMes(mk)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
            {lista.map((t) => (
              <TransactionItem
                key={t.id}
                transaction={t}
                carteiras={carteiras}
                onCopiar={onCopiar}
                onDuplicar={onDuplicar}
                onMover={onMover}
                onApagar={setConfirmandoId}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Grupos de anos anteriores — separados por ano, sem subdivisão por mês */}
      {grupos.anosOrdenados.map(([ano, lista]) => (
        <div key={ano}>
          <div style={separadorStyle}>{ano}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
            {lista.map((t) => (
              <TransactionItem
                key={t.id}
                transaction={t}
                carteiras={carteiras}
                onCopiar={onCopiar}
                onDuplicar={onDuplicar}
                onMover={onMover}
                onApagar={setConfirmandoId}
              />
            ))}
          </div>
        </div>
      ))}

      {confirmandoId && (
        <ConfirmDialog
          message="Tem certeza que deseja apagar esta transação? Esta ação não pode ser desfeita."
          onConfirm={handleConfirmarRemocao}
          onCancel={() => setConfirmandoId(null)}
        />
      )}
    </div>
  );
}

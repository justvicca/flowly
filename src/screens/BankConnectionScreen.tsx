import { useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRepository } from '../repository/RepositoryContext';

// ── Types ──────────────────────────────────────────────────────────────────

interface PluggyItem {
  id: string;
  connector: { name: string; primaryColor?: string };
  status: string;
  createdAt: string;
}

interface PluggyAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  currencyCode: string;
  itemId: string;
}

interface PluggyTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'DEBIT' | 'CREDIT';
  accountId: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function getConnectToken(): Promise<string> {
  const res = await fetch('/api/pluggy/connect-token', { method: 'POST' });
  const text = await res.text();
  if (!res.ok) throw new Error(`Erro ${res.status}: ${text}`);
  
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Resposta inválida da API: ${text}`);
  }
  
  if (data.error) throw new Error(String(data.error));
  
  // Pluggy pode retornar accessToken ou connectToken
  const token = (data.accessToken ?? data.connectToken) as string | undefined;
  if (!token) throw new Error(`Token não encontrado. Campos retornados: ${Object.keys(data).join(', ')}`);
  return token;
}

async function getAccounts(itemId: string): Promise<PluggyAccount[]> {
  const res = await fetch(`/api/pluggy/accounts?itemId=${itemId}`);
  const data = await res.json() as { results: PluggyAccount[] };
  return data.results ?? [];
}

async function getTransactions(accountId: string): Promise<PluggyTransaction[]> {
  const hoje = new Date();
  const from = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().split('T')[0];
  const to = hoje.toISOString().split('T')[0];
  const res = await fetch(`/api/pluggy/transactions?accountId=${accountId}&from=${from}&to=${to}`);
  const data = await res.json() as { results: PluggyTransaction[] };
  return data.results ?? [];
}

// ── Component ──────────────────────────────────────────────────────────────

export function BankConnectionScreen() {
  const { sessao } = useAuth();
  const repo = useRepository();
  const userId = sessao?.usuario.id ?? '';

  const [etapa, setEtapa] = useState<'inicio' | 'conectando' | 'importando' | 'concluido' | 'erro'>('inicio');
  const [mensagem, setMensagem] = useState('');
  const [importados, setImportados] = useState(0);

  // Carrega o widget do Pluggy
  const abrirWidget = useCallback(async () => {
    setEtapa('conectando');
    try {
      const accessToken = await getConnectToken();

      // Carrega o script do Pluggy Connect dinamicamente
      await new Promise<void>((resolve, reject) => {
        if (document.getElementById('pluggy-connect-script')) { resolve(); return; }
        const script = document.createElement('script');
        script.id = 'pluggy-connect-script';
        script.src = 'https://cdn.pluggy.ai/pluggy-connect/v2.1.0/pluggy-connect.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Falha ao carregar Pluggy Connect'));
        document.head.appendChild(script);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const PluggyConnect = (window as any).PluggyConnect;
      if (!PluggyConnect) throw new Error('PluggyConnect não disponível');

      const widget = new PluggyConnect({
        connectToken: accessToken,
        onSuccess: async (itemData: { item: PluggyItem }) => {
          setEtapa('importando');
          setMensagem('Buscando suas transações...');
          try {
            const accounts = await getAccounts(itemData.item.id);
            let total = 0;

            for (const account of accounts) {
              // Cria carteira no Flowly com o nome da conta bancária
              try {
                await repo.adicionarCarteira(userId, `${itemData.item.connector.name} - ${account.name}`);
              } catch {
                // Carteira já existe, tudo bem
              }

              const transactions = await getTransactions(account.id);
              for (const t of transactions) {
                const data = t.date.split('T')[0];
                await repo.adicionarTransacao(userId, {
                  descricao: t.description,
                  valor: Math.abs(t.amount),
                  tipo: t.type === 'CREDIT' ? 'entrada' : 'saida',
                  data,
                  fixo: false,
                  carteira_origem: `${itemData.item.connector.name} - ${account.name}`,
                });
                total++;
              }
            }

            setImportados(total);
            setEtapa('concluido');
          } catch (err) {
            setMensagem(err instanceof Error ? err.message : 'Erro ao importar transações');
            setEtapa('erro');
          }
        },
        onError: (err: unknown) => {
          setMensagem(String(err));
          setEtapa('erro');
        },
        onClose: () => {
          if (etapa === 'conectando') setEtapa('inicio');
        },
      });

      widget.init();
    } catch (err) {
      setMensagem(err instanceof Error ? err.message : 'Erro ao conectar');
      setEtapa('erro');
    }
  }, [userId, repo, etapa]);

  const card: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '480px',
    margin: '0 auto',
    textAlign: 'center',
  };

  const btn: React.CSSProperties = {
    padding: '14px 28px',
    background: 'var(--primary)',
    color: 'var(--primary-text)',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '24px',
  };

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '8px 0 40px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '24px' }}>
        Conectar banco
      </h1>

      <div style={card}>
        {etapa === 'inicio' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏦</div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              Conecte sua conta bancária
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.6 }}>
              Importe automaticamente suas transações dos últimos 2 meses. Suporta Nubank, Itaú, Bradesco, Santander e mais de 100 bancos brasileiros.
            </p>
            <button style={btn} onClick={abrirWidget}>
              Conectar banco
            </button>
          </>
        )}

        {etapa === 'conectando' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔗</div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
              Abrindo conexão segura...
            </p>
          </>
        )}

        {etapa === 'importando' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              Importando transações
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text2)' }}>{mensagem}</p>
          </>
        )}

        {etapa === 'concluido' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              Importação concluída!
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text2)' }}>
              {importados} transações importadas com sucesso.
            </p>
            <button style={btn} onClick={() => setEtapa('inicio')}>
              Conectar outro banco
            </button>
          </>
        )}

        {etapa === 'erro' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              Algo deu errado
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text2)' }}>{mensagem}</p>
            <button style={btn} onClick={() => setEtapa('inicio')}>
              Tentar novamente
            </button>
          </>
        )}
      </div>

      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: 'var(--surface2)',
        borderRadius: '12px',
        fontSize: '13px',
        color: 'var(--text2)',
        lineHeight: 1.6,
      }}>
        🔒 Seus dados bancários são acessados de forma segura via Open Finance. O Flowly nunca armazena suas credenciais bancárias.
      </div>
    </div>
  );
}

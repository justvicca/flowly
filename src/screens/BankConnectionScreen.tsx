import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRepository } from '../repository/RepositoryContext';
import { usePreferences, useTranslation } from '../contexts/PreferencesContext';
import {
  detectRegion, detectBelvoTransactionType, detectGoCardlessTransactionType,
  getDateRange, BELVO_WIDGET_SCRIPT,
  type Region, type GoCardlessInstitution,
} from './bankConnection/utils';

type Etapa = 'inicio' | 'selecionandoInstituicao' | 'conectando' | 'aguardandoRetorno' | 'importando' | 'concluido' | 'erro';

// ── API helpers ────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const text = await res.text();
  if (!res.ok) throw new Error(`Erro ${res.status}: ${text}`);
  return JSON.parse(text) as T;
}

// ── Component ──────────────────────────────────────────────────────────────

export function BankConnectionScreen() {
  const { sessao } = useAuth();
  const repo = useRepository();
  const { idioma } = usePreferences();
  const tr = useTranslation();
  const userId = sessao?.usuario.id ?? '';

  const [region, setRegion] = useState<Region>(() => detectRegion(idioma));
  const [etapa, setEtapa] = useState<Etapa>('inicio');
  const [mensagem, setMensagem] = useState('');
  const [importados, setImportados] = useState(0);
  const [instituicoes, setInstituicoes] = useState<GoCardlessInstitution[]>([]);
  const [busca, setBusca] = useState('');
  const [requisitionId, setRequisitionId] = useState('');

  // GoCardless return: check ?ref= on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      history.replaceState(null, '', window.location.pathname);
      setRequisitionId(ref);
      setEtapa('aguardandoRetorno');
      importarGoCardless(ref);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Import helpers ─────────────────────────────────────────────────────

  const importarBelvo = useCallback(async (link: string) => {
    setEtapa('importando');
    setMensagem(tr('buscandoTransacoes'));
    try {
      const { from, to } = getDateRange();
      const accounts = await fetchJson<{ id: string; name: string; institution: { name: string } }[]>(
        `/api/belvo/accounts?link=${link}`
      );
      let total = 0;
      for (const account of accounts) {
        const walletName = `${account.institution.name} - ${account.name}`;
        try { await repo.adicionarCarteira(userId, walletName); } catch { /* já existe */ }
        const transactions = await fetchJson<{ id: string; description: string; amount: number; value_date: string; type: 'INFLOW' | 'OUTFLOW' }[]>(
          `/api/belvo/transactions?link=${link}&date_from=${from}&date_to=${to}`
        );
        for (const t of transactions) {
          await repo.adicionarTransacao(userId, {
            descricao: t.description,
            valor: Math.abs(t.amount),
            tipo: detectBelvoTransactionType(t.type),
            data: t.value_date.split('T')[0],
            fixo: false,
            carteira_origem: walletName,
          });
          total++;
        }
      }
      setImportados(total);
      setEtapa('concluido');
    } catch (err) {
      setMensagem(err instanceof Error ? err.message : 'Erro ao importar');
      setEtapa('erro');
    }
  }, [userId, repo, tr]);

  const importarGoCardless = useCallback(async (reqId: string) => {
    setEtapa('importando');
    setMensagem(tr('buscandoTransacoes'));
    try {
      const { from, to } = getDateRange();
      const accountIds = await fetchJson<string[]>(`/api/gocardless/accounts?requisitionId=${reqId}`);
      let total = 0;
      for (const accountId of accountIds) {
        const walletName = `GoCardless - ${accountId.slice(0, 8)}`;
        try { await repo.adicionarCarteira(userId, walletName); } catch { /* já existe */ }
        const data = await fetchJson<{ booked: { transactionId: string; bookingDate: string; transactionAmount: { amount: string; currency: string }; remittanceInformationUnstructured?: string }[] }>(
          `/api/gocardless/transactions?accountId=${accountId}&date_from=${from}&date_to=${to}`
        );
        for (const t of data.booked ?? []) {
          await repo.adicionarTransacao(userId, {
            descricao: t.remittanceInformationUnstructured ?? t.transactionId,
            valor: Math.abs(parseFloat(t.transactionAmount.amount)),
            tipo: detectGoCardlessTransactionType(t.transactionAmount.amount),
            data: t.bookingDate,
            fixo: false,
            carteira_origem: walletName,
          });
          total++;
        }
      }
      setImportados(total);
      setEtapa('concluido');
    } catch (err) {
      setMensagem(err instanceof Error ? err.message : 'Erro ao importar');
      setEtapa('erro');
    }
  }, [userId, repo, tr]);

  // ── Belvo widget ───────────────────────────────────────────────────────

  const abrirBelvo = useCallback(async () => {
    setEtapa('conectando');
    try {
      const { access } = await fetchJson<{ access: string }>('/api/belvo/token', { method: 'POST' });

      await new Promise<void>((resolve, reject) => {
        if (document.getElementById('belvo-widget-script')) { resolve(); return; }
        const script = document.createElement('script');
        script.id = 'belvo-widget-script';
        script.src = BELVO_WIDGET_SCRIPT;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Falha ao carregar Belvo widget'));
        document.head.appendChild(script);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const BelvoSDK = (window as any).belvoSDK;
      if (!BelvoSDK) throw new Error('Belvo SDK não disponível');

      BelvoSDK.createWidget(access, {
        locale: 'pt',
        callback: (link: string, institution: string) => {
          void institution;
          importarBelvo(link);
        },
        onExit: (data: unknown) => {
          void data;
          if (etapa === 'conectando') setEtapa('inicio');
        },
        onError: (err: unknown) => {
          setMensagem(String(err));
          setEtapa('erro');
        },
      }).build();
    } catch (err) {
      setMensagem(err instanceof Error ? err.message : 'Erro ao conectar');
      setEtapa('erro');
    }
  }, [etapa, importarBelvo]);

  // ── GoCardless institution picker ──────────────────────────────────────

  const carregarInstituicoes = useCallback(async () => {
    setEtapa('selecionandoInstituicao');
    try {
      const data = await fetchJson<GoCardlessInstitution[]>('/api/gocardless/institutions?country=DE');
      setInstituicoes(data);
    } catch (err) {
      setMensagem(err instanceof Error ? err.message : 'Erro ao carregar bancos');
      setEtapa('erro');
    }
  }, []);

  const selecionarInstituicao = useCallback(async (institutionId: string) => {
    setEtapa('conectando');
    try {
      const redirectUrl = window.location.href.split('?')[0];
      const req = await fetchJson<{ id: string; link: string }>('/api/gocardless/requisition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institutionId, redirectUrl }),
      });
      window.location.href = req.link;
    } catch (err) {
      setMensagem(err instanceof Error ? err.message : 'Erro ao criar conexão');
      setEtapa('erro');
    }
  }, []);

  // ── Styles ─────────────────────────────────────────────────────────────

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '32px', maxWidth: '480px',
    margin: '0 auto', textAlign: 'center',
  };
  const btn: React.CSSProperties = {
    padding: '14px 28px', background: 'var(--primary)', color: 'var(--primary-text)',
    border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 600,
    cursor: 'pointer', marginTop: '24px',
  };
  const regionBtn = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px', border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
    borderRadius: '10px', background: active ? 'var(--primary)' : 'var(--surface)',
    color: active ? 'var(--primary-text)' : 'var(--text)', fontSize: '14px',
    fontWeight: 600, cursor: 'pointer',
  });

  const instituicoesFiltradas = instituicoes.filter(i =>
    i.name.toLowerCase().includes(busca.toLowerCase())
  );

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '8px 0 40px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '24px' }}>
        {tr('conectarBancoTitulo')}
      </h1>

      {/* Region selector */}
      {etapa === 'inicio' && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', justifyContent: 'center' }}>
          <button style={regionBtn(region === 'brazil')} onClick={() => setRegion('brazil')}>
            🇧🇷 Brasil
          </button>
          <button style={regionBtn(region === 'europe')} onClick={() => setRegion('europe')}>
            🇪🇺 Europa
          </button>
        </div>
      )}

      <div style={card}>
        {etapa === 'inicio' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏦</div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              {tr('conectarContaBancaria')}
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.6 }}>
              {region === 'brazil'
                ? 'Nubank, Itaú, Bradesco, Santander e mais de 100 bancos brasileiros via Open Finance.'
                : 'Deutsche Bank, Commerzbank, N26, Sparkasse e mais de 2.000 bancos europeus via PSD2.'}
            </p>
            <button style={btn} onClick={region === 'brazil' ? abrirBelvo : carregarInstituicoes}>
              {tr('conectarBanco')}
            </button>
          </>
        )}

        {etapa === 'selecionandoInstituicao' && (
          <>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>
              Selecione seu banco
            </p>
            <input
              type="search"
              placeholder="Pesquisar banco..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', background: 'var(--surface2)', color: 'var(--text)' }}
            />
            <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {instituicoesFiltradas.map((inst) => (
                <button key={inst.id} type="button" onClick={() => selecionarInstituicao(inst.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--surface)', cursor: 'pointer', textAlign: 'left' }}>
                  {inst.logo && <img src={inst.logo} alt="" width={28} height={28} style={{ borderRadius: '4px', objectFit: 'contain' }} />}
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>{inst.name}</span>
                </button>
              ))}
              {instituicoesFiltradas.length === 0 && (
                <p style={{ color: 'var(--text2)', fontSize: '14px', padding: '16px 0' }}>Nenhum banco encontrado.</p>
              )}
            </div>
            <button style={{ ...btn, background: 'var(--surface)', color: 'var(--text2)', border: '1px solid var(--border)' }} onClick={() => setEtapa('inicio')}>
              {tr('cancelar')}
            </button>
          </>
        )}

        {etapa === 'conectando' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔗</div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
              {tr('abrindoConexao')}
            </p>
          </>
        )}

        {etapa === 'aguardandoRetorno' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
              Processando autorização...
            </p>
          </>
        )}

        {etapa === 'importando' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              {tr('importandoTransacoes')}
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text2)' }}>{mensagem}</p>
          </>
        )}

        {etapa === 'concluido' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              {tr('importacaoConcluida')}
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text2)' }}>
              {importados} {tr('transacoesImportadas')}
            </p>
            <button style={btn} onClick={() => { setEtapa('inicio'); setImportados(0); }}>
              {tr('conectarOutroBanco')}
            </button>
          </>
        )}

        {etapa === 'erro' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              {tr('algoDeuErrado')}
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text2)' }}>{mensagem}</p>
            <button style={btn} onClick={() => setEtapa('inicio')}>
              {tr('tentarNovamente')}
            </button>
          </>
        )}
      </div>

      <div style={{ marginTop: '24px', padding: '16px', background: 'var(--surface2)', borderRadius: '12px', fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 }}>
        {tr('segurancaBancaria')}
      </div>
    </div>
  );
}

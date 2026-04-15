import { useState, useMemo } from 'react';
import type { Wallet } from '../../types/flowly';
import { WalletCard } from './WalletCard';
import { usePreferences, useTranslation, MOEDAS } from '../../contexts/PreferencesContext';
import { useExchangeRates } from '../../hooks/useExchangeRates';
import { convertAmount } from '../../services/exchangeRateService';

interface WalletListProps {
  carteiras: Wallet[];
  onAdicionarCarteira: (nome: string, moeda: string) => Promise<void>;
}

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '8px 16px', border: '1px solid var(--primary, #1976d2)',
  borderRadius: '4px', background: 'var(--primary, #1976d2)',
  color: 'var(--primary-text, #fff)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
};

export function WalletList({ carteiras, onAdicionarCarteira }: WalletListProps) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nomeNovo, setNomeNovo] = useState('');
  const [moedaNova, setMoedaNova] = useState('BRL');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { moeda } = usePreferences();
  const tr = useTranslation();

  const displayCurrency = moeda.codigo;
  const walletCurrencies = useMemo(
    () => carteiras.map((w) => w.moeda ?? 'BRL'),
    [carteiras]
  );

  const { rates, loading: loadingRates, error: ratesError } = useExchangeRates(displayCurrency, walletCurrencies);

  const convertedTotal = useMemo(() => {
    if (loadingRates) return null;
    return carteiras.reduce((sum, w) => {
      const walletMoeda = w.moeda ?? 'BRL';
      if (walletMoeda === displayCurrency) return sum + w.saldo;
      if (!rates) return sum + w.saldo; // fallback: no conversion available
      const converted = convertAmount(w.saldo, walletMoeda, displayCurrency, rates);
      return sum + (isFinite(converted) ? converted : w.saldo);
    }, 0);
  }, [carteiras, displayCurrency, rates, loadingRates]);

  function formatarSaldo(valor: number, codigoMoeda: string): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: codigoMoeda });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nome = nomeNovo.trim();
    if (!nome) return;
    setSalvando(true);
    setErro(null);
    try {
      await onAdicionarCarteira(nome, moedaNova);
      setNomeNovo('');
      setMoedaNova('BRL');
      setMostrarForm(false);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao adicionar carteira.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Saldo total consolidado */}
      <div
        style={{ padding: '14px 16px', background: 'var(--surface2, #f5f5f5)', border: '1px solid var(--border, #e0e0e0)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        aria-label="Saldo total consolidado"
      >
        <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text, #424242)' }}>{tr('saldoTotalLabel')}</span>
        {loadingRates ? (
          <span style={{ fontSize: '14px', color: 'var(--text2)' }}>...</span>
        ) : ratesError ? (
          <span style={{ fontWeight: 700, fontSize: '20px', color: convertedTotal !== null && convertedTotal >= 0 ? '#2e7d32' : '#c62828' }}>
            {convertedTotal !== null ? formatarSaldo(convertedTotal, displayCurrency) : '—'}
          </span>
        ) : (
          <span style={{ fontWeight: 700, fontSize: '20px', color: convertedTotal !== null && convertedTotal >= 0 ? '#2e7d32' : '#c62828' }}>
            {convertedTotal !== null ? formatarSaldo(convertedTotal, displayCurrency) : '—'}
          </span>
        )}
      </div>

      {/* Lista de carteiras */}
      {carteiras.length === 0 ? (
        <p style={{ color: 'var(--text2, #757575)', textAlign: 'center', padding: '16px 0' }}>
          {tr('nenhumaCarteira')}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {carteiras.map((w) => (
            <WalletCard key={w.nome} wallet={w} rates={rates} displayCurrency={displayCurrency} />
          ))}
        </div>
      )}

      {/* Botão Adicionar Carteira */}
      <button type="button" onClick={() => { setMostrarForm((v) => !v); setErro(null); }}
        style={btnBase} aria-expanded={mostrarForm} aria-label={tr('adicionarCarteiraLabel')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {tr('adicionarCarteiraLabel')}
      </button>

      {/* Formulário inline */}
      {mostrarForm && (
        <form onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px 16px', background: 'var(--surface2, #f5f5f5)', border: '1px solid var(--border, #e0e0e0)', borderRadius: '6px' }}
          aria-label="Formulário para adicionar carteira">
          <label htmlFor="nova-carteira-nome" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text, #333)' }}>
            {tr('nomeCarteira')}
          </label>
          <input id="nova-carteira-nome" type="text" value={nomeNovo} onChange={(e) => setNomeNovo(e.target.value)}
            placeholder={tr('placeholder_carteira')} disabled={salvando}
            style={{ padding: '8px 10px', border: '1px solid var(--border, #ccc)', borderRadius: '4px', fontSize: '14px', background: 'var(--surface, #fff)', color: 'var(--text, #333)' }}
            autoFocus />

          <label htmlFor="nova-carteira-moeda" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text, #333)' }}>
            {tr('moeda')}
          </label>
          <select id="nova-carteira-moeda" value={moedaNova} onChange={(e) => setMoedaNova(e.target.value)}
            disabled={salvando}
            style={{ padding: '8px 10px', border: '1px solid var(--border, #ccc)', borderRadius: '4px', fontSize: '14px', background: 'var(--surface, #fff)', color: 'var(--text, #333)' }}>
            {MOEDAS.map((m) => (
              <option key={m.codigo} value={m.codigo}>{m.simbolo} — {m.nome}</option>
            ))}
          </select>

          {erro && <p role="alert" style={{ color: '#c62828', fontSize: '13px', margin: 0 }}>{erro}</p>}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" disabled={salvando || !nomeNovo.trim()}
              style={{ ...btnBase, opacity: salvando || !nomeNovo.trim() ? 0.6 : 1, cursor: salvando || !nomeNovo.trim() ? 'not-allowed' : 'pointer' }}>
              {salvando ? tr('salvandoCarteira') : tr('salvar')}
            </button>
            <button type="button" onClick={() => { setMostrarForm(false); setNomeNovo(''); setErro(null); }}
              style={{ ...btnBase, background: 'var(--surface, #fff)', color: 'var(--text2, #555)', borderColor: 'var(--border, #ccc)' }}>
              {tr('cancelarCarteira')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

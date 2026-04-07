import type { Wallet } from '../../types/flowly';
import { usePreferences } from '../../contexts/PreferencesContext';

interface WalletCardProps {
  wallet: Wallet;
}

function formatarSaldo(valor: number, codigoMoeda: string): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: codigoMoeda });
}

function corSaldo(valor: number): string {
  if (valor > 0) return '#2e7d32';
  if (valor < 0) return '#c62828';
  return '#757575';
}

export function WalletCard({ wallet }: WalletCardProps) {
  const { nome, saldo } = wallet;
  const { moeda } = usePreferences();

  return (
    <article
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 16px',
        border: '1px solid var(--border, #e0e0e0)',
        borderRadius: '6px',
        background: 'var(--surface, #fff)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
      }}
      aria-label={`Carteira: ${nome}`}
    >
      <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text, #212121)' }}>{nome}</span>
      <span
        style={{ fontWeight: 700, fontSize: '17px', color: corSaldo(saldo) }}
        aria-label={`Saldo: ${formatarSaldo(saldo, moeda.codigo)}`}
      >
        {formatarSaldo(saldo, moeda.codigo)}
      </span>
    </article>
  );
}

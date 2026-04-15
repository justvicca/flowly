import type { Wallet } from '../../types/flowly';
import { convertAmount } from '../../services/exchangeRateService';

interface WalletCardProps {
  wallet: Wallet;
  rates?: Record<string, number> | null;
  displayCurrency?: string;
}

function formatarSaldo(valor: number, codigoMoeda: string): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: codigoMoeda });
}

function corSaldo(valor: number): string {
  if (valor > 0) return '#2e7d32';
  if (valor < 0) return '#c62828';
  return '#757575';
}

export function WalletCard({ wallet, rates, displayCurrency }: WalletCardProps) {
  const { nome, saldo } = wallet;
  const walletMoeda = wallet.moeda ?? 'BRL';

  const showSecondary =
    displayCurrency &&
    walletMoeda !== displayCurrency &&
    rates != null;

  const convertedValue = showSecondary
    ? convertAmount(saldo, walletMoeda, displayCurrency!, rates!)
    : null;

  const showConverted = convertedValue !== null && isFinite(convertedValue);

  return (
    <article
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '14px 16px',
        border: '1px solid var(--border, #e0e0e0)',
        borderRadius: '6px',
        background: 'var(--surface, #fff)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
      }}
      aria-label={`Carteira: ${nome}`}
    >
      <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text, #212121)' }}>{nome}</span>
      <div style={{ textAlign: 'right' }}>
        <span
          style={{ fontWeight: 700, fontSize: '17px', color: corSaldo(saldo), display: 'block' }}
          aria-label={`Saldo: ${formatarSaldo(saldo, walletMoeda)}`}
        >
          {formatarSaldo(saldo, walletMoeda)}
        </span>
        {showConverted && (
          <span style={{ fontSize: '12px', color: 'var(--text2, #757575)', display: 'block', marginTop: '2px' }}>
            ≈ {formatarSaldo(convertedValue!, displayCurrency!)}
          </span>
        )}
      </div>
    </article>
  );
}

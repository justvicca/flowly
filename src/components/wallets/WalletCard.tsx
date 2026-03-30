import type { Wallet } from '../../types/flowly';

interface WalletCardProps {
  wallet: Wallet;
}

function formatarSaldo(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function corSaldo(valor: number): string {
  if (valor > 0) return '#2e7d32';
  if (valor < 0) return '#c62828';
  return '#757575';
}

export function WalletCard({ wallet }: WalletCardProps) {
  const { nome, saldo } = wallet;

  return (
    <article
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 16px',
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
      }}
      aria-label={`Carteira: ${nome}`}
    >
      <span style={{ fontWeight: 600, fontSize: '15px', color: '#212121' }}>{nome}</span>
      <span
        style={{ fontWeight: 700, fontSize: '17px', color: corSaldo(saldo) }}
        aria-label={`Saldo: ${formatarSaldo(saldo)}`}
      >
        {formatarSaldo(saldo)}
      </span>
    </article>
  );
}

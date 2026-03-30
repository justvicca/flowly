import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import type { Transaction } from '../../types/flowly';
import { TransactionItem } from './TransactionItem';

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  descricao: 'Salário',
  valor: 3000,
  tipo: 'entrada',
  data: '2024-06-15',
  fixo: false,
  carteira_origem: 'Banco do Brasil',
  ...overrides,
});

const noop = vi.fn();

const defaultProps = {
  carteiras: ['Banco do Brasil', 'Dinheiro na Mão'],
  onCopiar: noop,
  onDuplicar: vi.fn().mockResolvedValue(undefined),
  onMover: vi.fn().mockResolvedValue(undefined),
  onApagar: noop,
};

describe('TransactionItem', () => {
  it('renderiza descrição, valor e data da transação', () => {
    render(
      <TransactionItem
        transaction={makeTransaction()}
        {...defaultProps}
      />
    );

    expect(screen.getByText('Salário')).toBeInTheDocument();
    // valor formatado em BRL
    expect(screen.getByText(/3\.000/)).toBeInTheDocument();
    // data formatada dd/mm/yyyy
    expect(screen.getByText(/15\/06\/2024/)).toBeInTheDocument();
  });

  it('exibe badge "FIXA" quando fixo: true (Req 4.1)', () => {
    render(
      <TransactionItem
        transaction={makeTransaction({ fixo: true })}
        {...defaultProps}
      />
    );

    expect(screen.getByText('FIXA')).toBeInTheDocument();
    expect(screen.getByLabelText('Transação fixa')).toBeInTheDocument();
  });

  it('NÃO exibe badge "FIXA" quando fixo: false (Req 4.1)', () => {
    render(
      <TransactionItem
        transaction={makeTransaction({ fixo: false })}
        {...defaultProps}
      />
    );

    expect(screen.queryByText('FIXA')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Transação fixa')).not.toBeInTheDocument();
  });

  it('chama onApagar com o id correto ao clicar em "Apagar" (Req 3.6)', async () => {
    const onApagar = vi.fn();
    render(
      <TransactionItem
        transaction={makeTransaction({ id: 'tx-abc' })}
        {...defaultProps}
        onApagar={onApagar}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /apagar transação/i }));

    expect(onApagar).toHaveBeenCalledOnce();
    expect(onApagar).toHaveBeenCalledWith('tx-abc');
  });

  it('chama onCopiar com o id correto ao clicar em "Copiar" (Req 3.3)', async () => {
    const onCopiar = vi.fn();
    render(
      <TransactionItem
        transaction={makeTransaction({ id: 'tx-xyz' })}
        {...defaultProps}
        onCopiar={onCopiar}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /copiar transação/i }));

    expect(onCopiar).toHaveBeenCalledOnce();
    expect(onCopiar).toHaveBeenCalledWith('tx-xyz');
  });
});

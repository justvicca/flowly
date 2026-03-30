import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import type { Transaction } from '../../types/flowly';
import { TransactionList } from './TransactionList';

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  descricao: 'Aluguel',
  valor: 1200,
  tipo: 'saida',
  data: '2024-06-01',
  fixo: false,
  carteira_origem: 'Banco do Brasil',
  ...overrides,
});

const defaultProps = {
  carteiras: ['Banco do Brasil', 'Dinheiro na Mão'],
  onCopiar: vi.fn(),
  onDuplicar: vi.fn().mockResolvedValue(undefined),
  onMover: vi.fn().mockResolvedValue(undefined),
  onRemover: vi.fn().mockResolvedValue(undefined),
};

describe('TransactionList', () => {
  it('exibe ConfirmDialog ao clicar em "Apagar" em um TransactionItem (Req 3.6)', async () => {
    render(
      <TransactionList
        transacoes={[makeTransaction()]}
        {...defaultProps}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /apagar transação/i }));

    // ConfirmDialog deve aparecer com role="dialog"
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('chama onRemover após confirmar no ConfirmDialog (Req 3.6)', async () => {
    const onRemover = vi.fn().mockResolvedValue(undefined);
    render(
      <TransactionList
        transacoes={[makeTransaction({ id: 'tx-del' })]}
        {...defaultProps}
        onRemover={onRemover}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /apagar transação/i }));
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(onRemover).toHaveBeenCalledOnce();
      expect(onRemover).toHaveBeenCalledWith('tx-del');
    });
  });

  it('exibe "Pronto! A transação foi removida." após remoção confirmada (Req 3.7)', async () => {
    const onRemover = vi.fn().mockResolvedValue(undefined);
    render(
      <TransactionList
        transacoes={[makeTransaction()]}
        {...defaultProps}
        onRemover={onRemover}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /apagar transação/i }));
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Pronto! A transação foi removida.')
      ).toBeInTheDocument();
    });
  });
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';
import { PreferencesProvider } from '../contexts/PreferencesContext';

describe('ConfirmDialog', () => {
  it('exibe o dialog com mensagem e botões ao ser renderizado', () => {
    const message = 'Deseja remover esta tarefa?';

    render(
      <PreferencesProvider>
        <ConfirmDialog message={message} onConfirm={vi.fn()} onCancel={vi.fn()} />
      </PreferencesProvider>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });
});

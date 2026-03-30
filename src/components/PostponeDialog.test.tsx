import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PostponeDialog } from './PostponeDialog';

describe('PostponeDialog', () => {
  it('exibe o dialog com input de data e botões ao ser renderizado', () => {
    render(
      <PostponeDialog
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(document.querySelector('input[type="datetime-local"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });
});

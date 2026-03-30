import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterBar } from './FilterBar';

describe('FilterBar', () => {
  it('renderiza os quatro controles de filtro', () => {
    render(<FilterBar filter="all" onFilterChange={vi.fn()} />);

    expect(screen.getByRole('tab', { name: /todas/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /pendentes/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /concluídas/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /adiadas/i })).toBeInTheDocument();
  });
});

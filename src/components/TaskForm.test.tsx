import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { TaskForm } from './TaskForm';
import type { TaskInput } from '../types';

describe('TaskForm', () => {
  it('renders all expected form fields and buttons', () => {
    render(<TaskForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    // 4 fields
    expect(screen.getByRole('textbox', { name: /título/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /descrição/i })).toBeInTheDocument();
    expect(document.querySelector('input[type="datetime-local"]')).toBeInTheDocument();
    expect(document.querySelector('input[type="date"]')).toBeInTheDocument();

    // submit and cancel buttons
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });
});

// Helper: format Date to YYYY-MM-DDTHH:mm
function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Helper: format Date to YYYY-MM-DD
function toDateOnly(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const futureMin = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
const futureMax = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

describe('TaskForm — Property 14', () => {
  // Feature: task-manager, Property 14: Formulário de edição pré-preenchido com dados atuais
  it('pre-fills all fields with the provided initialValues', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1 }),
          description: fc.option(fc.string(), { nil: undefined }),
          scheduledAt: fc.date({ min: futureMin, max: futureMax }).map(toDatetimeLocal),
          dueDate: fc.date({ min: futureMin, max: futureMax }).map(toDateOnly),
        }),
        (initialValues: TaskInput & { description?: string }) => {
          const { unmount } = render(
            <TaskForm
              initialValues={initialValues}
              onSubmit={vi.fn()}
              onCancel={vi.fn()}
            />
          );

          const titleInput = document.querySelector<HTMLInputElement>('input[type="text"]');
          const descriptionInput = document.querySelector<HTMLTextAreaElement>('textarea');
          const scheduledAtInput = document.querySelector<HTMLInputElement>('input[type="datetime-local"]');
          const dueDateInput = document.querySelector<HTMLInputElement>('input[type="date"]');

          expect(titleInput?.value).toBe(initialValues.title);
          expect(descriptionInput?.value).toBe(initialValues.description ?? '');
          expect(scheduledAtInput?.value).toBe(initialValues.scheduledAt);
          expect(dueDateInput?.value).toBe(initialValues.dueDate);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

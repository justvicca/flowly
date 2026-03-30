import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateTaskInput, validatePostponeDate } from './validation';
import type { TaskInput } from '../types';

const futureDate = (daysAhead = 1): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

const pastDate = (daysAgo = 1): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const validInput = (): TaskInput => ({
  title: 'Minha tarefa',
  scheduledAt: new Date().toISOString(),
  dueDate: futureDate(),
});

describe('validateTaskInput', () => {
  it('retorna ok para entrada válida', () => {
    const input = validInput();
    const result = validateTaskInput(input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual(input);
  });

  it('rejeita título vazio', () => {
    const result = validateTaskInput({ ...validInput(), title: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.some(e => e.field === 'title')).toBe(true);
  });

  it('rejeita título somente whitespace', () => {
    const result = validateTaskInput({ ...validInput(), title: '   ' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.some(e => e.field === 'title')).toBe(true);
  });

  it('rejeita dueDate no passado', () => {
    const result = validateTaskInput({ ...validInput(), dueDate: pastDate() });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.some(e => e.field === 'dueDate')).toBe(true);
  });

  it('acumula múltiplos erros', () => {
    const result = validateTaskInput({ ...validInput(), title: '', dueDate: pastDate() });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBe(2);
  });

  it('nunca lança exceção', () => {
    expect(() => validateTaskInput({ title: '', scheduledAt: '', dueDate: 'invalid' })).not.toThrow();
  });
});

// Feature: task-manager, Property 2: Título vazio ou whitespace é rejeitado
it('rejeita títulos compostos apenas de whitespace', () => {
  fc.assert(
    fc.property(
      fc.stringMatching(/^\s*$/),
      (title) => {
        const result = validateTaskInput({ title, scheduledAt: futureDate(), dueDate: futureDate() });
        expect(result.ok).toBe(false);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: task-manager, Property 3: due_date no passado é rejeitada
it('rejeita dueDate no passado para qualquer data anterior a hoje', () => {
  fc.assert(
    fc.property(
      fc.date({ max: new Date(Date.now() - 86400000) }),
      (date) => {
        const dueDate = date.toISOString().split('T')[0];
        const result = validateTaskInput({ ...validInput(), dueDate });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.some(e => e.field === 'dueDate')).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: task-manager, Property 9: Adiar com data passada é rejeitado
it('rejeita qualquer data passada ao adiar', () => {
  fc.assert(
    fc.property(
      fc.date({ max: new Date(Date.now() - 1) }),
      (date) => {
        const result = validatePostponeDate(date);
        expect(result.ok).toBe(false);
      }
    ),
    { numRuns: 100 }
  );
});

describe('validatePostponeDate', () => {
  it('aceita data futura', () => {
    const future = new Date(Date.now() + 60_000);
    const result = validatePostponeDate(future);
    expect(result.ok).toBe(true);
  });

  it('rejeita data no passado', () => {
    const past = new Date(Date.now() - 60_000);
    const result = validatePostponeDate(past);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.some(e => e.field === 'scheduledAt')).toBe(true);
  });

  it('rejeita instante atual (igual a now)', () => {
    // date <= now should be rejected
    const now = new Date(Date.now() - 1);
    const result = validatePostponeDate(now);
    expect(result.ok).toBe(false);
  });

  it('nunca lança exceção', () => {
    expect(() => validatePostponeDate(new Date('invalid'))).not.toThrow();
  });
});

import type { TaskInput, ValidationError, Result } from '../types';

export function validateTaskInput(input: TaskInput): Result<TaskInput, ValidationError[]> {
  const errors: ValidationError[] = [];

  if (!input.title || input.title.trim() === '') {
    errors.push({ field: 'title', message: 'O título é obrigatório.' });
  }

  if (input.dueDate) {
    const due = new Date(input.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due < today) {
      errors.push({ field: 'dueDate', message: 'A data de vencimento não pode ser anterior à data atual.' });
    }
  }

  if (errors.length > 0) {
    return { ok: false, error: errors };
  }

  return { ok: true, value: input };
}

export function validatePostponeDate(date: Date): Result<void, ValidationError[]> {
  const now = new Date();
  if (date <= now) {
    return {
      ok: false,
      error: [{ field: 'scheduledAt', message: 'O novo horário deve ser futuro.' }],
    };
  }
  return { ok: true, value: undefined };
}

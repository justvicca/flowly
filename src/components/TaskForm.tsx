import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import type { TaskInput, ValidationError } from '../types';
import { validateTaskInput } from '../utils/validation';

interface TaskFormProps {
  initialValues?: Partial<TaskInput>;
  onSubmit: (input: TaskInput) => void;
  onCancel: () => void;
}

function getFieldError(errors: ValidationError[], field: string): string | undefined {
  return errors.find((e) => e.field === field)?.message;
}

const errorStyle: CSSProperties = {
  margin: '4px 0 0',
  fontSize: '13px',
  color: '#d32f2f',
};

const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: '4px',
  fontSize: '14px',
  fontWeight: 500,
};

const fieldStyle: CSSProperties = {
  marginBottom: '16px',
};

function inputStyle(hasError: boolean): CSSProperties {
  return {
    width: '100%',
    padding: '8px',
    fontSize: '14px',
    border: hasError ? '1px solid #d32f2f' : '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
  };
}

export function TaskForm({ initialValues, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [scheduledAt, setScheduledAt] = useState(initialValues?.scheduledAt ?? '');
  const [dueDate, setDueDate] = useState(initialValues?.dueDate ?? '');
  const [errors, setErrors] = useState<ValidationError[]>([]);

  function clearFieldError(field: string) {
    setErrors((prev: ValidationError[]) => prev.filter((err: ValidationError) => err.field !== field));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const input: TaskInput = {
      title,
      description: description || undefined,
      scheduledAt,
      dueDate,
    };

    const result = validateTaskInput(input);

    if (!result.ok) {
      setErrors(result.error);
      return;
    }

    setErrors([]);
    onSubmit(result.value);
  }

  const titleError = getFieldError(errors, 'title');
  const scheduledAtError = getFieldError(errors, 'scheduledAt');
  const dueDateError = getFieldError(errors, 'dueDate');

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Formulário de tarefa">
      <div style={fieldStyle}>
        <label htmlFor="task-title" style={labelStyle}>
          Título <span aria-hidden="true">*</span>
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e: { target: { value: string } }) => {
            setTitle(e.target.value);
            clearFieldError('title');
          }}
          style={inputStyle(!!titleError)}
          aria-required="true"
          aria-describedby={titleError ? 'task-title-error' : undefined}
        />
        {titleError && (
          <p id="task-title-error" role="alert" style={errorStyle}>
            {titleError}
          </p>
        )}
      </div>

      <div style={fieldStyle}>
        <label htmlFor="task-description" style={labelStyle}>
          Descrição
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e: { target: { value: string } }) => setDescription(e.target.value)}
          rows={3}
          style={{ ...inputStyle(false), resize: 'vertical' }}
        />
      </div>

      <div style={fieldStyle}>
        <label htmlFor="task-scheduled-at" style={labelStyle}>
          Data e horário agendado <span aria-hidden="true">*</span>
        </label>
        <input
          id="task-scheduled-at"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e: { target: { value: string } }) => {
            setScheduledAt(e.target.value);
            clearFieldError('scheduledAt');
          }}
          style={inputStyle(!!scheduledAtError)}
          aria-required="true"
          aria-describedby={scheduledAtError ? 'task-scheduled-at-error' : undefined}
        />
        {scheduledAtError && (
          <p id="task-scheduled-at-error" role="alert" style={errorStyle}>
            {scheduledAtError}
          </p>
        )}
      </div>

      <div style={fieldStyle}>
        <label htmlFor="task-due-date" style={labelStyle}>
          Data de vencimento <span aria-hidden="true">*</span>
        </label>
        <input
          id="task-due-date"
          type="date"
          value={dueDate}
          onChange={(e: { target: { value: string } }) => {
            setDueDate(e.target.value);
            clearFieldError('dueDate');
          }}
          style={inputStyle(!!dueDateError)}
          aria-required="true"
          aria-describedby={dueDateError ? 'task-due-date-error' : undefined}
        />
        {dueDateError && (
          <p id="task-due-date-error" role="alert" style={errorStyle}>
            {dueDateError}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 20px',
            cursor: 'pointer',
            background: 'none',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          style={{
            padding: '8px 20px',
            cursor: 'pointer',
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Salvar
        </button>
      </div>
    </form>
  );
}

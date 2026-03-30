import type { CSSProperties } from 'react';
import type { Task, TaskStatus } from '../types';

interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
  onPostpone: (id: string) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}

const statusLabels: Record<TaskStatus, string> = {
  pending: 'Pendente',
  completed: 'Concluída',
  postponed: 'Adiada',
};

const statusColors: Record<TaskStatus, { background: string; color: string }> = {
  pending: { background: '#fff3e0', color: '#e65100' },
  completed: { background: '#e8f5e9', color: '#2e7d32' },
  postponed: { background: '#e3f2fd', color: '#1565c0' },
};

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  // dueDate is stored as YYYY-MM-DD; parse without timezone shift
  const [year, month, day] = iso.split('T')[0].split('-');
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

const cardStyle: CSSProperties = {
  background: '#fff',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

const titleStyle: CSSProperties = {
  margin: '0 0 6px',
  fontSize: '16px',
  fontWeight: 600,
  color: '#212121',
};

const descriptionStyle: CSSProperties = {
  margin: '0 0 10px',
  fontSize: '14px',
  color: '#616161',
};

const metaStyle: CSSProperties = {
  fontSize: '13px',
  color: '#757575',
  marginBottom: '4px',
};

const actionsStyle: CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  marginTop: '14px',
};

function actionButton(variant: 'primary' | 'secondary' | 'danger'): CSSProperties {
  const base: CSSProperties = {
    padding: '6px 14px',
    fontSize: '13px',
    borderRadius: '4px',
    cursor: 'pointer',
    border: 'none',
  };
  if (variant === 'primary') return { ...base, background: '#1976d2', color: '#fff' };
  if (variant === 'danger') return { ...base, background: '#d32f2f', color: '#fff' };
  return { ...base, background: 'none', border: '1px solid #bdbdbd', color: '#424242' };
}

function disabledButtonStyle(): CSSProperties {
  return {
    padding: '6px 14px',
    fontSize: '13px',
    borderRadius: '4px',
    border: 'none',
    background: '#e0e0e0',
    color: '#9e9e9e',
    cursor: 'not-allowed',
  };
}

export function TaskItem({ task, onComplete, onPostpone, onEdit, onRemove }: TaskItemProps) {
  const isCompleted = task.status === 'completed';
  const badge = statusColors[task.status];

  return (
    <article style={cardStyle} aria-label={`Tarefa: ${task.title}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={titleStyle}>{task.title}</h3>
        <span
          style={{
            padding: '2px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
            background: badge.background,
            color: badge.color,
            whiteSpace: 'nowrap',
          }}
          aria-label={`Status: ${statusLabels[task.status]}`}
        >
          {statusLabels[task.status]}
        </span>
      </div>

      {task.description && (
        <p style={descriptionStyle}>{task.description}</p>
      )}

      <p style={metaStyle}>
        <strong>Agendado:</strong> {formatDateTime(task.scheduledAt)}
      </p>
      <p style={metaStyle}>
        <strong>Vencimento:</strong> {formatDate(task.dueDate)}
      </p>

      <div style={actionsStyle}>
        <button
          onClick={() => !isCompleted && onComplete(task.id)}
          disabled={isCompleted}
          aria-disabled={isCompleted}
          style={isCompleted ? disabledButtonStyle() : actionButton('primary')}
          aria-label="Concluir tarefa"
        >
          Concluir
        </button>

        <button
          onClick={() => onPostpone(task.id)}
          style={actionButton('secondary')}
          aria-label="Adiar tarefa"
        >
          Adiar
        </button>

        <button
          onClick={() => onEdit(task.id)}
          style={actionButton('secondary')}
          aria-label="Editar tarefa"
        >
          Editar
        </button>

        <button
          onClick={() => onRemove(task.id)}
          style={actionButton('danger')}
          aria-label="Remover tarefa"
        >
          Remover
        </button>
      </div>
    </article>
  );
}

import type { CSSProperties } from 'react';
import type { Task } from '../types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onPostpone: (id: string) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}

const containerStyle: CSSProperties = {
  width: '100%',
};

const emptyMessageStyle: CSSProperties = {
  textAlign: 'center',
  color: '#757575',
  fontSize: '15px',
  padding: '40px 16px',
};

export function TaskList({ tasks, onComplete, onPostpone, onEdit, onRemove }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div style={containerStyle}>
        <p style={emptyMessageStyle} role="status">
          Nenhuma tarefa encontrada para o filtro selecionado.
        </p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <style>{`
        @media (max-width: 767px) {
          .task-list-grid {
            display: flex !important;
            flex-direction: column !important;
          }
        }
      `}</style>
      <div
        className="task-list-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '0',
        }}
      >
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onComplete={onComplete}
            onPostpone={onPostpone}
            onEdit={onEdit}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}

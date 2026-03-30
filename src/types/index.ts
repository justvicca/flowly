export type TaskStatus = 'pending' | 'completed' | 'postponed';

export interface Task {
  id: string;           // UUID v4 gerado automaticamente
  title: string;        // obrigatório, não vazio
  description?: string; // opcional
  status: TaskStatus;
  scheduledAt: string;  // ISO 8601
  dueDate: string;      // ISO 8601 (data)
  createdAt: string;    // ISO 8601, imutável após criação
  completedAt?: string; // ISO 8601, preenchido ao concluir
}

export interface TaskInput {
  title: string;
  description?: string;
  scheduledAt: string;
  dueDate: string;
}

export type StatusFilter = 'all' | TaskStatus;

export interface ValidationError {
  field: string;
  message: string;
}

export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

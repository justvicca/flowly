import type { Task } from '../types';

const STORAGE_KEY = 'TASK_MANAGER_TASKS';

// In-memory fallback when localStorage is unavailable
let memoryStore: Task[] | null = null;

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__ls_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function isValidTaskArray(data: unknown): data is Task[] {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) =>
      item !== null &&
      typeof item === 'object' &&
      typeof (item as Record<string, unknown>).id === 'string' &&
      typeof (item as Record<string, unknown>).title === 'string' &&
      typeof (item as Record<string, unknown>).status === 'string' &&
      typeof (item as Record<string, unknown>).scheduledAt === 'string' &&
      typeof (item as Record<string, unknown>).dueDate === 'string' &&
      typeof (item as Record<string, unknown>).createdAt === 'string'
  );
}

export function loadTasks(): Task[] {
  if (!isLocalStorageAvailable()) {
    console.warn('TaskStore: localStorage indisponível, operando em memória.');
    return memoryStore ?? [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!isValidTaskArray(parsed)) {
      console.warn('TaskStore: dados no localStorage inválidos ou corrompidos, inicializando com lista vazia.');
      return [];
    }

    return parsed;
  } catch {
    console.warn('TaskStore: falha ao desserializar dados do localStorage, inicializando com lista vazia.');
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  if (!isLocalStorageAvailable()) {
    console.warn('TaskStore: localStorage indisponível, salvando em memória.');
    memoryStore = tasks;
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.warn('TaskStore: falha ao salvar tarefas no localStorage.', err);
  }
}

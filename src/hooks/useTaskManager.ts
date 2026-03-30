import { useState, useMemo } from 'react';
import type { Task, TaskInput, StatusFilter, ValidationError, Result } from '../types';
import { validateTaskInput, validatePostponeDate } from '../utils/validation';
import { loadTasks, saveTasks } from '../store/taskStore';

export function useTaskManager() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filteredTasks = useMemo<Task[]>(() => {
    if (filter === 'all') return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  function addTask(input: TaskInput): Result<Task, ValidationError[]> {
    const validation = validateTaskInput(input);
    if (!validation.ok) return validation;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      description: input.description,
      status: 'pending',
      scheduledAt: input.scheduledAt,
      dueDate: input.dueDate,
      createdAt: new Date().toISOString(),
    };

    const updated = [...tasks, newTask];
    setTasks(updated);
    saveTasks(updated);
    return { ok: true, value: newTask };
  }

  function removeTask(id: string): void {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    saveTasks(updated);
  }

  function completeTask(id: string): void {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() } : t
    );
    setTasks(updated);
    saveTasks(updated);
  }

  function postponeTask(id: string, newScheduledAt: Date): Result<void, ValidationError[]> {
    const validation = validatePostponeDate(newScheduledAt);
    if (!validation.ok) return validation;

    const updated = tasks.map((t) =>
      t.id === id
        ? { ...t, scheduledAt: newScheduledAt.toISOString(), status: 'postponed' as const }
        : t
    );
    setTasks(updated);
    saveTasks(updated);
    return { ok: true, value: undefined };
  }

  function editTask(id: string, input: Partial<TaskInput>): Result<Task, ValidationError[]> {
    const existing = tasks.find((t) => t.id === id);
    if (!existing) {
      return { ok: false, error: [{ field: 'id', message: 'Tarefa não encontrada.' }] };
    }

    const merged: TaskInput = {
      title: input.title ?? existing.title,
      description: input.description ?? existing.description,
      scheduledAt: input.scheduledAt ?? existing.scheduledAt,
      dueDate: input.dueDate ?? existing.dueDate,
    };

    const validation = validateTaskInput(merged);
    if (!validation.ok) return validation;

    const updatedTask: Task = {
      ...existing,
      title: merged.title.trim(),
      description: merged.description,
      scheduledAt: merged.scheduledAt,
      dueDate: merged.dueDate,
    };

    const updated = tasks.map((t) => (t.id === id ? updatedTask : t));
    setTasks(updated);
    saveTasks(updated);
    return { ok: true, value: updatedTask };
  }

  return {
    tasks,
    filter,
    filteredTasks,
    addTask,
    removeTask,
    completeTask,
    postponeTask,
    editTask,
    setFilter,
  };
}

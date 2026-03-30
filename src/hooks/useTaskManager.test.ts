import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { useTaskManager } from './useTaskManager';

beforeEach(() => {
  localStorage.clear();
});

describe('useTaskManager', () => {
  // Feature: task-manager, Property 1: Criação produz task com estado inicial correto
  it('addTask produz task com estado inicial correto para qualquer título válido e datas futuras', () => {
    // Validates: Requirements 1.2
    const futureISODate = (daysAhead = 1): string => {
      const d = new Date();
      d.setDate(d.getDate() + daysAhead);
      return d.toISOString().split('T')[0];
    };

    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.integer({ min: 1, max: 365 }),
        (title, daysAhead) => {
          localStorage.clear();
          const { result } = renderHook(() => useTaskManager());

          const input = {
            title,
            scheduledAt: new Date().toISOString(),
            dueDate: futureISODate(daysAhead),
          };

          let taskResult: ReturnType<typeof result.current.addTask> | undefined;
          act(() => {
            taskResult = result.current.addTask(input);
          });

          expect(taskResult).toBeDefined();
          expect(taskResult!.ok).toBe(true);

          if (taskResult!.ok) {
            const task = taskResult!.value;
            expect(task.status).toBe('pending');
            expect(typeof task.id).toBe('string');
            expect(task.id.length).toBeGreaterThan(0);
            expect(typeof task.createdAt).toBe('string');
            expect(task.createdAt.length).toBeGreaterThan(0);
            // Verify createdAt is a valid ISO 8601 string
            expect(() => new Date(task.createdAt)).not.toThrow();
            expect(new Date(task.createdAt).toISOString()).toBe(task.createdAt);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: task-manager, Property 5: Remoção confirmada elimina a task
  it('removeTask elimina a task da lista para qualquer task existente', () => {
    // Validates: Requirements 3.2
    const futureISODate = (daysAhead = 1): string => {
      const d = new Date();
      d.setDate(d.getDate() + daysAhead);
      return d.toISOString().split('T')[0];
    };

    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1 }).filter((s: string) => s.trim().length > 0),
          { minLength: 1, maxLength: 10 }
        ),
        fc.integer({ min: 0, max: 9 }),
        (titles: string[], indexToRemove: number) => {
          localStorage.clear();
          const { result } = renderHook(() => useTaskManager());

          const addedIds: string[] = [];

          for (const title of titles) {
            act(() => {
              const r = result.current.addTask({
                title,
                scheduledAt: new Date().toISOString(),
                dueDate: futureISODate(1),
              });
              if (r.ok) {
                addedIds.push(r.value.id);
              }
            });
          }

          if (addedIds.length === 0) return;

          const targetId = addedIds[indexToRemove % addedIds.length];

          act(() => {
            result.current.removeTask(targetId);
          });

          const ids = result.current.tasks.map((t) => t.id);
          expect(ids).not.toContain(targetId);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: task-manager, Property 6: Cancelar remoção mantém a task inalterada
  it('não chamar removeTask mantém a task inalterada na lista para qualquer task existente', () => {
    // Validates: Requirements 3.3
    const futureISODate = (daysAhead = 1): string => {
      const d = new Date();
      d.setDate(d.getDate() + daysAhead);
      return d.toISOString().split('T')[0];
    };

    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1 }).filter((s: string) => s.trim().length > 0),
          { minLength: 1, maxLength: 10 }
        ),
        fc.integer({ min: 0, max: 9 }),
        (titles: string[], targetIndex: number) => {
          localStorage.clear();
          const { result } = renderHook(() => useTaskManager());

          const addedTasks: { id: string; title: string } [] = [];

          for (const title of titles) {
            act(() => {
              const r = result.current.addTask({
                title,
                scheduledAt: new Date().toISOString(),
                dueDate: futureISODate(1),
              });
              if (r.ok) {
                addedTasks.push({ id: r.value.id, title: r.value.title });
              }
            });
          }

          if (addedTasks.length === 0) return;

          const target = addedTasks[targetIndex % addedTasks.length];

          // Simulate canceling removal: do NOT call removeTask
          // The task must still be present with all original fields intact
          const found = result.current.tasks.find((t) => t.id === target.id);
          expect(found).toBeDefined();
          expect(found!.id).toBe(target.id);
          expect(found!.title).toBe(target.title);
          expect(found!.status).toBe('pending');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: task-manager, Property 7: Concluir task atualiza status e registra completed_at
  it('completeTask atualiza status para completed e registra completedAt para qualquer task pending ou postponed', () => {
    // Validates: Requirements 4.1
    const futureISODate = (daysAhead = 1): string => {
      const d = new Date();
      d.setDate(d.getDate() + daysAhead);
      return d.toISOString().split('T')[0];
    };

    const initialStatusArb = fc.constantFrom('pending' as const, 'postponed' as const);

    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s: string) => s.trim().length > 0),
        initialStatusArb,
        (title: string, initialStatus: 'pending' | 'postponed') => {
          localStorage.clear();
          const { result } = renderHook(() => useTaskManager());

          let taskId = '';

          act(() => {
            const r = result.current.addTask({
              title,
              scheduledAt: new Date().toISOString(),
              dueDate: futureISODate(1),
            });
            if (r.ok) {
              taskId = r.value.id;
            }
          });

          if (!taskId) return;

          if (initialStatus === 'postponed') {
            act(() => {
              const future = new Date();
              future.setDate(future.getDate() + 2);
              result.current.postponeTask(taskId, future);
            });
          }

          act(() => {
            result.current.completeTask(taskId);
          });

          const task = result.current.tasks.find((t: import('../types').Task) => t.id === taskId);
          expect(task).toBeDefined();
          expect(task!.status).toBe('completed');
          expect(task!.completedAt).toBeDefined();
          expect(typeof task!.completedAt).toBe('string');
          expect(task!.completedAt!.length).toBeGreaterThan(0);
          // Verify completedAt is a valid ISO 8601 timestamp
          expect(() => new Date(task!.completedAt!)).not.toThrow();
          expect(new Date(task!.completedAt!).toISOString()).toBe(task!.completedAt);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: task-manager, Property 10: Adiar com data futura atualiza scheduled_at e status
  it('postponeTask atualiza scheduledAt e status para postponed para qualquer task e data futura válida', () => {
    // Validates: Requirements 5.3
    const futureISODate = (daysAhead = 1): string => {
      const d = new Date();
      d.setDate(d.getDate() + daysAhead);
      return d.toISOString().split('T')[0];
    };

    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s: string) => s.trim().length > 0),
        fc.integer({ min: 1, max: 365 }),
        (title: string, daysAhead: number) => {
          localStorage.clear();
          const { result } = renderHook(() => useTaskManager());

          let taskId = '';

          act(() => {
            const r = result.current.addTask({
              title,
              scheduledAt: new Date().toISOString(),
              dueDate: futureISODate(1),
            });
            if (r.ok) {
              taskId = r.value.id;
            }
          });

          if (!taskId) return;

          const newScheduledAt = new Date();
          newScheduledAt.setDate(newScheduledAt.getDate() + daysAhead);

          let postponeResult: ReturnType<typeof result.current.postponeTask> | undefined;
          act(() => {
            postponeResult = result.current.postponeTask(taskId, newScheduledAt);
          });

          expect(postponeResult).toBeDefined();
          expect(postponeResult!.ok).toBe(true);

          const task = result.current.tasks.find((t: import('../types').Task) => t.id === taskId);
          expect(task).toBeDefined();
          expect(task!.status).toBe('postponed');
          expect(task!.scheduledAt).toBe(newScheduledAt.toISOString());
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: task-manager, Property 4: Filtro de status retorna apenas tasks correspondentes
  it('filteredTasks contém apenas tasks com o status selecionado para qualquer lista e filtro', () => {
    // Validates: Requirements 2.4
    const futureISODate = (daysAhead = 1): string => {
      const d = new Date();
      d.setDate(d.getDate() + daysAhead);
      return d.toISOString().split('T')[0];
    };

    const taskStatusArb = fc.constantFrom(
      'pending' as const,
      'completed' as const,
      'postponed' as const
    );
    const filterArb = fc.constantFrom(
      'pending' as const,
      'completed' as const,
      'postponed' as const
    );

    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            targetStatus: taskStatusArb,
          }),
          { minLength: 0, maxLength: 10 }
        ),
        filterArb,
        (taskDefs, selectedFilter) => {
          localStorage.clear();
          const { result } = renderHook(() => useTaskManager());

          // Add tasks and mutate their status to match targetStatus
          for (const def of taskDefs) {
            act(() => {
              const r = result.current.addTask({
                title: def.title,
                scheduledAt: new Date().toISOString(),
                dueDate: futureISODate(1),
              });

              if (r.ok) {
                const id = r.value.id;
                if (def.targetStatus === 'completed') {
                  result.current.completeTask(id);
                } else if (def.targetStatus === 'postponed') {
                  const future = new Date();
                  future.setDate(future.getDate() + 2);
                  result.current.postponeTask(id, future);
                }
                // 'pending' is the default, no action needed
              }
            });
          }

          // Apply the status filter
          act(() => {
            result.current.setFilter(selectedFilter);
          });

          // Every task in filteredTasks must have exactly the selected status
          for (const task of result.current.filteredTasks) {
            expect(task.status).toBe(selectedFilter);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: task-manager, Property 11: Edição preserva ID e created_at
  it('editTask preserva id e createdAt para qualquer task e edição válida', () => {
    // Validates: Requirements 6.2
    const futureISODate = (daysAhead = 1): string => {
      const d = new Date();
      d.setDate(d.getDate() + daysAhead);
      return d.toISOString().split('T')[0];
    };

    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s: string) => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter((s: string) => s.trim().length > 0),
        fc.integer({ min: 1, max: 365 }),
        (originalTitle: string, newTitle: string, daysAhead: number) => {
          localStorage.clear();
          const { result } = renderHook(() => useTaskManager());

          let originalId = '';
          let originalCreatedAt = '';

          act(() => {
            const r = result.current.addTask({
              title: originalTitle,
              scheduledAt: new Date().toISOString(),
              dueDate: futureISODate(1),
            });
            if (r.ok) {
              originalId = r.value.id;
              originalCreatedAt = r.value.createdAt;
            }
          });

          if (!originalId) return;

          let editResult: ReturnType<typeof result.current.editTask> | undefined;
          act(() => {
            editResult = result.current.editTask(originalId, {
              title: newTitle,
              dueDate: futureISODate(daysAhead),
            });
          });

          expect(editResult).toBeDefined();
          expect(editResult!.ok).toBe(true);

          if (editResult!.ok) {
            expect(editResult!.value.id).toBe(originalId);
            expect(editResult!.value.createdAt).toBe(originalCreatedAt);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

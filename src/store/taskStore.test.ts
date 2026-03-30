// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { loadTasks, saveTasks } from './taskStore';
import type { Task, TaskStatus } from '../types';

const taskArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1 }).filter((s: string) => s.trim().length > 0),
  description: fc.option(fc.string(), { nil: undefined }),
  status: fc.constantFrom('pending', 'completed', 'postponed') as fc.Arbitrary<TaskStatus>,
  scheduledAt: fc.date().map((d: Date) => d.toISOString()),
  dueDate: fc.date().map((d: Date) => d.toISOString().split('T')[0]),
  createdAt: fc.date().map((d: Date) => d.toISOString()),
  completedAt: fc.option(fc.date().map((d: Date) => d.toISOString()), { nil: undefined }),
});

describe('taskStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Task 2.4: Inicialização com localStorage vazio
  it('loadTasks retorna [] quando não há dados no localStorage', () => {
    // Validates: Requirements 7.4
    // Ensure the key is not set
    localStorage.removeItem('TASK_MANAGER_TASKS');
    const result = loadTasks();
    expect(result).toEqual([]);
  });

  // Feature: task-manager, Property 13: Dados corrompidos resultam em lista vazia
  it('dados corrompidos no localStorage resultam em lista vazia sem lançar exceção', () => {
    // Validates: Requirements 7.5
    fc.assert(
      fc.property(
        fc.oneof(
          // Random strings (most won't be valid JSON)
          fc.string(),
          // Valid JSON but not a task array
          fc.jsonValue().filter((v: fc.JsonValue) => !Array.isArray(v)).map((v: fc.JsonValue) => JSON.stringify(v)),
          // Arrays of non-task objects
          fc.array(fc.jsonValue().filter((v: fc.JsonValue) => v === null || typeof v !== 'object' || Array.isArray(v))).map((v: fc.JsonValue[]) => JSON.stringify(v)),
          // Explicitly invalid JSON strings
          fc.constantFrom('{invalid', 'null', '123', 'true', 'undefined', '', '[]invalid', '{},'),
        ),
        (corruptedString: string) => {
          localStorage.clear();
          localStorage.setItem('TASK_MANAGER_TASKS', corruptedString);
          const result = loadTasks();
          expect(result).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: task-manager, Property 12: Serialização round-trip
  it('serialização round-trip: saveTasks seguido de loadTasks retorna tasks equivalentes', () => {
    // Validates: Requirements 7.1, 7.2, 7.3
    fc.assert(
      fc.property(
        fc.array(taskArbitrary),
        (tasks: Task[]) => {
          localStorage.clear();
          saveTasks(tasks);
          const loaded = loadTasks();

          expect(loaded).toHaveLength(tasks.length);

          for (let i = 0; i < tasks.length; i++) {
            expect(loaded[i].id).toBe(tasks[i].id);
            expect(loaded[i].title).toBe(tasks[i].title);
            expect(loaded[i].description).toBe(tasks[i].description);
            expect(loaded[i].status).toBe(tasks[i].status);
            expect(loaded[i].scheduledAt).toBe(tasks[i].scheduledAt);
            expect(loaded[i].dueDate).toBe(tasks[i].dueDate);
            expect(loaded[i].createdAt).toBe(tasks[i].createdAt);
            expect(loaded[i].completedAt).toBe(tasks[i].completedAt);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

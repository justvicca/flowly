import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { TaskItem } from './TaskItem';

describe('TaskItem — Property 8', () => {
  // Feature: task-manager, Property 8: Task completed não exibe ação de concluir ativa
  it('does not show an enabled complete button for completed tasks', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuidV(4),
          title: fc.string({ minLength: 1 }),
          description: fc.option(fc.string(), { nil: undefined }),
          status: fc.constant('completed' as const),
          scheduledAt: fc.date().map(d => d.toISOString()),
          dueDate: fc.date().map(d => d.toISOString().split('T')[0]),
          createdAt: fc.date().map(d => d.toISOString()),
          completedAt: fc.date().map(d => d.toISOString()),
        }),
        (task) => {
          const { unmount } = render(
            <TaskItem
              task={task}
              onComplete={vi.fn()}
              onPostpone={vi.fn()}
              onEdit={vi.fn()}
              onRemove={vi.fn()}
            />
          );

          const completeButton = screen.getByRole('button', { name: /concluir tarefa/i });
          expect(completeButton).toBeDisabled();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

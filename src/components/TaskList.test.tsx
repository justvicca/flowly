import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { Task } from '../types';
import { TaskList } from './TaskList';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Tarefa de teste',
  description: undefined,
  status: 'pending',
  scheduledAt: new Date().toISOString(),
  dueDate: '2099-12-31',
  createdAt: new Date().toISOString(),
  ...overrides,
});

const noop = vi.fn();

describe('TaskList', () => {
  it('exibe mensagem quando a lista está vazia (Req 2.5)', () => {
    render(
      <TaskList
        tasks={[]}
        onComplete={noop}
        onPostpone={noop}
        onEdit={noop}
        onRemove={noop}
      />
    );

    expect(
      screen.getByText(/nenhuma tarefa encontrada para o filtro selecionado/i)
    ).toBeInTheDocument();
  });

  it('renderiza um TaskItem para cada task (Req 2.1)', () => {
    const tasks = [
      makeTask({ id: '1', title: 'Tarefa A' }),
      makeTask({ id: '2', title: 'Tarefa B' }),
      makeTask({ id: '3', title: 'Tarefa C' }),
    ];

    render(
      <TaskList
        tasks={tasks}
        onComplete={noop}
        onPostpone={noop}
        onEdit={noop}
        onRemove={noop}
      />
    );

    expect(screen.getByText('Tarefa A')).toBeInTheDocument();
    expect(screen.getByText('Tarefa B')).toBeInTheDocument();
    expect(screen.getByText('Tarefa C')).toBeInTheDocument();
  });

  it('não exibe mensagem de vazio quando há tasks (Req 2.5)', () => {
    const tasks = [makeTask({ id: '1', title: 'Tarefa X' })];

    render(
      <TaskList
        tasks={tasks}
        onComplete={noop}
        onPostpone={noop}
        onEdit={noop}
        onRemove={noop}
      />
    );

    expect(
      screen.queryByText(/nenhuma tarefa encontrada/i)
    ).not.toBeInTheDocument();
  });

  it('exibe título, status, scheduledAt e dueDate de cada task (Req 2.2)', () => {
    const tasks = [
      makeTask({
        id: '1',
        title: 'Minha Tarefa',
        description: 'Descrição aqui',
        status: 'pending',
      }),
    ];

    render(
      <TaskList
        tasks={tasks}
        onComplete={noop}
        onPostpone={noop}
        onEdit={noop}
        onRemove={noop}
      />
    );

    expect(screen.getByText('Minha Tarefa')).toBeInTheDocument();
    expect(screen.getByText('Descrição aqui')).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });
});

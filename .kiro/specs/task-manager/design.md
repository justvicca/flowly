# Design Document — Task Manager

## Overview

O Task Manager é uma aplicação web SPA (Single Page Application) construída com React e TypeScript, sem backend. Toda a persistência é feita via `localStorage`. O sistema permite criar, listar, editar, concluir, adiar e remover tarefas, com interface responsiva para desktop e mobile.

A arquitetura segue o padrão de separação entre camada de dados (Task_Store), lógica de negócio (hooks/context) e apresentação (componentes React). Não há autenticação, múltiplos usuários ou comunicação com servidores externos.

---

## Architecture

```mermaid
graph TD
    UI[React Components]
    Hook[useTaskManager Hook]
    Store[TaskStore Module]
    LS[(localStorage)]

    UI -->|actions| Hook
    Hook -->|read/write| Store
    Store -->|JSON serialize/deserialize| LS
    Store -->|Task[]| Hook
    Hook -->|state| UI
```

O fluxo de dados é unidirecional:
1. Componentes disparam ações via hook
2. O hook aplica regras de negócio e delega persistência ao TaskStore
3. O TaskStore serializa/desserializa JSON no localStorage
4. O estado atualizado retorna ao hook e re-renderiza os componentes

---

## Components and Interfaces

### TaskStore (módulo puro, sem React)

Responsável exclusivamente por ler e gravar no localStorage. Não contém lógica de negócio.

```typescript
interface TaskStore {
  loadTasks(): Task[];
  saveTasks(tasks: Task[]): void;
}
```

### useTaskManager (custom hook)

Centraliza toda a lógica de negócio. Expõe estado e ações para os componentes.

```typescript
interface TaskManagerState {
  tasks: Task[];
  filter: StatusFilter;
  filteredTasks: Task[];
}

interface TaskManagerActions {
  addTask(input: TaskInput): Result<Task, ValidationError[]>;
  removeTask(id: string): void;
  completeTask(id: string): void;
  postponeTask(id: string, newScheduledAt: Date): Result<void, ValidationError>;
  editTask(id: string, input: Partial<TaskInput>): Result<Task, ValidationError[]>;
  setFilter(filter: StatusFilter): void;
}
```

### TaskList (componente)

Renderiza a lista de tarefas filtradas. Recebe `tasks`, `filter` e callbacks de ação.

### TaskItem (componente)

Renderiza uma tarefa individual com botões de ação (concluir, adiar, editar, remover).

### TaskForm (componente)

Formulário de criação e edição. Recebe `initialValues` (opcional, para modo edição) e callback `onSubmit`.

### ConfirmDialog (componente)

Dialog genérico de confirmação usado na remoção de tarefas.

### PostponeDialog (componente)

Dialog com seletor de data/hora para adiamento de tarefa.

### FilterBar (componente)

Barra de filtros por status (`all`, `pending`, `completed`, `postponed`).

---

## Data Models

### Task

```typescript
type TaskStatus = 'pending' | 'completed' | 'postponed';

interface Task {
  id: string;           // UUID v4 gerado automaticamente
  title: string;        // obrigatório, não vazio
  description?: string; // opcional
  status: TaskStatus;
  scheduledAt: string;  // ISO 8601
  dueDate: string;      // ISO 8601 (data)
  createdAt: string;    // ISO 8601, imutável após criação
  completedAt?: string; // ISO 8601, preenchido ao concluir
}
```

### TaskInput (formulário)

```typescript
interface TaskInput {
  title: string;
  description?: string;
  scheduledAt: string;
  dueDate: string;
}
```

### StatusFilter

```typescript
type StatusFilter = 'all' | TaskStatus;
```

### ValidationError

```typescript
interface ValidationError {
  field: string;
  message: string;
}
```

### Result

```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

### Chave no localStorage

```
TASK_MANAGER_TASKS  →  JSON.stringify(Task[])
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Criação produz task com estado inicial correto

*Para qualquer* título não vazio e datas válidas, ao criar uma task o resultado deve ter `status = "pending"`, `id` não vazio e `createdAt` preenchido com o instante da criação.

**Validates: Requirements 1.2**

---

### Property 2: Título vazio ou whitespace é rejeitado

*Para qualquer* string composta inteiramente de espaços em branco (incluindo string vazia), tentar criar uma task com esse título deve ser rejeitado e a lista de tasks deve permanecer inalterada.

**Validates: Requirements 1.3**

---

### Property 3: due_date no passado é rejeitada

*Para qualquer* data anterior ao instante atual, tentar criar ou editar uma task com esse `dueDate` deve retornar erro de validação e a task não deve ser criada ou modificada.

**Validates: Requirements 1.4, 6.3**

---

### Property 4: Filtro de status retorna apenas tasks correspondentes

*Para qualquer* lista de tasks e qualquer filtro de status (`pending`, `completed`, `postponed`), todas as tasks retornadas pelo filtro devem ter exatamente o status selecionado.

**Validates: Requirements 2.4**

---

### Property 5: Remoção confirmada elimina a task

*Para qualquer* task existente na lista, após confirmar a remoção essa task não deve mais aparecer na lista de tasks.

**Validates: Requirements 3.2**

---

### Property 6: Cancelar remoção mantém a task inalterada

*Para qualquer* task existente, cancelar o diálogo de confirmação de remoção deve deixar a lista de tasks idêntica ao estado anterior.

**Validates: Requirements 3.3**

---

### Property 7: Concluir task atualiza status e registra completed_at

*Para qualquer* task com status `pending` ou `postponed`, ao concluí-la o status deve ser `"completed"` e `completedAt` deve ser preenchido com um instante não nulo.

**Validates: Requirements 4.1**

---

### Property 8: Task completed não exibe ação de concluir ativa

*Para qualquer* task com status `completed`, o componente TaskItem renderizado não deve conter um botão de concluir habilitado.

**Validates: Requirements 4.3**

---

### Property 9: Adiar com data passada é rejeitado

*Para qualquer* data/hora anterior ao instante atual, tentar adiar uma task com esse valor deve retornar erro e a task deve permanecer com seus valores originais de `scheduledAt` e `status`.

**Validates: Requirements 5.2**

---

### Property 10: Adiar com data futura atualiza scheduled_at e status

*Para qualquer* task e qualquer data/hora futura válida, após adiar a task seu `scheduledAt` deve ser igual à nova data informada e seu `status` deve ser `"postponed"`.

**Validates: Requirements 5.3**

---

### Property 11: Edição preserva ID e created_at

*Para qualquer* task e qualquer conjunto de alterações válidas, após editar a task seu `id` e `createdAt` devem ser idênticos aos valores originais.

**Validates: Requirements 6.2**

---

### Property 12: Serialização round-trip

*Para qualquer* lista de tasks válidas, serializar para JSON e depois desserializar deve produzir uma lista de objetos equivalentes aos originais (mesmos campos e valores).

**Validates: Requirements 7.1, 7.2, 7.3**

---

### Property 13: Dados corrompidos resultam em lista vazia

*Para qualquer* string que não seja um JSON válido de tasks (incluindo JSON malformado, tipos incorretos ou campos ausentes), ao carregar o localStorage o TaskStore deve retornar uma lista vazia sem lançar exceção.

**Validates: Requirements 7.5**

---

### Property 14: Formulário de edição pré-preenchido com dados atuais

*Para qualquer* task existente, ao abrir o TaskForm em modo de edição os valores iniciais dos campos devem ser iguais aos valores atuais da task (`title`, `description`, `scheduledAt`, `dueDate`).

**Validates: Requirements 6.1**

---

## Error Handling

| Situação | Comportamento |
|---|---|
| Título vazio/whitespace | Erro de validação no TaskForm, criação bloqueada |
| `dueDate` no passado | Erro de validação no TaskForm, criação/edição bloqueada |
| `scheduledAt` no passado ao adiar | Erro no PostponeDialog, task não alterada |
| localStorage corrompido | TaskStore ignora dados, inicializa com `[]`, loga aviso no console |
| localStorage indisponível (ex: modo privado bloqueado) | TaskStore captura exceção, opera em memória e exibe aviso ao usuário |
| ID inexistente em operações de mutação | Operação ignorada silenciosamente (estado já consistente) |

Todas as validações retornam `Result<T, ValidationError[]>` — nunca lançam exceções para o chamador.

---

## Testing Strategy

### Abordagem dual

O projeto usa dois tipos complementares de teste:

- **Testes unitários/de exemplo**: verificam comportamentos específicos, casos de borda e integração entre componentes
- **Testes de propriedade (PBT)**: verificam propriedades universais com entradas geradas aleatoriamente

### Biblioteca de PBT

**[fast-check](https://github.com/dubzzz/fast-check)** — biblioteca de property-based testing para TypeScript/JavaScript.

```bash
npm install --save-dev fast-check
```

### Testes unitários (exemplos e edge cases)

Focados em:
- Renderização correta do TaskForm com campos esperados (Req 1.1)
- Presença dos controles de filtro na FilterBar (Req 2.3)
- Exibição de mensagem quando lista filtrada está vazia (Req 2.5)
- Exibição do ConfirmDialog ao acionar remoção (Req 3.1)
- Exibição do PostponeDialog ao acionar adiamento (Req 5.1)
- Inicialização com lista vazia quando localStorage está vazio (Req 7.4)

### Testes de propriedade

Cada propriedade do design deve ser implementada como um único teste de propriedade com **mínimo de 100 iterações**.

Formato de tag obrigatório em cada teste:

```
// Feature: task-manager, Property N: <texto da propriedade>
```

Exemplo de implementação:

```typescript
// Feature: task-manager, Property 2: Título vazio ou whitespace é rejeitado
it('rejeita títulos compostos apenas de whitespace', () => {
  fc.assert(
    fc.property(
      fc.stringMatching(/^\s*$/), // gera strings de whitespace
      (title) => {
        const result = validateTaskInput({ title, scheduledAt: futureDate(), dueDate: futureDate() });
        expect(result.ok).toBe(false);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Cobertura esperada

| Propriedade | Tipo de teste | Req |
|---|---|---|
| P1 — Criação com estado inicial correto | property | 1.2 |
| P2 — Título whitespace rejeitado | property | 1.3 |
| P3 — due_date passada rejeitada | property | 1.4, 6.3 |
| P4 — Filtro retorna status correto | property | 2.4 |
| P5 — Remoção confirmada elimina task | property | 3.2 |
| P6 — Cancelar remoção mantém task | property | 3.3 |
| P7 — Concluir atualiza status e completed_at | property | 4.1 |
| P8 — Task completed sem botão ativo | property | 4.3 |
| P9 — Adiar com data passada rejeitado | property | 5.2 |
| P10 — Adiar com data futura atualiza campos | property | 5.3 |
| P11 — Edição preserva ID e created_at | property | 6.2 |
| P12 — Serialização round-trip | property | 7.1–7.3 |
| P13 — Dados corrompidos → lista vazia | property | 7.5 |
| P14 — Form de edição pré-preenchido | property | 6.1 |
| Campos do formulário presentes | example | 1.1 |
| Controles de filtro presentes | example | 2.3 |
| Mensagem de lista vazia | example | 2.5 |
| ConfirmDialog ao remover | example | 3.1 |
| PostponeDialog ao adiar | example | 5.1 |
| Inicialização com localStorage vazio | example | 7.4 |

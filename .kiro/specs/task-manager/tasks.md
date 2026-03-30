# Plano de Implementação: Task Manager

## Visão Geral

Implementação de uma SPA React + TypeScript para gestão de tarefas com persistência em localStorage. A implementação segue a arquitetura definida no design: TaskStore (camada de dados) → useTaskManager (lógica de negócio) → componentes React (apresentação).

## Tarefas

- [x] 1. Configurar estrutura do projeto e tipos base
  - Criar estrutura de diretórios: `src/types`, `src/store`, `src/hooks`, `src/components`, `src/utils`
  - Definir interfaces e tipos em `src/types/index.ts`: `Task`, `TaskStatus`, `TaskInput`, `StatusFilter`, `ValidationError`, `Result<T,E>`
  - Configurar dependência `fast-check` para testes de propriedade
  - _Requirements: 1.2, 4.1, 5.3, 7.1_

- [x] 2. Implementar TaskStore (persistência localStorage)
  - [x] 2.1 Implementar módulo `src/store/taskStore.ts`
    - Implementar `loadTasks(): Task[]` com desserialização JSON e tratamento de dados corrompidos
    - Implementar `saveTasks(tasks: Task[]): void` com serialização JSON
    - Usar chave `TASK_MANAGER_TASKS` no localStorage
    - Tratar `localStorage` indisponível (modo privado): operar em memória
    - _Requirements: 7.1, 7.2, 7.4, 7.5_

  - [x] 2.2 Escrever property test para serialização round-trip (Property 12)
    - **Property 12: Serialização round-trip**
    - **Validates: Requirements 7.1, 7.2, 7.3**

  - [x] 2.3 Escrever property test para dados corrompidos (Property 13)
    - **Property 13: Dados corrompidos resultam em lista vazia**
    - **Validates: Requirements 7.5**

  - [x] 2.4 Escrever teste de exemplo para inicialização com localStorage vazio
    - Verificar que `loadTasks()` retorna `[]` quando não há dados
    - _Requirements: 7.4_

- [x] 3. Implementar funções de validação
  - [x] 3.1 Criar `src/utils/validation.ts` com `validateTaskInput` e `validatePostponeDate`
    - `validateTaskInput`: rejeitar título vazio/whitespace, rejeitar `dueDate` no passado
    - `validatePostponeDate`: rejeitar data/hora anterior ao instante atual
    - Retornar `Result<T, ValidationError[]>` — nunca lançar exceções
    - _Requirements: 1.3, 1.4, 5.2, 6.3_

  - [x] 3.2 Escrever property test para título whitespace rejeitado (Property 2)
    - **Property 2: Título vazio ou whitespace é rejeitado**
    - **Validates: Requirements 1.3**

  - [x] 3.3 Escrever property test para due_date no passado rejeitada (Property 3)
    - **Property 3: due_date no passado é rejeitada**
    - **Validates: Requirements 1.4, 6.3**

  - [x] 3.4 Escrever property test para adiar com data passada rejeitado (Property 9)
    - **Property 9: Adiar com data passada é rejeitado**
    - **Validates: Requirements 5.2**

- [x] 4. Implementar hook useTaskManager
  - [x] 4.1 Criar `src/hooks/useTaskManager.ts`
    - Implementar estado: `tasks`, `filter`, `filteredTasks` (derivado)
    - Implementar `addTask`: gerar UUID v4, definir `status = "pending"`, `createdAt = now()`
    - Implementar `removeTask`, `completeTask` (define `completedAt = now()`), `editTask`, `setFilter`
    - Implementar `postponeTask`: validar data futura, atualizar `scheduledAt` e `status = "postponed"`
    - Persistir via TaskStore após cada mutação
    - _Requirements: 1.2, 2.4, 3.2, 4.1, 5.3, 6.2_

  - [x] 4.2 Escrever property test para criação com estado inicial correto (Property 1)
    - **Property 1: Criação produz task com estado inicial correto**
    - **Validates: Requirements 1.2**

  - [x] 4.3 Escrever property test para filtro de status (Property 4)
    - **Property 4: Filtro de status retorna apenas tasks correspondentes**
    - **Validates: Requirements 2.4**

  - [x] 4.4 Escrever property test para remoção confirmada (Property 5)
    - **Property 5: Remoção confirmada elimina a task**
    - **Validates: Requirements 3.2**

  - [x] 4.5 Escrever property test para cancelar remoção mantém task (Property 6)
    - **Property 6: Cancelar remoção mantém a task inalterada**
    - **Validates: Requirements 3.3**

  - [x] 4.6 Escrever property test para concluir task (Property 7)
    - **Property 7: Concluir task atualiza status e registra completed_at**
    - **Validates: Requirements 4.1**

  - [x] 4.7 Escrever property test para adiar com data futura (Property 10)
    - **Property 10: Adiar com data futura atualiza scheduled_at e status**
    - **Validates: Requirements 5.3**

  - [x] 4.8 Escrever property test para edição preserva ID e created_at (Property 11)
    - **Property 11: Edição preserva ID e created_at**
    - **Validates: Requirements 6.2**

- [x] 5. Checkpoint — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [x] 6. Implementar componentes de UI base
  - [x] 6.1 Criar `src/components/FilterBar.tsx`
    - Renderizar botões/tabs para filtros: `all`, `pending`, `completed`, `postponed`
    - Destacar filtro ativo
    - _Requirements: 2.3, 2.4_

  - [x] 6.2 Escrever teste de exemplo para controles de filtro presentes
    - Verificar que FilterBar renderiza os quatro controles de filtro
    - _Requirements: 2.3_

  - [x] 6.3 Criar `src/components/ConfirmDialog.tsx`
    - Dialog genérico com props `message`, `onConfirm`, `onCancel`
    - _Requirements: 3.1, 3.3_

  - [x] 6.4 Escrever teste de exemplo para ConfirmDialog ao remover
    - Verificar que ConfirmDialog é exibido ao acionar remoção
    - _Requirements: 3.1_

  - [x] 6.5 Criar `src/components/PostponeDialog.tsx`
    - Seletor de data/hora com validação de data futura
    - Exibir mensagem de erro se data for passada
    - _Requirements: 5.1, 5.2_

  - [x] 6.6 Escrever teste de exemplo para PostponeDialog ao adiar
    - Verificar que PostponeDialog é exibido ao acionar adiamento
    - _Requirements: 5.1_

- [x] 7. Implementar TaskForm
  - [x] 7.1 Criar `src/components/TaskForm.tsx`
    - Campos: título (obrigatório), descrição (opcional), `scheduledAt` (datetime, obrigatório), `dueDate` (date, obrigatório)
    - Aceitar `initialValues` opcional para modo de edição
    - Exibir erros de validação inline por campo
    - Chamar `onSubmit` apenas com dados válidos
    - _Requirements: 1.1, 1.3, 1.4, 6.1, 6.3_

  - [x] 7.2 Escrever teste de exemplo para campos do formulário presentes
    - Verificar que TaskForm renderiza todos os campos esperados
    - _Requirements: 1.1_

  - [x] 7.3 Escrever property test para formulário de edição pré-preenchido (Property 14)
    - **Property 14: Formulário de edição pré-preenchido com dados atuais**
    - **Validates: Requirements 6.1**

- [x] 8. Implementar TaskItem e TaskList
  - [x] 8.1 Criar `src/components/TaskItem.tsx`
    - Exibir título, descrição, status, `scheduledAt`, `dueDate`
    - Botões de ação: concluir (desabilitado/oculto se `completed`), adiar, editar, remover
    - _Requirements: 2.2, 4.3_

  - [x] 8.2 Escrever property test para task completed sem botão ativo (Property 8)
    - **Property 8: Task completed não exibe ação de concluir ativa**
    - **Validates: Requirements 4.3**

  - [x] 8.3 Criar `src/components/TaskList.tsx`
    - Renderizar lista de `TaskItem` com base nas tasks filtradas
    - Exibir mensagem quando lista filtrada está vazia
    - Adaptar layout para coluna única em viewport < 768px (CSS responsivo)
    - _Requirements: 2.1, 2.2, 2.5, 8.2_

  - [x] 8.4 Escrever teste de exemplo para mensagem de lista vazia
    - Verificar que mensagem é exibida quando nenhuma task corresponde ao filtro
    - _Requirements: 2.5_

- [x] 9. Montar App principal e integrar componentes
  - [x] 9.1 Criar `src/App.tsx` integrando `useTaskManager`, `FilterBar`, `TaskList`, `TaskForm`, `ConfirmDialog`, `PostponeDialog`
    - Gerenciar estado de UI: modal de criação/edição aberto, task selecionada para remoção/adiamento
    - Garantir layout responsivo (viewport 320px–1920px)
    - _Requirements: 1.1, 2.1, 3.1, 5.1, 8.1, 8.3_

- [x] 10. Checkpoint final — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia os requisitos específicos para rastreabilidade
- Os testes de propriedade usam `fast-check` com mínimo de 100 iterações (`{ numRuns: 100 }`)
- Cada teste de propriedade deve incluir o comentário: `// Feature: task-manager, Property N: <texto>`
- Testes unitários e de propriedade são complementares — ambos cobrem aspectos distintos

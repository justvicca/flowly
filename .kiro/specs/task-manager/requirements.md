# Requirements Document

## Introduction

Sistema de gestão de tarefas (Task Manager) com interface web responsiva, permitindo ao usuário criar, visualizar, editar, concluir, adiar e remover tarefas. Cada tarefa possui título, descrição opcional, status, datas de agendamento e vencimento. A persistência é feita via localStorage, sem necessidade de backend ou autenticação.

## Glossary

- **Task_Manager**: O sistema de gestão de tarefas como um todo
- **Task**: Uma unidade de trabalho com título, descrição opcional, status, data de agendamento e data de vencimento
- **Task_Store**: Módulo responsável por ler e gravar tarefas no localStorage
- **Task_List**: Componente de listagem de tarefas na interface
- **Task_Form**: Formulário de criação e edição de tarefas
- **Status**: Estado atual de uma tarefa — `pending` (pendente), `completed` (concluída) ou `postponed` (adiada)
- **Scheduled_At**: Data e horário agendado para execução da tarefa
- **Due_Date**: Data de vencimento da tarefa
- **Completed_At**: Data e horário em que a tarefa foi marcada como concluída

---

## Requirements

### Requirement 1: Criar Tarefa

**User Story:** Como usuário, quero adicionar uma nova tarefa com título, descrição, horário agendado e data de vencimento, para que eu possa organizar minhas atividades.

#### Acceptance Criteria

1. THE Task_Form SHALL exibir campos para título (obrigatório), descrição (opcional), `scheduled_at` (data e horário, obrigatório) e `due_date` (data de vencimento, obrigatório)
2. WHEN o usuário submete o formulário com título preenchido, THE Task_Manager SHALL criar uma Task com ID único gerado automaticamente, status `pending` e `created_at` igual ao instante da criação
3. IF o usuário submete o formulário sem preencher o título, THEN THE Task_Form SHALL exibir uma mensagem de erro indicando que o título é obrigatório e SHALL impedir a criação da tarefa
4. IF o usuário submete o formulário com `due_date` anterior à data atual, THEN THE Task_Form SHALL exibir uma mensagem de erro indicando data de vencimento inválida
5. WHEN uma Task é criada com sucesso, THE Task_Store SHALL persistir a Task no localStorage

---

### Requirement 2: Listar Tarefas

**User Story:** Como usuário, quero visualizar todas as minhas tarefas em uma lista, para que eu possa acompanhar o que precisa ser feito.

#### Acceptance Criteria

1. THE Task_List SHALL exibir todas as Tasks armazenadas no localStorage ao carregar a aplicação
2. THE Task_List SHALL exibir para cada Task: título, descrição (quando presente), status, `scheduled_at` e `due_date`
3. THE Task_List SHALL oferecer filtros por status: todas, `pending`, `completed` e `postponed`
4. WHEN o usuário seleciona um filtro de status, THE Task_List SHALL exibir somente as Tasks cujo status corresponde ao filtro selecionado
5. WHILE nenhuma Task corresponde ao filtro ativo, THE Task_List SHALL exibir uma mensagem informando que não há tarefas para o filtro selecionado

---

### Requirement 3: Remover Tarefa

**User Story:** Como usuário, quero remover uma tarefa da lista, para que eu possa eliminar itens que não são mais relevantes.

#### Acceptance Criteria

1. WHEN o usuário aciona a ação de remover uma Task na Task_List, THE Task_Manager SHALL exibir uma confirmação antes de prosseguir com a remoção
2. WHEN o usuário confirma a remoção, THE Task_Store SHALL remover a Task do localStorage e THE Task_List SHALL atualizar a listagem imediatamente
3. IF o usuário cancela a confirmação de remoção, THEN THE Task_Manager SHALL manter a Task inalterada

---

### Requirement 4: Marcar Tarefa como Concluída

**User Story:** Como usuário, quero marcar uma tarefa como concluída diretamente na listagem, para que eu possa registrar o progresso das minhas atividades.

#### Acceptance Criteria

1. WHEN o usuário aciona a ação de concluir uma Task com status `pending` ou `postponed`, THE Task_Manager SHALL alterar o status da Task para `completed` e SHALL registrar o instante atual em `completed_at`
2. WHEN uma Task é marcada como `completed`, THE Task_Store SHALL persistir a atualização no localStorage
3. WHILE uma Task possui status `completed`, THE Task_List SHALL exibir a ação de concluir como desabilitada ou oculta para essa Task

---

### Requirement 5: Adiar Tarefa

**User Story:** Como usuário, quero adiar uma tarefa informando uma nova data e horário futuros, para que eu possa reorganizar minha agenda quando necessário.

#### Acceptance Criteria

1. WHEN o usuário aciona a ação de adiar uma Task, THE Task_Manager SHALL exibir um seletor de nova data e horário para `scheduled_at`
2. IF o usuário confirma o adiamento com uma data e horário anteriores ao instante atual, THEN THE Task_Manager SHALL exibir uma mensagem de erro indicando que o novo horário deve ser futuro e SHALL manter a Task inalterada
3. WHEN o usuário confirma o adiamento com uma data e horário futuros válidos, THE Task_Manager SHALL atualizar `scheduled_at` da Task e SHALL alterar o status para `postponed`
4. WHEN uma Task é adiada com sucesso, THE Task_Store SHALL persistir a atualização no localStorage

---

### Requirement 6: Editar Horário de uma Tarefa

**User Story:** Como usuário, quero editar o horário agendado e a data de vencimento de uma tarefa existente, para que eu possa ajustar o planejamento sem precisar recriar a tarefa.

#### Acceptance Criteria

1. WHEN o usuário aciona a ação de editar uma Task, THE Task_Form SHALL ser preenchido com os dados atuais da Task selecionada
2. WHEN o usuário salva as alterações com dados válidos, THE Task_Manager SHALL atualizar os campos modificados da Task e SHALL manter o ID e `created_at` originais
3. IF o usuário salva as alterações com `due_date` anterior à data atual, THEN THE Task_Form SHALL exibir uma mensagem de erro e SHALL impedir a atualização
4. WHEN uma Task é editada com sucesso, THE Task_Store SHALL persistir a atualização no localStorage

---

### Requirement 7: Persistência de Dados

**User Story:** Como usuário, quero que minhas tarefas sejam salvas localmente no navegador, para que eu não perca os dados ao recarregar a página.

#### Acceptance Criteria

1. THE Task_Store SHALL serializar todas as Tasks em formato JSON e armazená-las em uma chave dedicada no localStorage
2. WHEN a aplicação é inicializada, THE Task_Store SHALL desserializar as Tasks do localStorage e disponibilizá-las para o Task_Manager
3. FOR ALL Tasks válidas, serializar e depois desserializar uma Task SHALL produzir um objeto equivalente ao original (propriedade de round-trip)
4. IF o localStorage não contém dados de Tasks ao inicializar, THEN THE Task_Store SHALL inicializar com uma lista vazia de Tasks
5. IF os dados no localStorage estão corrompidos ou em formato inválido, THEN THE Task_Store SHALL ignorar os dados inválidos, inicializar com lista vazia e SHALL registrar um aviso no console

---

### Requirement 8: Interface Responsiva

**User Story:** Como usuário, quero acessar o Task Manager em diferentes tamanhos de tela, para que eu possa gerenciar minhas tarefas tanto no desktop quanto no mobile.

#### Acceptance Criteria

1. THE Task_Manager SHALL renderizar corretamente em viewports com largura mínima de 320px e máxima de 1920px
2. WHILE a viewport possui largura inferior a 768px, THE Task_List SHALL adaptar o layout para exibição em coluna única
3. THE Task_Form SHALL ser acessível e utilizável em dispositivos de toque (touch devices)

# Plano de Implementação: Flowly Finance App

## Visão Geral

Implementação incremental do Flowly em React + TypeScript + Vite, seguindo a arquitetura em camadas definida no design: tipos centrais → validação → repositório → engine de recorrência → hook principal → componentes de UI → layout adaptativo.

## Tarefas

- [x] 1. Definir tipos centrais e estrutura de pastas
  - Criar `src/types/flowly.ts` com as interfaces `Transaction`, `TransactionInput`, `Wallet`, `FlowlyState`, `ValidationResult` e `TransactionFilter`
  - Criar as pastas `src/repository/`, `src/engine/`, `src/components/layout/`, `src/components/transactions/`, `src/components/wallets/`, `src/components/shared/`
  - _Requisitos: 1.1, 1.2, 2.1_

- [x] 2. Implementar camada de validação
  - [x] 2.1 Criar `src/engine/TransactionValidator.ts`
    - Implementar função `validarTransacao(input: TransactionInput): ValidationResult`
    - Rejeitar `valor <= 0`, `tipo` inválido, `data` fora do formato `YYYY-MM-DD`, `descricao` vazia e `carteira_origem` vazia
    - _Requisitos: 1.3, 1.4, 1.5_

  - [x] 2.2 Escrever testes de propriedade para `TransactionValidator`
    - **Propriedade 1: Qualquer valor ≤ 0 sempre resulta em `valido: false`**
    - **Valida: Requisito 1.3**
    - **Propriedade 2: Qualquer string que não seja "entrada" ou "saida" no campo `tipo` sempre resulta em `valido: false`**
    - **Valida: Requisito 1.4**
    - **Propriedade 3: Qualquer string que não siga o padrão `YYYY-MM-DD` no campo `data` sempre resulta em `valido: false`**
    - **Valida: Requisito 1.5**

  - [x] 2.3 Escrever testes unitários para `TransactionValidator`
    - Testar casos de borda: valor 0, valor negativo, tipo em maiúsculas, data com separador errado, descrição só com espaços
    - _Requisitos: 1.3, 1.4, 1.5_

- [x] 3. Implementar camada de repositório
  - [x] 3.1 Criar `src/repository/IFlowlyRepository.ts`
    - Definir a interface `IFlowlyRepository` com todos os métodos: `listarTransacoes`, `adicionarTransacao`, `atualizarTransacao`, `removerTransacao`, `listarCarteiras`, `adicionarCarteira`, `obterSaldoPorCarteira`
    - _Requisitos: 2.1, 2.5_

  - [x] 3.2 Criar `src/repository/MockFlowlyRepository.ts`
    - Implementar `IFlowlyRepository` com estado em memória
    - Inicializar com conjunto de transações e carteiras de exemplo cobrindo entradas, saídas e transações fixas
    - Implementar geração automática de `id` via `crypto.randomUUID()`
    - Implementar `obterSaldoPorCarteira` calculando soma de entradas menos soma de saídas
    - Rejeitar `adicionarCarteira` com nome duplicado retornando erro descritivo
    - _Requisitos: 2.2, 2.3, 2.4, 5.3, 5.4_

  - [x] 3.3 Escrever testes de propriedade para `MockFlowlyRepository`
    - **Propriedade 4: Round-trip de serialização — serializar e desserializar uma `Transaction` válida produz objeto equivalente ao original**
    - **Valida: Requisito 8.4**
    - **Propriedade 5: Saldo de carteira é sempre igual à soma das entradas menos a soma das saídas daquela carteira**
    - **Valida: Requisito 5.4**

  - [x] 3.4 Escrever testes unitários para `MockFlowlyRepository`
    - Testar `adicionarTransacao`, `removerTransacao`, `atualizarTransacao`, `adicionarCarteira` com nome duplicado, `obterSaldoPorCarteira` com carteira vazia
    - _Requisitos: 2.2, 2.3, 5.3, 8.1, 8.2, 8.3_

  - [x] 3.5 Criar `src/repository/RepositoryContext.tsx`
    - Implementar `RepositoryProvider` injetando `MockFlowlyRepository` via React Context
    - Implementar hook `useRepository()` com guard de contexto
    - _Requisitos: 2.5_

- [x] 4. Checkpoint — garantir que todos os testes passam
  - Garantir que todos os testes passam. Perguntar ao usuário se houver dúvidas.

- [x] 5. Implementar `RecurrenceEngine`
  - [x] 5.1 Criar `src/engine/RecurrenceEngine.ts`
    - Implementar `gerarOcorrenciasDoMes(transacoesFixas: Transaction[], mes: string): Transaction[]` que cria cópias com novas datas e novos `id`s para o mês informado
    - Implementar `atualizarRecorrencia(base: Transaction, novoValor: number, apenasAtual: boolean): Transaction[]` para edição de ocorrência única ou todas as futuras
    - _Requisitos: 4.1, 4.2, 4.3, 4.4_

  - [x] 5.2 Escrever testes de propriedade para `RecurrenceEngine`
    - **Propriedade 6: Para qualquer conjunto de transações fixas, o número de ocorrências geradas para um mês é sempre igual ao número de transações fixas de entrada**
    - **Valida: Requisito 4.2**
    - **Propriedade 7: Toda ocorrência gerada possui `id` único e diferente do `id` da transação base**
    - **Valida: Requisitos 1.2, 4.2**

  - [x] 5.3 Escrever testes unitários para `RecurrenceEngine`
    - Testar geração de ocorrências para mês corrente, edição de ocorrência única vs. todas as futuras
    - _Requisitos: 4.2, 4.3, 4.4_

- [x] 6. Implementar hook `useFlowly`
  - [x] 6.1 Criar `src/hooks/useFlowly.ts`
    - Implementar estado com `useReducer` seguindo `FlowlyState`
    - Implementar `adicionarTransacao` com chamada ao `TransactionValidator` antes de persistir
    - Implementar `copiarTransacao` retornando `TransactionInput` com `data` substituída pela data atual
    - Implementar `duplicarTransacao` criando nova transação sem abrir formulário
    - Implementar `moverTransacao` atualizando `carteira_origem`
    - Implementar `removerTransacao` via repositório
    - Implementar `adicionarCarteira` com tratamento de nome duplicado
    - Implementar `obterSaldoTotal` somando saldos de todas as carteiras
    - Integrar `RecurrenceEngine` para gerar ocorrências do mês ao inicializar
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 5.1, 5.2, 5.5_

  - [x] 6.2 Escrever testes unitários para `useFlowly`
    - Testar fluxo de adicionar transação válida, inválida, copiar, duplicar, mover e remover
    - Usar `MockFlowlyRepository` diretamente nos testes
    - _Requisitos: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 7. Implementar componentes de transação
  - [x] 7.1 Criar `src/components/transactions/TransactionForm.tsx`
    - Formulário com campos: descrição, valor, data, tipo (entrada/saída), carteira e recorrência (fixa ou não)
    - Exibir mensagem "Pronto! A transação foi salva." ao confirmar com sucesso
    - Manter dados do formulário em caso de erro do repositório
    - _Requisitos: 3.1, 3.2, 3.8, 7.1_

  - [x] 7.2 Criar `src/components/transactions/RecurrenceToggle.tsx`
    - Toggle visual para marcar transação como fixa
    - Exibir indicador visual distinto quando `fixo: true`
    - _Requisitos: 4.1_

  - [x] 7.3 Criar `src/components/transactions/TransactionItem.tsx`
    - Exibir dados da transação com botões de ação: Copiar, Duplicar, Mover, Apagar
    - Cada botão deve ter ícone e texto descritivo
    - Transações fixas devem ter indicador visual distinto
    - _Requisitos: 3.3, 3.4, 3.5, 3.6, 4.1, 7.1_

  - [x] 7.4 Criar `src/components/transactions/TransactionList.tsx`
    - Renderizar lista de `TransactionItem`
    - Integrar com `useFlowly` para obter transações e disparar ações
    - Ao acionar "Apagar", exibir `ConfirmDialog` antes de remover
    - Exibir mensagem "Pronto! A transação foi removida." após remoção confirmada
    - _Requisitos: 3.6, 3.7_

  - [x] 7.5 Escrever testes unitários para componentes de transação
    - Testar renderização de `TransactionItem` com e sem `fixo: true`
    - Testar que `ConfirmDialog` é exibido antes de remover
    - _Requisitos: 3.6, 4.1, 7.1_

- [x] 8. Implementar componentes de carteira
  - [x] 8.1 Criar `src/components/wallets/WalletCard.tsx`
    - Exibir nome da carteira e saldo formatado
    - _Requisitos: 5.1_

  - [x] 8.2 Criar `src/components/wallets/WalletList.tsx`
    - Listar `WalletCard` para cada carteira
    - Exibir saldo total consolidado
    - Incluir botão "Adicionar Carteira" com ícone e texto
    - _Requisitos: 5.1, 5.2, 5.3, 7.1_

- [x] 9. Implementar componentes compartilhados
  - [x] 9.1 Criar `src/components/shared/Toast.tsx`
    - Componente de notificação para mensagens de sucesso e erro
    - Mensagens de sucesso no formato "Pronto! [ação concluída]."
    - Mensagens de erro em linguagem simples com sugestão de ação corretiva
    - _Requisitos: 7.4, 7.5_

  - [x] 9.2 Criar `src/components/shared/SyncIndicator.tsx`
    - Indicador visual de sincronização em andamento
    - Não bloquear interação do usuário enquanto exibido
    - _Requisitos: 6.4_

- [x] 10. Implementar layout adaptativo
  - [x] 10.1 Criar `src/hooks/useMediaQuery.ts`
    - Hook que detecta se o dispositivo é mobile ou desktop/tablet
    - _Requisitos: 7.2, 7.3_

  - [x] 10.2 Criar `src/components/layout/Sidebar.tsx`
    - Barra lateral fixa com navegação principal para telas largas
    - _Requisitos: 7.2_

  - [x] 10.3 Criar `src/components/layout/BottomTabs.tsx`
    - Abas de navegação inferiores com largura total para mobile
    - _Requisitos: 7.3_

  - [x] 10.4 Criar `src/components/layout/AppLayout.tsx`
    - Usar `useMediaQuery` para decidir entre `Sidebar` e `BottomTabs`
    - _Requisitos: 7.2, 7.3_

- [x] 11. Integrar tudo em `App.tsx`
  - [x] 11.1 Atualizar `src/App.tsx`
    - Envolver a aplicação com `RepositoryProvider`
    - Renderizar `AppLayout` com as telas principais: lista de transações e carteiras
    - Conectar `Toast` ao estado de erro/sucesso do `useFlowly`
    - _Requisitos: 2.5, 3.2, 3.7, 5.5_

  - [x] 11.2 Escrever testes de integração
    - Testar fluxo completo: adicionar transação → verificar saldo atualizado na carteira
    - Testar fluxo de remoção com confirmação
    - _Requisitos: 3.2, 3.7, 5.5_

- [x] 12. Checkpoint final — garantir que todos os testes passam
  - Garantir que todos os testes passam. Perguntar ao usuário se houver dúvidas.

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Os checkpoints garantem validação incremental
- Testes de propriedade usam `fast-check` (já instalado no projeto)
- Testes unitários usam `Vitest` (já configurado no projeto)

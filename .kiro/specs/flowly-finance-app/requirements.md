# Documento de Requisitos — Flowly

## Introdução

O Flowly é um aplicativo de gestão financeira multiplataforma com foco em simplicidade para adultos de 30 a 70+ anos que buscam controle financeiro sem precisar aprender conceitos de TI ou contabilidade avançada. O sistema permite registrar transações (entradas e saídas), organizar o dinheiro em múltiplas carteiras e funcionar offline, sincronizando com a nuvem quando houver conexão.

---

## Glossário

- **Flowly**: O sistema de gestão financeira descrito neste documento.
- **Transação**: Registro de uma movimentação financeira com descrição, valor, data, tipo e carteira associada.
- **Carteira**: Agrupamento lógico de transações representando uma conta ou reserva (ex: "Banco do Brasil", "Dinheiro na Mão").
- **Repositório**: Camada de abstração de dados que desacopla a interface do mecanismo de persistência.
- **MockFlowlyRepository**: Implementação do Repositório que retorna dados estáticos em memória, usada durante o desenvolvimento.
- **LocalFlowlyRepository**: Implementação futura do Repositório com persistência local via SQLite.
- **CloudFlowlySync**: Implementação futura de sincronização remota para múltiplos dispositivos.
- **SyncEngine**: Componente responsável por detectar conectividade e enviar dados locais pendentes para a nuvem.
- **Transação Fixa**: Transação recorrente configurada como "Renda Fixa" ou "Gasto Mensal" que se repete automaticamente.

---

## Requisitos

### Requisito 1: Modelo de Dados de Transação

**User Story:** Como desenvolvedor, quero um modelo de dados bem definido para transações, para que todas as camadas do sistema compartilhem a mesma estrutura.

#### Critérios de Aceitação

1. THE Flowly SHALL representar cada Transação com os campos: `id` (identificador único), `descricao` (texto), `valor` (número decimal positivo), `tipo` ("entrada" ou "saída"), `data` (formato ISO 8601: YYYY-MM-DD), `fixo` (booleano) e `carteira_origem` (nome da Carteira).
2. WHEN uma Transação é criada sem um `id` explícito, THE Flowly SHALL gerar um identificador único automaticamente.
3. IF o campo `valor` receber um número negativo ou zero, THEN THE Flowly SHALL rejeitar a Transação e retornar uma mensagem de erro descritiva.
4. IF o campo `tipo` receber um valor diferente de "entrada" ou "saída", THEN THE Flowly SHALL rejeitar a Transação e retornar uma mensagem de erro descritiva.
5. IF o campo `data` receber um valor em formato inválido, THEN THE Flowly SHALL rejeitar a Transação e retornar uma mensagem de erro descritiva.

---

### Requisito 2: Camada de Repositório (Repository Pattern)

**User Story:** Como desenvolvedor, quero que a aplicação interaja apenas com uma interface de repositório, para que a origem dos dados possa ser trocada sem alterar o código de interface ou lógica de negócio.

#### Critérios de Aceitação

1. THE Repositório SHALL expor as operações: `listarTransacoes()`, `adicionarTransacao(transacao)`, `atualizarTransacao(id, dados)`, `removerTransacao(id)`, `listarCarteiras()` e `obterSaldoPorCarteira(nomeCarteira)`.
2. THE MockFlowlyRepository SHALL implementar todas as operações da interface do Repositório usando dados estáticos em memória.
3. WHEN o MockFlowlyRepository é inicializado, THE MockFlowlyRepository SHALL carregar um conjunto de transações e carteiras de exemplo suficiente para exercitar todos os fluxos de interface.
4. WHERE o LocalFlowlyRepository estiver disponível, THE Flowly SHALL substituir o MockFlowlyRepository sem alteração no código das camadas superiores.
5. THE Flowly SHALL injetar a implementação do Repositório via injeção de dependência, de modo que nenhuma tela ou controlador instancie diretamente uma implementação concreta.

---

### Requisito 3: Gestão de Transações

**User Story:** Como usuário, quero adicionar, editar e remover transações rapidamente, para que eu mantenha meu controle financeiro atualizado sem esforço.

#### Critérios de Aceitação

1. WHEN o usuário aciona a ação de adicionar Transação, THE Flowly SHALL apresentar um formulário com os campos: descrição, valor, data, tipo (entrada/saída), carteira e recorrência (fixa ou não).
2. WHEN o usuário confirma o formulário com todos os campos válidos, THE Flowly SHALL salvar a Transação via Repositório e exibir a mensagem de confirmação "Pronto! A transação foi salva."
3. WHEN o usuário aciona a ação "Copiar" em uma Transação existente, THE Flowly SHALL preencher o formulário de nova Transação com os mesmos dados da Transação copiada, mantendo o campo `data` com a data atual.
4. WHEN o usuário aciona a ação "Duplicar" em uma Transação existente, THE Flowly SHALL criar uma nova Transação com os mesmos dados e um novo `id` gerado automaticamente, sem abrir formulário.
5. WHEN o usuário aciona a ação "Mover" em uma Transação, THE Flowly SHALL apresentar a lista de Carteiras disponíveis e, após a seleção, atualizar o campo `carteira_origem` da Transação.
6. WHEN o usuário aciona a ação "Apagar" em uma Transação, THE Flowly SHALL exibir uma confirmação antes de remover a Transação via Repositório.
7. WHEN o usuário confirma a remoção de uma Transação, THE Flowly SHALL remover a Transação e exibir a mensagem "Pronto! A transação foi removida."
8. IF o Repositório retornar erro ao salvar ou remover uma Transação, THEN THE Flowly SHALL exibir uma mensagem de erro descritiva sem fechar o formulário ou perder os dados digitados.

---

### Requisito 4: Transações Fixas (Recorrência)

**User Story:** Como usuário, quero configurar transações recorrentes como "Renda Fixa" ou "Gasto Mensal", para que eu não precise relançar os mesmos valores todo mês.

#### Critérios de Aceitação

1. WHEN o usuário marca uma Transação como fixa (`fixo: true`), THE Flowly SHALL identificar essa Transação como recorrente e exibi-la com indicador visual distinto.
2. WHEN um novo mês começa, THE Flowly SHALL gerar automaticamente cópias das Transações fixas para o mês corrente, com novas datas e novos `id`s.
3. WHEN o usuário edita o valor de uma Transação fixa, THE Flowly SHALL perguntar se a alteração se aplica apenas à ocorrência atual ou a todas as ocorrências futuras.
4. IF o usuário optar por alterar todas as ocorrências futuras de uma Transação fixa, THEN THE Flowly SHALL atualizar o modelo base da recorrência e regenerar as ocorrências futuras pendentes.

---

### Requisito 5: Gestão de Carteiras

**User Story:** Como usuário, quero organizar meu dinheiro em carteiras separadas, para que eu saiba exatamente quanto tenho em cada conta ou reserva.

#### Critérios de Aceitação

1. THE Flowly SHALL exibir a lista de Carteiras com o saldo individual de cada uma e o saldo total consolidado.
2. WHEN o usuário adiciona uma nova Carteira, THE Flowly SHALL solicitar um nome único e criar a Carteira com saldo inicial zero.
3. IF o usuário tentar criar uma Carteira com um nome já existente, THEN THE Flowly SHALL rejeitar a operação e exibir a mensagem "Já existe uma carteira com esse nome."
4. THE Flowly SHALL calcular o saldo de cada Carteira como a soma de todas as Transações do tipo "entrada" menos a soma de todas as Transações do tipo "saída" associadas àquela Carteira.
5. WHEN uma Transação é adicionada, editada ou removida, THE Flowly SHALL recalcular e atualizar imediatamente o saldo da Carteira afetada e o saldo total.

---

### Requisito 6: Funcionamento Offline (Offline-First)

**User Story:** Como usuário, quero registrar transações mesmo sem conexão com a internet, para que eu não perca dados quando estiver em locais sem sinal.

#### Critérios de Aceitação

1. WHILE o dispositivo não possui conexão com a internet, THE Flowly SHALL permitir todas as operações de leitura e escrita de Transações e Carteiras usando o armazenamento local.
2. WHEN o dispositivo recupera conexão com a internet, THE SyncEngine SHALL enviar automaticamente para a nuvem todas as Transações e Carteiras criadas ou modificadas durante o período offline.
3. IF dois dispositivos modificarem a mesma Transação enquanto offline, THEN THE SyncEngine SHALL resolver o conflito mantendo a versão com o `timestamp` mais recente.
4. WHILE uma sincronização está em andamento, THE Flowly SHALL exibir um indicador visual de sincronização sem bloquear a interação do usuário.

---

### Requisito 7: Interface e Navegação

**User Story:** Como usuário leigo em tecnologia, quero uma interface com controles familiares e confirmações claras, para que eu me sinta seguro ao usar o aplicativo.

#### Critérios de Aceitação

1. THE Flowly SHALL exibir todos os botões de ação com ícone e texto descritivo (ex: ícone de lixeira acompanhado da palavra "Apagar").
2. WHERE o Flowly estiver sendo executado em um dispositivo com tela larga (desktop/tablet), THE Flowly SHALL exibir uma barra lateral fixa com a navegação principal.
3. WHERE o Flowly estiver sendo executado em um dispositivo móvel, THE Flowly SHALL exibir abas de navegação inferiores com largura total da tela.
4. WHEN o Flowly exibir uma mensagem de confirmação de sucesso, THE Flowly SHALL usar linguagem positiva no formato "Pronto! [ação concluída]."
5. WHEN o Flowly exibir uma mensagem de erro, THE Flowly SHALL descrever o problema em linguagem simples, sem termos técnicos, e sugerir uma ação corretiva quando aplicável.

---

### Requisito 8: Serialização e Persistência de Dados

**User Story:** Como desenvolvedor, quero que os dados sejam serializados e desserializados de forma confiável, para que nenhuma informação seja perdida ou corrompida ao salvar e carregar.

#### Critérios de Aceitação

1. WHEN o Repositório serializa uma Transação para armazenamento, THE Repositório SHALL produzir uma representação JSON válida contendo todos os campos do modelo de dados.
2. WHEN o Repositório desserializa um JSON de Transação, THE Repositório SHALL reconstruir um objeto Transação com todos os campos corretamente tipados.
3. IF o JSON de entrada estiver malformado ou com campos obrigatórios ausentes, THEN THE Repositório SHALL retornar um erro descritivo sem lançar exceção não tratada.
4. PARA TODA Transação válida, serializar e depois desserializar SHALL produzir um objeto equivalente ao original (propriedade de round-trip).

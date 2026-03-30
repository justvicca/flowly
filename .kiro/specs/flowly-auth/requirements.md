# Documento de Requisitos — Flowly Auth

## Introdução

O módulo de autenticação do Flowly permite que cada usuário tenha acesso exclusivo aos seus dados financeiros. O sistema suporta login com email e senha, além de provedores sociais (Google e Apple), priorizando simplicidade para o público-alvo de 30 a 70+ anos. A autenticação é o pré-requisito para a persistência de dados por usuário, garantindo que transações e carteiras sejam privadas e acessíveis em múltiplos dispositivos.

O design deve ser compatível com a evolução futura do Flowly para React Native, portanto a lógica de autenticação deve ser desacoplada da camada de interface.

---

## Glossário

- **Flowly**: O sistema de gestão financeira descrito neste documento.
- **AuthService**: Componente responsável por todas as operações de autenticação (login, logout, registro, renovação de sessão).
- **Sessão**: Estado que representa um usuário autenticado, contendo o identificador do usuário e o token de acesso.
- **Token**: Credencial de acesso emitida pelo provedor de autenticação após login bem-sucedido.
- **Provedor Social**: Serviço externo de identidade (Google, Apple) que autentica o usuário sem exigir senha no Flowly.
- **Usuário**: Pessoa registrada no Flowly com identidade única (email ou provedor social).
- **AuthContext**: Contexto React que expõe o estado de autenticação e as ações do AuthService para os componentes.
- **ProtectedRoute**: Componente que redireciona para a tela de login quando não há Sessão ativa.
- **IAuthRepository**: Interface de abstração para operações de autenticação, seguindo o Repository Pattern já adotado no Flowly.
- **UserProfile**: Dados básicos do usuário autenticado (id, nome, email, foto de perfil).

---

## Requisitos

### Requisito 1: Registro de Conta com Email e Senha

**User Story:** Como novo usuário, quero criar uma conta com meu email e senha, para que meus dados financeiros sejam salvos de forma privada e acessíveis apenas por mim.

#### Critérios de Aceitação

1. WHEN o usuário acessa o Flowly sem uma Sessão ativa, THE Flowly SHALL exibir a tela de autenticação com as opções de login e registro.
2. WHEN o usuário aciona a opção de criar conta, THE Flowly SHALL apresentar um formulário com os campos: nome completo, email e senha.
3. WHEN o usuário confirma o formulário de registro com todos os campos válidos, THE AuthService SHALL criar a conta e iniciar uma Sessão automaticamente, sem exigir etapa adicional de confirmação.
4. IF o email informado já estiver cadastrado, THEN THE AuthService SHALL retornar a mensagem "Já existe uma conta com esse email. Tente fazer login."
5. IF o campo email receber um valor em formato inválido, THEN THE Flowly SHALL exibir a mensagem "Digite um email válido, como exemplo@email.com."
6. IF o campo senha receber um valor com menos de 8 caracteres, THEN THE Flowly SHALL exibir a mensagem "A senha precisa ter pelo menos 8 caracteres."
7. IF o AuthService retornar erro ao criar a conta, THEN THE Flowly SHALL exibir uma mensagem de erro em linguagem simples sem fechar o formulário ou apagar os dados digitados.

---

### Requisito 2: Login com Email e Senha

**User Story:** Como usuário registrado, quero entrar na minha conta com email e senha, para que eu acesse meus dados financeiros de forma segura.

#### Critérios de Aceitação

1. WHEN o usuário informa email e senha válidos e aciona o botão de login, THE AuthService SHALL autenticar o usuário e iniciar uma Sessão.
2. WHEN o login é bem-sucedido, THE Flowly SHALL redirecionar o usuário para a tela principal sem exibir mensagens técnicas.
3. IF o email ou a senha estiverem incorretos, THEN THE AuthService SHALL retornar a mensagem "Email ou senha incorretos. Verifique e tente novamente."
4. IF o AuthService retornar erro de rede durante o login, THEN THE Flowly SHALL exibir a mensagem "Não foi possível conectar. Verifique sua internet e tente novamente."
5. WHILE o AuthService está processando o login, THE Flowly SHALL exibir um indicador de carregamento e desabilitar o botão de login para evitar envios duplicados.

---

### Requisito 3: Login Social com Google

**User Story:** Como usuário, quero entrar com minha conta Google, para que eu não precise criar e lembrar de mais uma senha.

#### Critérios de Aceitação

1. WHEN o usuário aciona o botão "Entrar com Google", THE AuthService SHALL iniciar o fluxo de autenticação OAuth com o provedor Google.
2. WHEN o provedor Google confirma a identidade do usuário, THE AuthService SHALL criar ou recuperar a conta do Flowly associada ao email Google e iniciar uma Sessão.
3. WHEN o login com Google é bem-sucedido pela primeira vez, THE AuthService SHALL criar automaticamente uma conta no Flowly com os dados do perfil Google (nome e email).
4. IF o usuário cancelar o fluxo de autenticação Google, THEN THE Flowly SHALL retornar à tela de login sem exibir mensagem de erro.
5. IF o provedor Google retornar erro, THEN THE Flowly SHALL exibir a mensagem "Não foi possível entrar com o Google. Tente novamente ou use email e senha."

---

### Requisito 4: Login Social com Apple

**User Story:** Como usuário de dispositivo Apple, quero entrar com minha conta Apple ID, para que eu use o método de autenticação nativo do meu dispositivo.

#### Critérios de Aceitação

1. WHERE o Flowly estiver sendo executado em um dispositivo Apple ou navegador Safari, THE Flowly SHALL exibir o botão "Entrar com Apple".
2. WHEN o usuário aciona o botão "Entrar com Apple", THE AuthService SHALL iniciar o fluxo de autenticação com o provedor Apple.
3. WHEN o provedor Apple confirma a identidade do usuário, THE AuthService SHALL criar ou recuperar a conta do Flowly associada ao identificador Apple e iniciar uma Sessão.
4. IF o usuário cancelar o fluxo de autenticação Apple, THEN THE Flowly SHALL retornar à tela de login sem exibir mensagem de erro.
5. IF o provedor Apple retornar erro, THEN THE Flowly SHALL exibir a mensagem "Não foi possível entrar com o Apple ID. Tente novamente ou use email e senha."

---

### Requisito 5: Persistência de Sessão

**User Story:** Como usuário, quero permanecer logado entre sessões do aplicativo, para que eu não precise digitar minha senha toda vez que abrir o Flowly.

#### Critérios de Aceitação

1. WHEN o login é bem-sucedido, THE AuthService SHALL persistir a Sessão localmente de forma segura para que seja restaurada na próxima abertura do aplicativo.
2. WHEN o Flowly é aberto e existe uma Sessão persistida válida, THE AuthService SHALL restaurar a Sessão automaticamente sem exigir novo login.
3. WHEN o Token da Sessão está próximo do vencimento, THE AuthService SHALL renová-lo automaticamente em background sem interromper o uso do aplicativo.
4. IF o Token da Sessão estiver expirado e não puder ser renovado, THEN THE AuthService SHALL encerrar a Sessão e redirecionar o usuário para a tela de login com a mensagem "Sua sessão expirou. Faça login novamente."
5. WHILE o AuthService está verificando a Sessão persistida na abertura do aplicativo, THE Flowly SHALL exibir uma tela de carregamento em vez da tela de login ou da tela principal.

---

### Requisito 6: Logout

**User Story:** Como usuário, quero sair da minha conta, para que meus dados financeiros fiquem protegidos quando eu compartilhar o dispositivo.

#### Critérios de Aceitação

1. THE Flowly SHALL exibir a opção de logout acessível a partir da tela principal.
2. WHEN o usuário aciona a opção de logout, THE Flowly SHALL exibir uma confirmação antes de encerrar a Sessão.
3. WHEN o usuário confirma o logout, THE AuthService SHALL encerrar a Sessão, remover os dados locais de autenticação e redirecionar para a tela de login.
4. IF o AuthService retornar erro ao encerrar a Sessão, THEN THE Flowly SHALL encerrar a Sessão localmente e redirecionar para a tela de login mesmo assim.

---

### Requisito 7: Recuperação de Senha

**User Story:** Como usuário, quero recuperar o acesso à minha conta caso esqueça a senha, para que eu não perca meus dados financeiros.

#### Critérios de Aceitação

1. THE Flowly SHALL exibir o link "Esqueci minha senha" na tela de login.
2. WHEN o usuário aciona "Esqueci minha senha" e informa um email válido, THE AuthService SHALL enviar um email de recuperação para o endereço informado.
3. WHEN o email de recuperação é enviado com sucesso, THE Flowly SHALL exibir a mensagem "Enviamos um link para [email]. Verifique sua caixa de entrada."
4. IF o email informado não estiver cadastrado, THEN THE AuthService SHALL exibir a mesma mensagem de sucesso para não revelar quais emails estão cadastrados.
5. IF o AuthService retornar erro ao enviar o email de recuperação, THEN THE Flowly SHALL exibir a mensagem "Não foi possível enviar o email. Tente novamente."

---

### Requisito 8: Isolamento de Dados por Usuário

**User Story:** Como usuário, quero que meus dados financeiros sejam completamente separados dos dados de outros usuários, para que minhas informações sejam privadas e seguras.

#### Critérios de Aceitação

1. WHEN o Flowly carrega transações ou carteiras, THE IFlowlyRepository SHALL filtrar os dados pelo identificador do Usuário autenticado na Sessão ativa.
2. WHEN um novo Usuário faz login pela primeira vez, THE Flowly SHALL inicializar um conjunto de dados vazio (sem transações ou carteiras pré-existentes de outros usuários).
3. IF não houver Sessão ativa, THEN THE IFlowlyRepository SHALL rejeitar qualquer operação de leitura ou escrita e retornar um erro de autenticação.
4. THE AuthService SHALL garantir que o identificador do Usuário seja incluído em todas as operações de escrita no repositório, impedindo que um usuário acesse dados de outro.

---

### Requisito 9: Interface de Autenticação Acessível

**User Story:** Como usuário leigo em tecnologia, quero uma tela de login simples e familiar, para que eu consiga entrar no aplicativo sem dificuldade.

#### Critérios de Aceitação

1. THE Flowly SHALL exibir os botões de login social com o logotipo oficial do provedor e o texto descritivo (ex: "Entrar com Google").
2. THE Flowly SHALL exibir os campos de email e senha com rótulos visíveis acima de cada campo, não apenas como placeholder.
3. THE Flowly SHALL exibir um botão para alternar a visibilidade da senha (mostrar/ocultar) no campo de senha.
4. WHEN o usuário submete o formulário com campos inválidos, THE Flowly SHALL exibir as mensagens de erro imediatamente abaixo do campo correspondente, em linguagem simples.
5. THE Flowly SHALL garantir que todos os elementos interativos da tela de autenticação sejam acessíveis por teclado e leitores de tela.

---

### Requisito 10: Abstração do Provedor de Autenticação

**User Story:** Como desenvolvedor, quero que a lógica de autenticação seja desacoplada do provedor específico, para que o Flowly possa trocar de provedor (ex: Firebase Auth → Auth0) sem alterar os componentes de interface.

#### Critérios de Aceitação

1. THE IAuthRepository SHALL expor as operações: `loginComEmail(email, senha)`, `registrarComEmail(nome, email, senha)`, `loginComGoogle()`, `loginComApple()`, `logout()`, `recuperarSenha(email)`, `obterSessaoAtual()` e `renovarToken()`.
2. THE AuthService SHALL interagir exclusivamente com a IAuthRepository, sem referenciar diretamente nenhum SDK de provedor externo.
3. WHERE o Flowly estiver sendo executado em ambiente de desenvolvimento ou testes, THE IAuthRepository SHALL ter uma implementação MockAuthRepository que simula todos os fluxos sem chamadas de rede.
4. THE AuthContext SHALL expor o UserProfile e o estado de autenticação para os componentes React sem que esses componentes conheçam a implementação do AuthService.
5. PARA TODA operação de autenticação, serializar e desserializar o UserProfile SHALL produzir um objeto equivalente ao original (propriedade de round-trip).

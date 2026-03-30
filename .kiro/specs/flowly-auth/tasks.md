# Plano de Implementação: Flowly Auth

## Visão Geral

Implementação incremental do módulo de autenticação do Flowly, seguindo o Repository Pattern já estabelecido. Cada etapa constrói sobre a anterior, culminando na integração completa no `App.tsx`.

## Tarefas

- [x] 1. Criar tipos e interfaces de autenticação
  - Criar `src/auth/IAuthRepository.ts` com as interfaces `UserProfile`, `Sessao`, `AuthResult` e `IAuthRepository`
  - Criar `src/auth/AuthService.ts` com a classe `AuthService` (apenas assinaturas de métodos por ora)
  - Criar `src/auth/AuthContext.tsx` com as interfaces `AuthState` e `AuthContextValue` (sem implementação)
  - _Requisitos: 10.1, 10.2, 10.4_

- [x] 2. Implementar MockAuthRepository
  - Criar `src/auth/MockAuthRepository.ts` implementando `IAuthRepository`
  - Armazenar usuários em memória (`Map<email, { nome, senhaHash, userId }>`)
  - Implementar `registrarComEmail`, `loginComEmail`, `logout`, `recuperarSenha`, `obterSessaoAtual`, `renovarToken`
  - Implementar `loginComGoogle` e `loginComApple` retornando sessão simulada com perfil fixo
  - Persistir sessão ativa em variável de instância para simular `obterSessaoAtual`
  - _Requisitos: 10.3, 5.1, 5.2_

  - [x] 2.1 Escrever teste de propriedade para MockAuthRepository (P6)
    - **Propriedade 6: Sessão persiste e é restaurada (round-trip)**
    - **Valida: Requisitos 5.1, 5.2**
    - Arquivo: `src/auth/MockAuthRepository.property.test.ts`
    - Tag: `// Feature: flowly-auth, Property 6: sessão persiste e é restaurada`

  - [x] 2.2 Escrever teste de propriedade para serialização de UserProfile (P12)
    - **Propriedade 12: Serialização de UserProfile é round-trip**
    - **Valida: Requisito 10.5**
    - Arquivo: `src/auth/IAuthRepository.property.test.ts`
    - Tag: `// Feature: flowly-auth, Property 12: serialização de UserProfile é round-trip`

- [x] 3. Implementar AuthService com validações
  - Implementar `AuthService.registrarComEmail`: validar nome não vazio, email com `@` e domínio, senha ≥ 8 chars antes de chamar o repositório
  - Implementar `AuthService.loginComEmail`: mesmas validações de formato; mapear erros do repositório para mensagens em português
  - Implementar `AuthService.loginComGoogle` e `loginComApple`: delegar ao repositório; tratar cancelamento silenciosamente
  - Implementar `AuthService.logout`: delegar ao repositório; garantir limpeza local mesmo em caso de erro remoto
  - Implementar `AuthService.recuperarSenha`: delegar ao repositório sem revelar se email existe
  - Implementar `AuthService.obterSessaoAtual` e `renovarToken`: delegar ao repositório
  - _Requisitos: 1.3, 1.4, 1.5, 1.6, 2.1, 2.3, 3.1, 3.4, 4.4, 6.3, 6.4, 7.2, 7.4_

  - [x] 3.1 Escrever testes de propriedade para AuthService (P2, P3, P4, P5, P7, P8)
    - **Propriedade 2: Registro com dados válidos cria sessão** — `fc.string({ minLength: 1 })`, `fc.emailAddress()`, `fc.string({ minLength: 8 })`
    - **Propriedade 3: Validação rejeita inputs inválidos** — strings sem `@`; `fc.string({ maxLength: 7 })` para senhas
    - **Propriedade 4: Login com credenciais válidas cria sessão** — `fc.emailAddress()`, `fc.string({ minLength: 8 })`
    - **Propriedade 5: Login social cria sessão idempotente** — `fc.record({ id: fc.uuid(), nome: fc.string(), email: fc.emailAddress() })`
    - **Propriedade 7: Logout limpa sessão** — credenciais válidas geradas por fast-check
    - **Propriedade 8: Recuperação de senha tem resposta uniforme** — `fc.emailAddress()` para emails existentes e não existentes
    - **Valida: Requisitos 1.3, 1.5, 1.6, 2.1, 3.2, 4.3, 6.3, 7.2, 7.4**
    - Arquivo: `src/auth/AuthService.property.test.ts`
    - Tags obrigatórias em cada teste: `// Feature: flowly-auth, Property N: <texto>`

  - [x] 3.2 Escrever testes unitários para AuthService
    - Fluxo completo: registro → login → logout
    - Mensagens de erro em português para cada código de erro mapeado no design
    - Cancelamento de fluxo social retorna sem mensagem de erro
    - Erro remoto no logout não impede limpeza local
    - _Requisitos: 1.4, 1.7, 2.3, 2.4, 3.4, 3.5, 4.4, 4.5, 6.4, 7.5_

- [x] 4. Checkpoint — Garantir que todos os testes do AuthService passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [x] 5. Atualizar IFlowlyRepository e MockFlowlyRepository para userId
  - Atualizar `src/repository/IFlowlyRepository.ts`: adicionar `userId: string` como primeiro parâmetro em todos os métodos
  - Atualizar `src/repository/MockFlowlyRepository.ts`: armazenar transações e carteiras em `Map<userId, T[]>`; filtrar por `userId` em todas as operações; rejeitar `userId` vazio/nulo com `AuthError`
  - Atualizar `src/hooks/useFlowly.ts`: obter `userId` via `useAuth()` e propagá-lo para todas as chamadas do repositório
  - Atualizar testes existentes em `MockFlowlyRepository.test.ts` e `MockFlowlyRepository.property.test.ts` para passar `userId`
  - _Requisitos: 8.1, 8.3, 8.4_

  - [x] 5.1 Escrever testes de propriedade para isolamento de dados (P9, P10, P11)
    - **Propriedade 9: Isolamento de dados por userId** — `fc.uuid()` para dois userIds distintos; escrever dados com userIdA e verificar que userIdB não os vê
    - **Propriedade 10: Novo usuário começa com dados vazios** — `fc.uuid()` para userId nunca usado; `listarTransacoes` e `listarCarteiras` devem retornar `[]`
    - **Propriedade 11: Operações sem sessão são rejeitadas** — `fc.constant(null)` e `fc.constant('')` para userId; todas as operações devem rejeitar
    - **Valida: Requisitos 8.1, 8.2, 8.3, 8.4**
    - Arquivo: `src/repository/MockFlowlyRepository.property.test.ts`
    - Tags: `// Feature: flowly-auth, Property N: <texto>`

- [x] 6. Implementar AuthContext e hook useAuth
  - Implementar `AuthContext.tsx` com `useReducer` gerenciando `AuthState`
  - Implementar `AuthProvider`: inicializar chamando `AuthService.obterSessaoAtual()` ao montar; definir `carregando: true` durante verificação
  - Expor `loginComEmail`, `registrarComEmail`, `loginComGoogle`, `loginComApple`, `logout`, `recuperarSenha` como ações do contexto
  - Implementar `useAuth()` hook que lança erro se usado fora do `AuthProvider`
  - _Requisitos: 5.2, 5.5, 10.4_

  - [x] 6.1 Escrever testes unitários para AuthContext
    - `carregando: true` durante verificação inicial de sessão
    - Estado atualizado corretamente após login bem-sucedido
    - Estado limpo após logout
    - _Requisitos: 5.5, 6.3_

- [x] 7. Implementar ProtectedRoute
  - Criar `src/auth/ProtectedRoute.tsx`
  - Renderizar `<SplashScreen />` quando `carregando === true`
  - Renderizar `<LoginScreen />` quando `sessao === null && carregando === false`
  - Renderizar `children` quando há sessão ativa
  - _Requisitos: 1.1, 5.5_

  - [x] 7.1 Escrever teste de propriedade para ProtectedRoute (P1)
    - **Propriedade 1: Roteamento sem sessão redireciona para login**
    - **Valida: Requisito 1.1**
    - Arquivo: `src/auth/ProtectedRoute.property.test.tsx`
    - Tag: `// Feature: flowly-auth, Property 1: roteamento sem sessão redireciona para login`

  - [x] 7.2 Escrever testes unitários para ProtectedRoute
    - Renderiza `SplashScreen` quando `carregando === true`
    - Renderiza `LoginScreen` quando `sessao === null`
    - Renderiza `children` quando há sessão ativa
    - _Requisitos: 1.1, 5.5_

- [x] 8. Implementar telas de autenticação
  - [x] 8.1 Criar SplashScreen (`src/screens/auth/SplashScreen.tsx`)
    - Exibir indicador de carregamento centralizado
    - _Requisitos: 5.5_

  - [x] 8.2 Criar LoginScreen (`src/screens/auth/LoginScreen.tsx`)
    - Campos email e senha com labels visíveis acima de cada campo (não apenas placeholder)
    - Botão para alternar visibilidade da senha (mostrar/ocultar)
    - Botões de login social: "Entrar com Google" e "Entrar com Apple" (Apple apenas em Safari/iOS)
    - Link "Esqueci minha senha" navegando para `ForgotPasswordScreen`
    - Indicador de carregamento e botão desabilitado durante processamento
    - Exibir mensagens de erro abaixo do campo correspondente
    - _Requisitos: 2.1, 2.2, 2.4, 2.5, 3.1, 4.1, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 8.3 Criar RegisterScreen (`src/screens/auth/RegisterScreen.tsx`)
    - Campos: nome completo, email, senha com labels visíveis
    - Botão para alternar visibilidade da senha
    - Exibir mensagens de erro abaixo do campo correspondente sem fechar o formulário
    - _Requisitos: 1.2, 1.5, 1.6, 1.7, 9.2, 9.3, 9.4_

  - [x] 8.4 Criar ForgotPasswordScreen (`src/screens/auth/ForgotPasswordScreen.tsx`)
    - Campo de email com label visível
    - Exibir mensagem de sucesso uniforme após envio (independente de o email existir)
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 8.5 Escrever testes unitários para as telas de autenticação
    - `LoginScreen`: campos com labels, botão mostrar/ocultar senha, link "Esqueci minha senha", estado de carregamento
    - `RegisterScreen`: exibe erros sem fechar formulário, campos com labels
    - `ForgotPasswordScreen`: exibe mensagem de sucesso uniforme
    - _Requisitos: 9.1, 9.2, 9.3, 9.4, 1.7, 7.3, 7.4_

- [x] 9. Checkpoint — Garantir que todos os testes das telas passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [ ] 10. Implementar FirebaseAuthRepository (opcional — MVP pode usar MockAuthRepository)
  - Criar `src/auth/FirebaseAuthRepository.ts` implementando `IAuthRepository`
  - Mapear erros do Firebase SDK para `AuthResult { sucesso: false, erro: <mensagem em português> }` conforme tabela do design
  - Implementar `loginComEmail`, `registrarComEmail`, `loginComGoogle`, `loginComApple`, `logout`, `recuperarSenha`, `obterSessaoAtual`, `renovarToken`
  - Tratar cancelamento de popup social silenciosamente (`auth/popup-closed-by-user`)
  - _Requisitos: 2.1, 3.1, 3.2, 4.2, 4.3, 5.1, 5.3, 6.3, 10.1, 10.2_

- [x] 11. Integrar autenticação no App.tsx
  - Criar `src/auth/AuthRepositoryContext.tsx` com `AuthProvider` que injeta `MockAuthRepository` (ou `FirebaseAuthRepository` se disponível)
  - Envolver `App` com `AuthProvider` em `src/main.tsx` ou `src/App.tsx`
  - Envolver `FlowlyApp` com `ProtectedRoute` para proteger todas as rotas internas
  - Atualizar `RepositoryProvider` para receber `userId` do `AuthContext` e passá-lo ao `MockFlowlyRepository`
  - _Requisitos: 1.1, 5.2, 8.1, 8.3_

  - [x] 11.1 Escrever teste de integração para App.tsx
    - App renderiza `SplashScreen` durante verificação de sessão
    - App renderiza `LoginScreen` sem sessão ativa
    - App renderiza conteúdo protegido com sessão ativa
    - _Requisitos: 1.1, 5.5_

- [x] 12. Checkpoint final — Garantir que todos os testes passam
  - Executar `npm test` e garantir que todos os testes passam sem erros.
  - Verificar que nenhum componente referencia `AuthService` ou `IAuthRepository` diretamente (apenas via `useAuth()`).
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- A tarefa 10 (FirebaseAuthRepository) é inteiramente opcional — o MVP funciona com `MockAuthRepository`
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Os testes de propriedade usam `fast-check` já instalado no projeto (`fc.assert` + `fc.asyncProperty`)
- Cada teste de propriedade deve ter a tag `// Feature: flowly-auth, Property N: <texto>` e `{ numRuns: 100 }`
- O `userId` propagado para `IFlowlyRepository` vem sempre de `useAuth().sessao.usuario.id`

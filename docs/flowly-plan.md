PRD: Flowly — Gestão Financeira Descomplicada
1. Visão Geral do Produto
O Flowly é um aplicativo de gestão financeira multiplataforma projetado para ser a transição digital definitiva para quem ainda usa papel ou planilhas complexas. Ele foca em uma interface "zero fricção", onde a tecnologia é invisível e a utilidade é imediata.
2. Identidade e Público
Nome do App: Flowly.
Slogan Sugerido: "Seu dinheiro fluindo com simplicidade."
Público-alvo: Adultos (30-70+ anos) que buscam controle financeiro sem precisar aprender conceitos de TI ou contabilidade avançada.
3. Requisitos Funcionais (Core)
3.1. Gestão de Transações
Entradas e Saídas: Adição rápida com descrição, valor e data.
Ações de Linha: Botões claros para Copiar, Duplicar, Mover (trocar de carteira/banco) e Deletar.
Recorrência: Configuração de "Renda Fixa" ou "Gasto Mensal" que se autogerencia.
3.2. Estrutura de Carteiras
O Flowly permite separar o dinheiro por "caixas" (Ex: Banco do Brasil, Bradesco, Dinheiro na Mão).
Visualização clara do saldo individual por carteira e saldo total somado.
4. Arquitetura Técnica e Sincronização
Para garantir a escalabilidade e o funcionamento offline, o Flowly utiliza o padrão Offline-First com Repository Pattern.
4.1. Camada de Dados (Repository Pattern)
A aplicação não deve saber de onde os dados vêm. Ela interage apenas com uma Interface de Repositório.
Implementação Atual (Desenvolvimento): MockFlowlyRepository — Retorna dados estáticos para testes de interface e fluxo de usuário sem necessidade de banco de dados ativo.
Implementação Futura (Produção Local): LocalFlowlyRepository — Persistência usando SQLite ou similar no dispositivo.
Implementação Futura (Nuvem): CloudFlowlySync — Sincronização em tempo real para backup e uso em múltiplos aparelhos.
4.2. Requisitos de Sincronização
Independência de Conexão: O usuário deve conseguir cadastrar gastos no mercado (sem sinal) e o Flowly deve salvar localmente para subir à nuvem assim que detectar internet.
Conflitos: Em caso de conflito, o dado mais recente (timestamp) prevalece, mantendo a simplicidade para o usuário.
5. Mock Data Model (JSON)
Estrutura de dados que o MockFlowlyRepository deve fornecer:
JSON
{
  "id": "abc-123",
  "descricao": "Aposentadoria",
  "valor": 2800.00,
  "tipo": "entrada",
  "data": "2026-03-28",
  "fixo": true,
  "carteira_origem": "Banco do Brasil"
}

6. Diretrizes de Design (UX/UI)
Controles Familiares: Ícones com texto (Ex: Um desenho de lixeira com a palavra "Apagar" embaixo).
Confirmação Positiva: "Pronto! O gasto foi salvo."
Navegação: No PC, uso de barra lateral fixa; no Celular, abas inferiores largas.

Snippet de código
graph TD
    %% Estilização
    classDef userInterface fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef logicLayer fill:#fff3e0,stroke:#e65100,stroke-width:2px;
    classDef dataLayer fill:#f1f8e9,stroke:#33691e,stroke-width:2px;
    classDef storage fill:#eceff1,stroke:#455a64,stroke-width:2px,stroke-dasharray: 5 5;

    subgraph UI_LAYER [Flowly - Camada de Interface]
        A[Tela Inicial / Dashboard] --> B{Ação do Usuário}
        B -->|Adicionar| C[Modal de Nova Transação]
        B -->|Gerenciar| D[Lista de Transações/Tabela]
        D -->|Swipe/Clique| E[Copiar / Duplicar / Mover / Deletar]
    end

    subgraph APP_LOGIC [Camada de Negócio & Abstração]
        F[FlowlyViewModel / Controller]
        G{FlowlyRepository Interface}
        
        C --> F
        E --> F
        F --> G
    end

    subgraph DATA_STRATEGY [Estratégia de Dados - Offline First]
        G --> H{Injetor de Dependência}
        
        %% Fase Atual
        H -->|MODO DEV| I[MockFlowlyRepository]
        I -->|Dados Estáticos| J[JSON Mock Data]
        
        %% Fases Futuras
        H -.->|MODO PROD| K[LocalFlowlyRepository]
        K -.->|Persistência| L[(SQLite / Local Storage)]
        
        L -.-> M[SyncEngine]
        M -.->|Background Sync| N[Remote API / Cloud]
    end

    %% Detalhamento das Ações na Interface
    C -->|Input| C1[Valor, Nome, Data, Recorrência]
    E -->|Mover| E1[Trocar CarteiraID]
    E -->|Duplicar| E2[Novo ID com Mesmos Dados]

    %% Estilos Aplicados
    class A,C,D,E userInterface;
    class F,G,M logicLayer;
    class I,K dataLayer;
    class J,L,N storage;

Explicação do Fluxo de Dados:
UI Layer (Azul): O usuário interage com elementos visuais simples. Quando ele clica em "Mover" ou "Adicionar", a interface não sabe como isso é salvo; ela apenas envia o comando para o controlador.
App Logic (Laranja): O controlador utiliza a Interface do Repositório. Isso é crucial para o seu pedido: o código da tela chama repository.saveTransaction(), sem saber se o repositório é um teste (Mock) ou o banco real.
Data Strategy (Verde/Cinza):
Hoje (Modo Dev): O MockFlowlyRepository apenas manipula uma lista em memória ou um arquivo JSON estático.
Amanhã (Produção): Você apenas troca a implementação para o LocalFlowlyRepository. O resto do aplicativo (as telas e a lógica de botões) permanece exatamente igual, sem precisar mudar uma linha de código visual.
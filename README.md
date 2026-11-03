# Zooly Web

Front-end do **Zooly**, um jogo educativo voltado para crianças de aproximadamente 4 a 8 anos, com foco no desenvolvimento da leitura e em atividades de aprendizagem.

O projeto utiliza elementos de gamificação, como atividades educativas, progresso, mascotes e recompensas, para tornar o aprendizado mais acessível e envolvente.

Este repositório contém a aplicação Web do Zooly, desenvolvida com React e Next.js, seguindo uma abordagem mobile-first.

## Tecnologias utilizadas

- **Next.js** — framework React para a aplicação Web.
- **React** — desenvolvimento de interfaces com componentes reutilizáveis.
- **JavaScript** — linguagem utilizada no projeto.
- **CSS Modules** — estilização isolada por componente ou página.
- **CSS** — estilos globais e responsividade.
- **ESLint** — análise estática e verificação de código.

## Pré-requisitos

Antes de começar, é necessário ter instalado:

- [Node.js](https://nodejs.org/)
- npm, instalado junto com o Node.js.
- [Git](https://git-scm.com/)

## Como executar o projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/ZoolyEdu/Zooly-web.git
```

### 2. Entrar na pasta do projeto

```bash
cd Zooly-web
```

### 3. Instalar as dependências

```bash
npm install
```

### 4. Configurar as variáveis de ambiente

O projeto utiliza o arquivo `.env.local` para configurações locais.

Use o arquivo `.env.local.example` como modelo. Se o `.env.local` ainda não existir, copie o exemplo e confira se o conteúdo está configurado corretamente:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Essa é a única variável do painel. As antigas `NEXT_PUBLIC_MODO_DEMO` e `NEXT_PUBLIC_AMBIENTE` foram removidas junto com o modo de demonstração e não têm mais efeito.

**Importante:** o arquivo `.env.local` é local e não deve ser enviado ao GitHub. O arquivo `.env.local.example` pode ser versionado para documentar as configurações necessárias.

### 5. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

Se a porta 3000 já estiver ocupada por outro processo, o Next.js poderá iniciar em outra porta disponível, como a 3001. Utilize o endereço informado no terminal.

## Somente dados reais

O painel trabalha **exclusivamente com a Zooly API**. O antigo modo de demonstração foi removido, e com ele os dados fictícios no navegador, a professora fictícia, a faixa "Ambiente de demonstração" e o comando `dev:demo`. A API também recusa a configuração do antigo ambiente de demonstração.

Se a API estiver indisponível ou responder com erro, as telas mostram a mensagem do problema (com "Tentar novamente" onde faz sentido) e **nunca** substituem os dados por informações fictícias. Uma resposta `401` (sessão expirada) encerra a sessão e volta ao login.

## Banco de Histórias

Em **Histórias** (`/historias`), o professor encontra:

- as **seis histórias iniciais do Zooly** (adaptações infantis inspiradas no folclore e na cultura do Vale do Ribeira, com 5 perguntas cada). Elas são só para consulta e uso: não há ações de edição ou exclusão;
- as **histórias próprias**, que só o autor vê. Ele pode cadastrar, editar, arquivar, reativar e excluir (com confirmação).

A tela tem busca por título, tema ou objetivo e filtros por tema, idade, origem (Zooly ou minhas) e situação (ativas ou arquivadas). O detalhe mostra o texto, as perguntas com a alternativa correta destacada, o feedback e o objetivo pedagógico de cada pergunta.

No cadastro, o formulário tem:
- dados da história, faixa etária e objetivos;
- perguntas com 2 a 6 alternativas, a correta, o feedback e o objetivo;
- **pré-visualização** antes de salvar.

Antes de gravar, o conteúdo é conferido por `POST /api/historias/validar`, e os erros aparecem ao lado de cada campo.

### Criar uma atividade a partir de uma história

1. Em **Histórias**, clique em **Usar em atividade**. Também é possível, em **Nova Atividade**, escolher **Usar o Banco de Histórias**, selecionar a história e clicar em **Carregar história e perguntas**. Se já houver conteúdo digitado, o painel pede confirmação antes de substituir.
2. O painel chama `GET /api/historias/:id/modelo-atividade` e preenche o título, o texto, as perguntas, as alternativas e a resposta correta. O feedback e os objetivos aparecem ao lado de cada questão, como **apoio pedagógico só para o professor**.
3. Tudo continua editável: título, texto, perguntas, alternativas, resposta correta, perguntas novas ou removidas, prazo, missão, BNCC e recompensa.
4. **Salvar Atividade** envia `POST /api/atividades` no contrato da API: `historia: { tipo: "propria", texto, bancoHistoriaId }` e as questões com `respostasCorretas`. Feedback e objetivo **não** são enviados, porque não fazem parte do contrato da atividade e o aluno nunca os recebe.
5. **Publicar atividade**, como antes.

A atividade guarda uma **cópia** do texto e das perguntas. Editar ou excluir a história depois não muda a atividade. Ao reabrir uma atividade criada do banco, o painel busca de novo o feedback das perguntas que continuam iguais às da história de origem.

Atividades antigas que usam a história "por referência" mostram a cópia salva (o que os alunos leem). O botão **Editar o texto nesta atividade** transforma essa cópia em texto editável.

## Páginas da aplicação

As páginas são organizadas utilizando o **Pages Router** do Next.js.

| Rota | Descrição |
|---|---|
| `/` | Página inicial do Zooly |
| `/login` | Acesso de usuários |
| `/cadastro` | Cadastro de professor |
| `/painel` | Painel do professor |
| `/turmas` | Gerenciamento de turmas |
| `/turmas/[id]/alunos` | Alunos de uma turma |
| `/atividades` | Listagem de atividades |
| `/atividades/nova` | Criação e edição de atividades |
| `/atividades/[id]` | Detalhes de uma atividade |
| `/historias` | Banco de Histórias: busca, filtros e ações |
| `/historias/[id]` | Texto, perguntas, feedback e dados pedagógicos de uma história |
| `/historias/nova` | Cadastro (e, com `?id=`, edição) de história própria |
| `/desempenho` | Relatório semanal por turma |
| `/desempenho/alunos/[id]` | Desempenho individual |
| `/configuracoes` | Configurações do perfil |
| `/admin/login` | Acesso administrativo |
| `/admin` | Visão geral da administração |
| `/admin/escolas` | Gerenciamento de escolas |
| `/admin/professores` | Gerenciamento de professores |
| `/admin/professores/novo` | Cadastro de professor |
| `/admin/professores/[id]` | Edição de professor |

Todas as telas usam somente dados da API.

## Estrutura de pastas

```text
Zooly-web/
├── public/
│   └── img/                # Logo e mascotes
├── src/
│   ├── components/         # Componentes reutilizáveis (layout, Notice, ConfirmDialog, HistoriaPreview...)
│   ├── pages/              # Páginas e rotas
│   ├── services/           # api.js, session.js e historiasApi.js
│   ├── styles/             # Estilos globais e compartilhados
│   └── utils/              # formatacao.js e regras puras do Banco de Histórias (historias.js)
├── tests/
│   ├── unit/               # Testes unitários (node:test)
│   └── e2e/                # Testes de ponta a ponta (Playwright + API real)
├── playwright.config.mjs
├── .env.local.example      # Modelo das variáveis de ambiente
├── .gitignore
├── package.json
└── README.md
```

### Organização do front-end

- `src/pages/`: contém as páginas e define as rotas da aplicação.
- `src/components/`: reúne componentes reutilizáveis, como menu, layout e cartões.
- `src/services/`: centraliza a comunicação com a API (token, sessão expirada e erros) e a sessão.
- `src/styles/`: contém estilos globais e estilos compartilhados.
- `src/utils/`: funções puras, sem chamadas à API: formatação de datas e IDs (`formatacao.js`) e regras do Banco de Histórias (`historias.js`).
- `public/img/`: armazena imagens utilizadas na interface.

Os estilos específicos das páginas e dos componentes são organizados por meio de CSS Modules.

## Backend e integração

O backend do Zooly é mantido separadamente no repositório [Zooly-api](https://github.com/ZoolyEdu/Zooly-api).

O front-end se comunica com a API por requisições HTTP. Todas as permissões são verificadas no backend.

A variável `NEXT_PUBLIC_API_URL` define a URL da API. Em desenvolvimento, o padrão é `http://localhost:4000`; em produção ela é obrigatória. Sessão expirada encerra o acesso e leva de volta ao login.

Endpoints do Banco de Histórias usados pelo painel (todos com o token do professor; a autorização definitiva é da API): `GET /api/historias`, `GET /api/historias/:id`, `GET /api/historias/:id/perguntas`, `GET /api/historias/:id/modelo-atividade`, `POST /api/historias/validar`, `POST /api/historias`, `PUT /api/historias/:id`, `PATCH /api/historias/:id/arquivar`, `PATCH /api/historias/:id/reativar` e `DELETE /api/historias/:id`. Os contratos estão em `docs/historias.md`, no repositório Zooly-api.

## Verificações do projeto

```bash
npm run lint       # análise de código
npm run build      # versão de produção
npm test           # testes unitários (sem rede)
npm run test:e2e   # testes de ponta a ponta (ver abaixo)
```

Execute essas verificações após realizar alterações no projeto e corrija os erros encontrados antes de considerar a tarefa concluída.

### Testes de ponta a ponta

`tests/e2e` usa [Playwright](https://playwright.dev) contra a **Zooly API de verdade**: o código do repositório Zooly-api, sem alterações, servido localmente sobre um **MongoDB em memória** com dados de teste próprios e as 6 histórias iniciais do seed da API. Nenhum banco real é usado.

**Preparar (uma vez):**
1. Clone o Zooly-api ao lado deste repositório (`../Zooly-api`) e rode `npm install` nele. Para outro local, defina `ZOOLY_API_DIR`.
2. Neste repositório: `npm install` e `npx playwright install chromium`.
3. Na primeira execução, o `mongodb-memory-server` baixa o binário do MongoDB (cerca de 100 MB, fica em cache).

O `npm run test:e2e` sobe a API de teste na porta **4200** e o painel (`next dev`) na **3200**. As duas precisam estar livres; `E2E_PORTA_API` e `E2E_PORTA_WEB` trocam as portas. O painel é iniciado de propósito com as variáveis do antigo modo demo, para provar que elas são ignoradas. Para ver o relatório da última execução: `npm run test:e2e:relatorio`.

## Desenvolvimento em equipe

O desenvolvimento é realizado de forma colaborativa, utilizando GitHub para versionamento, organização das tarefas e acompanhamento das alterações.

As referências visuais do Figma devem ser utilizadas para manter a consistência visual entre as páginas.

As alterações devem preservar a estrutura existente, os componentes reutilizáveis e a separação entre o front-end e o backend.

## Repositórios

- [Zooly-web](https://github.com/ZoolyEdu/Zooly-web) — interface Web.
- [Zooly-api](https://github.com/ZoolyEdu/Zooly-api) — API e regras de negócio.

---

Projeto desenvolvido no contexto do Projeto Integrador da FATEC.

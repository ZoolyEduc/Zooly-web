# Zooly Web

<p align="center">
  <strong>Zooly — com a Turma Animal</strong>
</p>

<p align="center">
  Painel Web de gerenciamento do Zooly, uma plataforma educativa voltada para crianças de 4 a 8 anos, com foco no desenvolvimento da leitura e em atividades de aprendizagem.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Next.js-Pages_Router-000000?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Status-Em%20desenvolvimento-blue" alt="Status" />
</p>

## Sobre o projeto

O Zooly Web é a interface de gerenciamento do ecossistema Zooly, desenvolvida para professores e administradores.

Por meio do painel, os professores podem organizar suas turmas, cadastrar alunos, criar atividades educativas, utilizar o Banco de Histórias e acompanhar o desempenho dos estudantes.

A aplicação utiliza uma abordagem mobile-first, com interfaces responsivas e componentes reutilizáveis.

O Zooly faz parte de um conjunto de três aplicações independentes que trabalham de forma integrada.

## Aplicações e links oficiais

| Aplicação | Descrição | Endereço |
|---|---|---|
| Zooly Web | Painel de professores e administradores. | https://zooly-web.vercel.app |
| Zooly Game | Jogo educativo para os alunos. | https://zooly-game.vercel.app |
| Zooly API | Backend e gerenciamento dos dados. | https://zooly-api.onrender.com |

### Conta de professor para testes

Uma conta exclusiva para avaliação será disponibilizada para que professores e avaliadores possam explorar as funcionalidades do painel.

| Campo | Informação |
|---|---|
| E-mail | teste@professor.com |
| Senha | teste2026 |

## Funcionalidades

### Área do professor

- Cadastro e autenticação de professores.
- Gerenciamento de perfil.
- Visualização do painel inicial.
- Cadastro e gerenciamento de turmas.
- Cadastro e gerenciamento de alunos.
- Configuração da senha de acesso da turma.
- Criação e edição de atividades educativas.
- Publicação de atividades.
- Definição de prazos e recompensas.
- Utilização do Banco de Histórias.
- Acompanhamento do desempenho individual.
- Consulta de relatórios semanais por turma.

### Banco de Histórias

- Consulta das histórias iniciais do Zooly.
- Cadastro de histórias próprias.
- Edição, arquivamento e reativação de histórias.
- Exclusão de histórias próprias.
- Busca por título, tema ou objetivo.
- Filtros por tema, idade, origem e situação.
- Visualização de perguntas, alternativas, feedback e objetivos pedagógicos.
- Pré-visualização de histórias antes de salvar.
- Utilização de histórias na criação de atividades.

### Área administrativa

- Acesso administrativo.
- Gerenciamento de escolas.
- Gerenciamento de professores.
- Cadastro de professores.
- Edição de informações dos professores.

## Tecnologias utilizadas

| Tecnologia | Finalidade |
|---|---|
| Next.js | Framework React utilizado na aplicação Web. |
| React | Desenvolvimento de interfaces e componentes reutilizáveis. |
| JavaScript | Linguagem principal do projeto. |
| CSS Modules | Estilização isolada de páginas e componentes. |
| CSS | Estilos globais e responsividade. |
| Axios | Comunicação HTTP com a API. |
| ESLint | Análise estática e padronização do código. |
| Playwright | Testes automatizados de ponta a ponta. |
| Node.js | Ambiente de execução e ferramentas do projeto. |

O projeto utiliza o Pages Router do Next.js.

## Arquitetura e integração

O Zooly Web é uma aplicação independente que se comunica com a Zooly API por meio de requisições HTTP.

```text
       Zooly Web
    (Next.js + React)
           |
           | Requisições HTTP / JSON
           v
       Zooly API
   (Node.js + Express)
           |
           v
      MongoDB Atlas
```

O painel é responsável pela interface e pela interação dos professores e administradores.

A API centraliza a autenticação, as permissões, as regras de negócio e o acesso aos dados.

As permissões são verificadas no backend, não apenas na interface.

## Pré-requisitos

Antes de começar, é necessário ter instalado:

- [Node.js](https://nodejs.org/).
- npm, instalado junto com o Node.js.
- [Git](https://git-scm.com/).

Para executar os testes de ponta a ponta, também será necessário o Playwright e o Chromium.

## Como executar o projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/ZoolyEduc/Zooly-web.git
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

Utilize `.env.local.example` como modelo.

Exemplo:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Essa variável define o endereço da Zooly API.

Para utilizar a API publicada:

```env
NEXT_PUBLIC_API_URL=https://zooly-api.onrender.com
```

A variável `NEXT_PUBLIC_API_URL` é a configuração utilizada pelo painel.

As antigas variáveis `NEXT_PUBLIC_MODO_DEMO` e `NEXT_PUBLIC_AMBIENTE` foram removidas junto com o modo de demonstração.

**Importante:** o arquivo `.env.local` é local e não deve ser enviado ao GitHub. O arquivo `.env.local.example` pode ser versionado para documentar as configurações necessárias.

### 5. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em:

http://localhost:3000

Se a porta 3000 estiver ocupada, o Next.js poderá utilizar outra porta disponível. Nesse caso, utilize o endereço informado no terminal.

## Dados reais e modo de demonstração

O painel funciona exclusivamente com a Zooly API.

O antigo modo de demonstração foi removido, incluindo:

- Dados fictícios apresentados no navegador.
- Professora fictícia.
- Faixa de identificação do ambiente de demonstração.
- Comando `dev:demo`.
- Variáveis de ambiente relacionadas ao antigo modo de demonstração.

Quando a API está indisponível ou retorna um erro, as telas apresentam mensagens de orientação e a opção de tentar novamente, quando aplicável.

A aplicação não substitui respostas da API por dados fictícios.

Quando uma sessão expira e a API retorna `401`, o painel encerra a sessão e direciona o usuário novamente para o login.

## Banco de Histórias

O Banco de Histórias permite que os professores utilizem histórias disponibilizadas pelo Zooly ou cadastrem suas próprias histórias para reutilização em atividades educativas.

A funcionalidade está disponível na rota `/historias`.

### Histórias iniciais do Zooly

O sistema possui seis histórias iniciais, inspiradas no folclore e na cultura do Vale do Ribeira.

Cada história possui cinco perguntas, com alternativas, feedback e objetivos pedagógicos.

Essas histórias são disponibilizadas para consulta e utilização, mas não podem ser editadas ou excluídas pelos professores.

### Histórias próprias

Os professores podem cadastrar e gerenciar suas próprias histórias.

As operações disponíveis são:

- Cadastrar.
- Consultar.
- Editar.
- Arquivar.
- Reativar.
- Excluir, mediante confirmação.

As histórias próprias ficam disponíveis somente para seus respectivos autores.

### Busca e filtros

O Banco de Histórias disponibiliza:

- Busca por título, tema ou objetivo.
- Filtro por tema.
- Filtro por faixa etária.
- Filtro por origem: Zooly ou minhas histórias.
- Filtro por situação: ativas ou arquivadas.

A tela de detalhes apresenta o texto da história, as perguntas, as alternativas corretas, os feedbacks e os objetivos pedagógicos.

### Cadastro de histórias

O formulário permite configurar:

- Dados da história.
- Faixa etária.
- Objetivos pedagógicos.
- Perguntas.
- De 2 a 6 alternativas por pergunta.
- Alternativa correta.
- Feedback.
- Objetivo de cada pergunta.
- Pré-visualização antes de salvar.

Antes de gravar uma história, o painel utiliza:

```http
POST /api/historias/validar
```

Os erros de validação são apresentados junto aos campos correspondentes.

## Integração do Banco de Histórias com atividades

O professor pode utilizar uma história cadastrada no Banco de Histórias para criar uma atividade.

Existem duas formas de iniciar esse processo:

1. Acessar Histórias e selecionar **Usar em atividade**.
2. Acessar Nova Atividade, escolher **Usar o Banco de Histórias**, selecionar uma história e carregar seu conteúdo.

O painel utiliza:

```http
GET /api/historias/:id/modelo-atividade
```

O conteúdo carregado inclui título, texto, perguntas, alternativas e respostas corretas.

O feedback e os objetivos pedagógicos são apresentados como apoio ao professor e não são enviados ao aluno.

O conteúdo da atividade continua editável. O professor pode modificar o texto, perguntas, alternativas, respostas, prazo, missão, BNCC e recompensa.

Ao salvar, o painel utiliza:

```http
POST /api/atividades
```

A atividade armazena uma cópia independente do texto e das perguntas. Dessa forma, alterações ou exclusões posteriores da história original não modificam atividades já criadas.

## Páginas e rotas da aplicação

As páginas são organizadas utilizando o Pages Router do Next.js.

### Área do professor

| Rota | Descrição |
|---|---|
| `/` | Página inicial do Zooly. |
| `/login` | Acesso de usuários. |
| `/cadastro` | Cadastro de professor. |
| `/painel` | Painel inicial do professor. |
| `/turmas` | Gerenciamento de turmas. |
| `/turmas/[id]/alunos` | Gerenciamento dos alunos de uma turma. |
| `/atividades` | Listagem de atividades. |
| `/atividades/nova` | Criação e edição de atividades. |
| `/atividades/[id]` | Detalhes de uma atividade. |
| `/historias` | Banco de Histórias. |
| `/historias/[id]` | Detalhes de uma história. |
| `/historias/nova` | Cadastro e edição de histórias próprias. |
| `/desempenho` | Relatório semanal por turma. |
| `/desempenho/alunos/[id]` | Desempenho individual. |
| `/configuracoes` | Configurações do perfil. |

### Área administrativa

| Rota | Descrição |
|---|---|
| `/admin/login` | Acesso administrativo. |
| `/admin` | Visão geral da administração. |
| `/admin/escolas` | Gerenciamento de escolas. |
| `/admin/professores` | Gerenciamento de professores. |
| `/admin/professores/novo` | Cadastro de professor. |
| `/admin/professores/[id]` | Edição de professor. |

Todas as telas utilizam dados fornecidos pela API.

## Estrutura de pastas

```text
Zooly-web/
├── public/
│   └── img/
│       └── Logo e mascotes
├── src/
│   ├── components/
│   │   └── Componentes reutilizáveis
│   ├── pages/
│   │   └── Páginas e rotas
│   ├── services/
│   │   ├── api.js
│   │   ├── session.js
│   │   └── historiasApi.js
│   ├── styles/
│   │   └── Estilos globais e compartilhados
│   └── utils/
│       ├── formatacao.js
│       └── historias.js
├── tests/
│   ├── unit/
│   └── e2e/
├── playwright.config.mjs
├── .env.local.example
├── .gitignore
├── package.json
└── README.md
```

### Organização do front-end

- **src/pages:** contém as páginas e define as rotas da aplicação.
- **src/components:** reúne componentes reutilizáveis, como menus, layouts, avisos e diálogos.
- **src/services:** centraliza a comunicação com a API, o token de autenticação, a sessão e o tratamento de erros.
- **src/styles:** contém estilos globais e compartilhados.
- **src/utils:** reúne funções auxiliares, formatação de datas e IDs e regras do Banco de Histórias.
- **public/img:** armazena imagens utilizadas na interface.

Os estilos específicos das páginas e dos componentes são organizados por meio de CSS Modules.

## Backend e integração com a API

O backend do Zooly é mantido separadamente no repositório:

[Zooly API](https://github.com/ZoolyEduc/Zooly-api)

O front-end realiza requisições HTTP para acessar os recursos disponibilizados pelo backend.

A variável `NEXT_PUBLIC_API_URL` define a URL da API utilizada pela aplicação.

### Endpoints do Banco de Histórias

O painel utiliza os seguintes endpoints, com autenticação de professor:

| Método | Endpoint | Finalidade |
|---|---|---|
| GET | `/api/historias` | Consultar histórias. |
| GET | `/api/historias/:id` | Consultar uma história. |
| GET | `/api/historias/:id/perguntas` | Consultar perguntas. |
| GET | `/api/historias/:id/modelo-atividade` | Carregar história para uma atividade. |
| POST | `/api/historias/validar` | Validar uma história. |
| POST | `/api/historias` | Cadastrar história. |
| PUT | `/api/historias/:id` | Editar história. |
| PATCH | `/api/historias/:id/arquivar` | Arquivar história. |
| PATCH | `/api/historias/:id/reativar` | Reativar história. |
| DELETE | `/api/historias/:id` | Excluir história. |

A autorização definitiva das operações é realizada pela API.

Os contratos completos estão documentados no arquivo `docs/historias.md` do repositório Zooly API.

## Verificações e testes

O projeto possui comandos para análise de código, compilação e testes automatizados.

### Comandos disponíveis

```bash
# Análise estática do código
npm run lint

# Compilação para produção
npm run build

# Testes unitários
npm test

# Testes de ponta a ponta
npm run test:e2e
```

Execute essas verificações após realizar alterações no projeto e corrija os erros encontrados antes de considerar a tarefa concluída.

### Testes de ponta a ponta

O projeto utiliza Playwright para testar a aplicação integrada à Zooly API.

Os testes ficam organizados em `tests/e2e`.

A execução utiliza o código real do repositório Zooly-api, iniciado localmente com um MongoDB em memória e dados próprios para testes.

Nenhum banco de produção ou MongoDB Atlas é utilizado.

### Preparação dos testes

1. Clone o repositório Zooly-api ao lado deste projeto, na pasta `../Zooly-api`.
2. Execute `npm install` dentro do repositório da API.
3. Neste repositório, execute `npm install`.
4. Instale o Chromium:

```bash
npx playwright install chromium
```

Na primeira execução, o `mongodb-memory-server` pode baixar automaticamente o binário do MongoDB, com aproximadamente 100 MB.

Caso a API esteja em outro diretório, configure `ZOOLY_API_DIR`.

### Executando os testes

```bash
npm run test:e2e
```

O comando inicia automaticamente a API de teste e o painel.

O ambiente utiliza:

| Servidor | Porta padrão |
|---|---|
| API de teste | 4200 |
| Zooly Web | 3200 |

As portas precisam estar livres. É possível alterá-las utilizando `E2E_PORTA_API` e `E2E_PORTA_WEB`.

A execução também permite verificar que as antigas variáveis do modo de demonstração não ativam dados fictícios.

Para visualizar o relatório HTML da última execução:

```bash
npm run test:e2e:relatorio
```

## Desenvolvimento em equipe

O desenvolvimento do Zooly é realizado de forma colaborativa, utilizando Git e GitHub para versionamento, organização das tarefas e acompanhamento das alterações.

As referências visuais do Figma são utilizadas para orientar a construção das interfaces e manter a consistência visual entre as páginas.

O desenvolvimento busca preservar:

- Componentes reutilizáveis.
- Organização e separação de responsabilidades.
- Comunicação independente entre front-end e backend.
- Responsividade das interfaces.
- Padronização visual.
- Testes e validações antes das alterações serem consideradas concluídas.

## Repositórios do projeto

- [Zooly Web](https://github.com/ZoolyEduc/Zooly-web) — painel de professores e administradores.
- [Zooly API](https://github.com/ZoolyEduc/Zooly-api) — backend, autenticação e regras de negócio.
- [Zooly Game](https://github.com/ZoolyEduc/Zooly-game) — aplicação educativa para os alunos.

## Deploy

O Zooly Web está publicado na Vercel.

**Aplicação em produção:** https://zooly-web.vercel.app

O painel utiliza a Zooly API publicada no Render:

https://zooly-api.onrender.com

A variável `NEXT_PUBLIC_API_URL` deve estar configurada no ambiente de produção com o endereço correto da API.
## Acesso para avaliação

O Zooly Web está disponível para avaliação por meio do ambiente publicado.

**Endereço:** https://zooly-web.vercel.app

**Funcionalidades disponíveis para avaliação:**
- Painel do professor.
- Gerenciamento de turmas e alunos.
- Criação e publicação de atividades.
- Banco de Histórias.
- Acompanhamento de desempenho.

> As credenciais serão disponibilizadas após a criação e validação da conta de teste. Não utilize contas pessoais ou credenciais de produção para avaliações públicas.

## Status do projeto

O Zooly é um projeto acadêmico desenvolvido no curso de **Desenvolvimento de Software Multiplataforma (DSM)** da **FATEC Registro**, como parte do Projeto Integrador.

**Equipe:** KofiTech.

O projeto está em desenvolvimento contínuo, com evolução das funcionalidades, melhorias na interface e integração entre suas três aplicações.

---

<p align="center">
  Desenvolvido pela equipe KofiTech.
</p>

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
NEXT_PUBLIC_MODO_DEMO=false
```

**Importante:** o arquivo `.env.local` é local e não deve ser enviado ao GitHub. O arquivo `.env.local.example` pode ser versionado para documentar as configurações necessárias.

### 5. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

Se a porta 3000 já estiver ocupada por outro processo, o Next.js poderá iniciar em outra porta disponível, como a 3001. Utilize o endereço informado no terminal.

## Modo de demonstração

O projeto possui um modo de demonstração para permitir o desenvolvimento e a validação visual das telas sem depender da integração real com o backend.

Para ativá-lo, configure a variável:

```env
NEXT_PUBLIC_MODO_DEMO=true
```

Nesse modo, a aplicação utiliza dados fictícios para demonstrar funcionalidades como turmas, alunos, atividades e desempenho.

Para utilizar a autenticação e a API reais durante o desenvolvimento, configure:

```env
NEXT_PUBLIC_MODO_DEMO=false
```

Após alterar as variáveis de ambiente, reinicie o servidor de desenvolvimento.

O modo de demonstração é destinado ao desenvolvimento local e é desligado automaticamente em builds de produção.

## Ambiente de demonstração com API

Diferente do modo acima, que simula tudo no navegador, este ambiente usa a API e um banco separado (`zooly_demo`), para apresentações:

```bash
cp .env.demo.example .env.demo
npm run dev:demo
```

O site aponta para a API de demonstração (porta 4001) e exibe a faixa "Ambiente de demonstração". O `.env.local` não é alterado. A faixa só aparece com `NEXT_PUBLIC_AMBIENTE=demonstracao`, que não deve ser definida em produção.

A preparação completa, incluindo a API, está em `docs/publicacao.md`, no repositório Zooly-api.

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
| `/desempenho` | Relatório semanal por turma |
| `/desempenho/alunos/[id]` | Desempenho individual |
| `/configuracoes` | Configurações do perfil |
| `/admin/login` | Acesso administrativo |
| `/admin` | Visão geral da administração |
| `/admin/escolas` | Gerenciamento de escolas |
| `/admin/professores` | Gerenciamento de professores |
| `/admin/professores/novo` | Cadastro de professor |
| `/admin/professores/[id]` | Edição de professor |

As telas usam dados fictícios apenas no modo de demonstração.

## Estrutura de pastas

```text
Zooly-web/
├── design-reference/       # Referências visuais do Figma
├── public/
│   └── img/                # Logo e mascotes
├── src/
│   ├── components/         # Componentes reutilizáveis
│   ├── pages/              # Páginas e rotas
│   ├── services/           # Serviços e dados de demonstração
│   └── styles/             # Estilos globais e compartilhados
├── scripts/                # Inicialização do ambiente de demonstração
├── .env.local.example      # Modelo das variáveis de ambiente
├── .env.demo.example       # Modelo do ambiente de demonstração
├── .gitignore
├── package.json
└── README.md
```

### Organização do front-end

- `src/pages/`: contém as páginas e define as rotas da aplicação.
- `src/components/`: reúne componentes reutilizáveis, como menu, layout e cartões.
- `src/services/`: centraliza serviços da aplicação e recursos utilizados no modo de demonstração.
- `src/styles/`: contém estilos globais e estilos compartilhados.
- `public/img/`: armazena imagens utilizadas na interface.
- `design-reference/`: contém capturas de tela de referência do Figma para orientar o desenvolvimento visual.

Os estilos específicos das páginas e dos componentes são organizados por meio de CSS Modules.

## Backend e integração

O backend do Zooly é mantido separadamente no repositório [Zooly-api](https://github.com/ZoolyEdu/Zooly-api).

O front-end se comunica com a API por requisições HTTP. Todas as permissões são verificadas no backend.

A variável `NEXT_PUBLIC_API_URL` define a URL da API. Em desenvolvimento, o padrão é `http://localhost:4000`; em produção ela é obrigatória. Sessão expirada encerra o acesso e leva de volta ao login.

Variáveis e ordem de publicação: `docs/publicacao.md`, no repositório Zooly-api.

## Verificações do projeto

Para executar a análise de código:

```bash
npm run lint
```

Para gerar a versão de produção:

```bash
npm run build
```

Execute essas verificações após realizar alterações no projeto e corrija os erros encontrados antes de considerar a tarefa concluída.

## Desenvolvimento em equipe

O desenvolvimento é realizado de forma colaborativa, utilizando GitHub para versionamento, organização das tarefas e acompanhamento das alterações.

As referências do Figma disponíveis em `design-reference/` devem ser utilizadas para manter a consistência visual entre as páginas.

As alterações devem preservar a estrutura existente, os componentes reutilizáveis, o modo de demonstração e a separação entre o front-end e o backend.

## Repositórios

- [Zooly-web](https://github.com/ZoolyEdu/Zooly-web) — interface Web.
- [Zooly-api](https://github.com/ZoolyEdu/Zooly-api) — API e regras de negócio.

---

Projeto desenvolvido no contexto do Projeto Integrador da FATEC.

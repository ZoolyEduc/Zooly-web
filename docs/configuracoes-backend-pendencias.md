# Configurações — disponibilidade e pendências do backend

## Escopo da análise

O frontend Next.js usa `NEXT_PUBLIC_API_URL` (padrão `http://localhost:4000`) e faz chamadas JSON pelo serviço `src/services/api.js`. O workspace não contém a implementação desse servidor/API.

Existe `referencia-antigo/`, mas é outro aplicativo Express/EJS (porta 8080, formulários HTML e sessão). As rotas abaixo foram verificadas nesse código legado; não são a API JSON consumida pelo frontend e não comprovam que endpoints `/api/...` existam. Nenhuma alteração foi feita no backend.

## A. O que já existe

### Backend legado confirmado no workspace

| Informação / funcionalidade | Endpoint e método confirmados | Campos ou retorno verificados | Pode atualizar? | Integrado ao frontend atual? |
|---|---|---|---|---|
| Conta do professor | `POST /cadastro` | Recebe `nome`, `email`, `senha` e `codigo_escola`; cria usuário e redireciona. A senha é armazenada com hash. | Apenas criação de conta. | Não. O frontend chama `POST /api/professores`, cuja implementação não está no workspace. |
| Login do professor | `POST /login` | Recebe `email` e `senha`; grava `usuarioId` e `usuarioNome` na sessão e redireciona. | Não atualiza o perfil. | Não. O frontend chama `POST /api/auth/login`, não encontrado no backend legado. |
| Dados persistidos do professor | Modelo `Users`: `id`, `nome`, `email`, `senha`, `codigo_escola`, `tipo_usuario`. | O login guarda apenas o ID e o nome na sessão. Não há endpoint JSON para consultar os campos do professor. | Não há rota de atualização de perfil. | Parcial e somente pelo estado local de sessão (`zooly_usuario`); não há consulta de perfil ao backend pelo frontend. |
| Escola | Não há modelo `Escola` nem rota de consulta/atualização no backend legado. | `codigo_escola` existe no modelo do usuário. Isso não comprova nome, telefone, endereço ou e-mail institucional da escola. | Não. | Parcial e não verificável: Configurações lê escolas aninhadas na resposta esperada de `GET /api/turmas`, mas a resposta real da API não está disponível. |
| Turmas e quantidade de alunos | `GET /turmas` (renderiza HTML); `POST /turmas/cadastrar`; `POST /turmas/alterar`. | Modelo `Turma`: `nome`, `periodo`, `mascote`, `codigo_turma`; a listagem calcula `totalAlunos`. | Sim, via formulário `POST /turmas/alterar`, não via JSON/PUT. | Não. O frontend atual usa rotas `/api/turmas`. |
| Tela de configurações legada | `GET /configuracoes` | Renderiza a página sem enviar dados do professor ou da escola. | Não. | Não. |

### Comportamentos que existem apenas no frontend atual

| Informação / funcionalidade | Endpoint/método verificado | Campos disponíveis | Pode atualizar? | Integração atual |
|---|---|---|---|---|
| Nome e e-mail exibidos | Nenhum endpoint de perfil é chamado pela tela. `getSession()` lê `zooly_usuario` do `localStorage`; o login guarda o objeto `usuario` recebido de `/api/auth/login`. | A tela usa `usuario.nome` e `usuario.email`, se presentes na sessão. | Não pela tela atual. | Sessão local; não comprova persistência ou atualização no backend. |
| Nome e dados da escola | `GET /api/turmas` é chamado pelo frontend; método e resposta do backend não puderam ser verificados. | O frontend espera `turmas[].escola` e consegue exibir `escola.nome` e `escola.codigo_escola` se retornados. | Não pela tela atual. | Leitura dependente da API não disponível no workspace. |
| Preferências de notificações | Nenhuma chamada de API. | `conclusao` e `prazo`, em `zooly_notification_preferences`. | Sim, apenas no `localStorage` do navegador. | Integrado somente localmente; não sincroniza entre dispositivos nem dispara notificações. |
| Foto de perfil e alteração de senha | Nenhuma chamada de API encontrada. | Não há URL de foto nem fluxo de senha no contrato frontend verificado. | Não. Os controles da tela ficam desabilitados. | Não integrado. |

## B. O que falta implementar

As rotas e payloads a seguir são **propostas** para o backend/API atual. Não são endpoints existentes.

| Necessidade | Endpoint/método sugerido | Payload sugerido | Resposta sugerida |
|---|---|---|---|
| Consultar dados do professor autenticado | `GET /api/professores/me` | Sem payload. | `{ "id": "...", "nome": "...", "email": "...", "fotoUrl": null, "escolaId": "..." }` |
| Atualizar nome/e-mail do professor | `PATCH /api/professores/me` | `{ "nome": "...", "email": "..." }` | Registro atualizado; validar unicidade do e-mail e autorização. |
| Alterar senha | `PATCH /api/professores/me/senha` | `{ "senhaAtual": "...", "novaSenha": "..." }` | Confirmação sem devolver senha/hash; validar senha atual e política de senha. |
| Consultar dados da escola | `GET /api/escolas/{escolaId}` | Sem payload. | `{ "id": "...", "nome": "...", "codigo": "...", "telefone": "...", "endereco": "...", "emailInstitucional": "..." }` |
| Atualizar dados da escola | `PATCH /api/escolas/{escolaId}` | `{ "nome": "...", "telefone": "...", "endereco": "...", "emailInstitucional": "..." }` | Registro atualizado; restringir a usuários autorizados da escola. |
| Enviar foto do professor | `POST /api/professores/me/foto` com `multipart/form-data` (campo `foto`) | Arquivo JPG/PNG, com limites de tamanho e validação de conteúdo definidos pelo backend. | `{ "fotoUrl": "..." }`; substituir/remover a foto anterior conforme política de armazenamento. |
| Consultar preferências de notificações | `GET /api/professores/me/preferencias/notificacoes` | Sem payload. | `{ "atividadeConcluida": false, "prazoProximo": false }` |
| Persistir preferências de notificações | `PUT /api/professores/me/preferencias/notificacoes` | `{ "atividadeConcluida": true, "prazoProximo": false }` | Preferências persistidas por professor; integrar também o serviço que entrega as notificações. |

### Observações para integração

- Definir o contrato de escola e sua relação com professor/turma antes de apresentar nome, código, telefone, endereço ou e-mail institucional como dados da escola.
- O código legado `Users.codigo_escola` existe, mas não há entidade de escola nem atualização associada. `Turma.codigo_turma` identifica uma turma e não deve ser exibido como código da escola.
- Preferências armazenadas em `localStorage` podem continuar como contingência explícita, mas só devem ser consideradas persistidas na conta depois da integração com os endpoints propostos.
- O upload precisa armazenar o arquivo em serviço/pasta apropriado, persistir a referência, validar tipo/tamanho e aplicar autorização; um `input[type=file]` isolado não implementa persistência.
- A tela atual deixa edição de perfil, alteração de senha e upload indisponíveis e informa que as preferências salvas são locais. Não há fallback com dados inventados.

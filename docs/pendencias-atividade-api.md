# Pendências de integração de atividades

Verificação feita no código disponível em `Zooly-api/src/routes`, `src/services` e `src/models`.

## Contratos existentes

- `POST /api/atividades` cria uma atividade com status `rascunho` no servidor.
- `GET /api/atividades/publicadas` lista somente atividades publicadas.
- `PATCH /api/atividades/:id/publicar` publica um rascunho.
- `PUT /api/atividades/:id` atualiza título, ordem, história, questões, prazo e recompensa, mas não retorna um rascunho por ID.
- `GET /api/bncc/busca?tema=...&limite=...` pesquisa aprendizagens e retorna `codigo`, `texto` e metadados.
- `GET /api/historias` e `GET /api/historias/:id` consultam histórias.

## O que falta no backend

- Missões: não há modelo, catálogo ou rota para consultar e vincular uma missão à atividade.
- BNCC: há consulta, mas o serviço de atividade rejeita campos extras e o modelo não guarda códigos BNCC. A seleção na tela é temporária e não é enviada como se estivesse persistida.
- Pontos: o schema de questão não possui pontuação. O serviço rejeita `pontos` e `pontuacao` como campos desconhecidos.
- Rascunhos: o POST persiste o rascunho, mas não há rota de listagem nem de consulta individual; por isso o frontend não consegue mostrá-lo na lista ou reabri-lo para edição. `GET /api/atividades/publicadas` não pode ser usado para isso.

Para concluir esses fluxos, a API precisa definir contratos de leitura e escrita para missões, habilidades BNCC e pontos, além de rotas de listagem/consulta de rascunhos. A edição também precisa carregar os dados atuais do rascunho antes de chamar o `PUT` existente.

## Verificação do ambiente desta execução

`http://localhost:4000/api/health` não respondeu durante a implementação. As rotas acima foram confirmadas pelo código do backend no workspace; a integração com a instância em execução ainda precisa ser validada quando o serviço estiver acessível.

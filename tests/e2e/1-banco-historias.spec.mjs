/*
 * Banco de Histórias e integração com atividades: INTEGRAÇÃO REAL com a Zooly API
 * (código do Zooly-api, MongoDB em memória, 6 histórias iniciais do seed real).
 * Os cenários rodam em sequência e compartilham a sessão da professora.
 */
import { expect, test } from "@playwright/test";
import { HISTORIA_DO_OUTRO } from "./dados.mjs";
import { api, cartao, entrar, tokenDe, vigiarConsole } from "./suporte.mjs";

test.describe.configure({ mode: "serial" });

const INICIAIS = [
  "O Nego d'Água do Rio Ribeira",
  "O Curupira da Mata Atlântica",
  "Mãe-do-Ouro e os Tesouros Escondidos",
  "O Minhocão do Rio Ribeira",
  "O Saci da Caverna do Diabo",
  "A Protetora dos Fandangueiros",
];
const PROPRIA = "A tartaruga Tita";

let contexto;
let p;
let consoleVigiado;
let token;

test.beforeAll(async ({ browser }) => {
  contexto = await browser.newContext({
    viewport: { width: 1366, height: 900 },
  });
  p = await contexto.newPage();
  consoleVigiado = vigiarConsole(p);
  await entrar(p);
  token = await tokenDe(p);
});

test.afterAll(async () => {
  consoleVigiado.verificar();
  await contexto.close();
});

test("lista as 6 histórias do Zooly com tema, faixa etária, perguntas e origem", async () => {
  await p.getByRole("link", { name: "Histórias" }).first().click();
  await p.waitForURL(/\/historias$/);
  await expect(
    p.getByRole("heading", { name: "Banco de Histórias" }),
  ).toBeVisible();
  await expect(p.getByText("6 histórias encontradas")).toBeVisible();
  for (const titulo of INICIAIS) await expect(cartao(p, titulo)).toBeVisible();

  const curupira = cartao(p, "O Curupira da Mata Atlântica");
  await expect(curupira.getByText("Zooly", { exact: true })).toBeVisible();
  await expect(curupira.getByText("Folclore da floresta")).toBeVisible();
  await expect(curupira.getByText("4 a 8 anos")).toBeVisible();
  await expect(curupira.getByText("5 perguntas")).toBeVisible();
  await expect(curupira.getByText(/educação ambiental/i)).toBeVisible();
  // Histórias do Zooly: só consulta e uso.
  await expect(curupira.getByRole("link", { name: /Editar/ })).toHaveCount(0);
  await expect(
    curupira.getByRole("button", { name: /Arquivar|Excluir/ }),
  ).toHaveCount(0);
  // A história particular de outro professor nunca aparece.
  await expect(p.getByText(HISTORIA_DO_OUTRO)).toHaveCount(0);
});

test("busca e filtros por tema, idade e origem", async () => {
  await p.getByLabel("Buscar", { exact: true }).fill("curupira");
  await expect(p.getByText("1 história encontrada")).toBeVisible();
  await expect(cartao(p, "O Curupira da Mata Atlântica")).toBeVisible();

  await p.getByRole("button", { name: "Limpar filtros" }).click();
  await p.getByLabel("Tema").selectOption("Cultura caiçara");
  await expect(p.getByText("1 história encontrada")).toBeVisible();
  await expect(cartao(p, "A Protetora dos Fandangueiros")).toBeVisible();

  await p.getByRole("button", { name: "Limpar filtros" }).click();
  await p.getByLabel("Idade").selectOption("3");
  await expect(
    p.getByText("Nenhuma história combina com os filtros escolhidos."),
  ).toBeVisible();

  await p.getByRole("button", { name: "Limpar filtros" }).click();
  await p.getByLabel("Origem").selectOption("professor");
  await expect(p.getByText("0 histórias encontradas")).toBeVisible();
  await p.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(p.getByText("6 histórias encontradas")).toBeVisible();
});

test("detalhe da história do Zooly mostra texto, perguntas, correta e feedback, sem edição", async () => {
  await cartao(p, "O Curupira da Mata Atlântica")
    .getByRole("link", { name: "Ver" })
    .click();
  await p.waitForURL(/\/historias\/[0-9a-f]{24}$/);
  const idCurupira = p.url().split("/").pop();
  await expect(
    p.getByRole("heading", { level: 1, name: "O Curupira da Mata Atlântica" }),
  ).toBeVisible();
  await expect(
    p.getByText(/Quando o Curupira anda, as pegadas apontam/),
  ).toBeVisible();
  await expect(p.getByText(/Adaptação infantil do Zooly/)).toBeVisible();
  await expect(p.getByRole("heading", { name: "Perguntas (5)" })).toBeVisible();

  const primeira = p.getByRole("region", { name: "Pergunta 1" });
  await expect(
    primeira.getByText("1. Como são os cabelos do Curupira?"),
  ).toBeVisible();
  await expect(
    primeira.locator("li", { hasText: "(resposta correta)" }),
  ).toContainText("Vermelhos como fogo");
  await expect(
    primeira.getByText(/Feedback:.*vermelhos como fogo/),
  ).toBeVisible();
  await expect(primeira.getByText(/Objetivo:/)).toBeVisible();
  await expect(p.getByText(/Esta é uma história do Zooly/)).toBeVisible();
  await expect(p.getByRole("link", { name: "Editar" })).toHaveCount(0);
  await expect(p.getByRole("button", { name: /Excluir|Arquivar/ })).toHaveCount(
    0,
  );

  // Abrir a edição pela URL também não oferece formulário (e a API recusaria).
  await p.goto(`/historias/nova?id=${idCurupira}`);
  await expect(p.getByText(/não pode ser\s+editada/)).toBeVisible();
  await expect(
    p.getByRole("button", { name: "Salvar alterações" }),
  ).toHaveCount(0);
  const tentativa = await api(token, `/api/historias/${idCurupira}`, {
    method: "PUT",
    body: JSON.stringify({ titulo: "x", conteudo: "y" }),
  });
  expect(tentativa.status).toBe(403);
});

test("cadastro de história própria: validação da API, pré-visualização e salvamento", async () => {
  await p.goto("/historias");
  await p.getByRole("link", { name: "Nova história" }).click();
  await p.waitForURL(/\/historias\/nova$/);
  await p.getByLabel("Título").fill(PROPRIA);
  await p
    .getByLabel("Descrição")
    .fill("Uma tartaruga volta para a praia onde nasceu.");
  await p.getByLabel("Tema ou categoria").fill("Animais do mar");
  await p.getByLabel("Idade mínima").selectOption("5");
  await p.getByLabel("Idade máxima").selectOption("7");
  await p
    .getByLabel("Texto da história")
    .fill(
      "A tartaruga Tita nadou muito longe. Um dia, voltou para a praia onde nasceu.",
    );
  await p
    .getByLabel("Objetivo 1")
    .fill("Conhecer o ciclo de vida das tartarugas.");

  const pergunta = p.getByRole("group", { name: "Pergunta 1" });
  await pergunta.getByLabel("Enunciado").fill("Para onde Tita voltou?");
  await pergunta.getByLabel("Texto da alternativa A da pergunta 1").fill("Sim");
  await pergunta.getByLabel("Texto da alternativa B da pergunta 1").fill("sim");

  // Alternativas repetidas: a API (POST /validar) recusa e nada é salvo.
  await p.getByRole("button", { name: "Salvar história" }).click();
  await expect(
    p.getByText("Revise os campos destacados antes de salvar."),
  ).toBeVisible();
  await expect(pergunta.getByText(/não podem se repetir/)).toBeVisible();
  const antes = await api(
    token,
    "/api/historias?origem=professor&incluirArquivadas=true",
  );
  expect(antes.corpo.total).toBe(0);

  await pergunta
    .getByLabel("Texto da alternativa A da pergunta 1")
    .fill("Para a montanha");
  await pergunta
    .getByLabel("Texto da alternativa B da pergunta 1")
    .fill("Para a praia onde nasceu");
  await pergunta.getByLabel("Alternativa B é a correta").check();
  await pergunta
    .getByLabel("Feedback pedagógico")
    .fill("Isso! Tita voltou para a praia onde nasceu.");
  await pergunta
    .getByLabel("Objetivo da pergunta")
    .fill("Localizar informação no texto.");

  await p.getByRole("button", { name: "Pré-visualizar" }).click();
  const previa = p.getByRole("region", { name: "Pré-visualização" });
  await expect(previa.getByRole("heading", { name: PROPRIA })).toBeVisible();
  await expect(
    previa.locator("li", { hasText: "(resposta correta)" }),
  ).toContainText("Para a praia onde nasceu");

  await p.getByRole("button", { name: "Salvar história" }).click();
  await p.waitForURL(/\/historias\/[0-9a-f]{24}\?salva=1$/);
  await expect(
    p.getByText("História salva no Banco de Histórias."),
  ).toBeVisible();
  await expect(p.getByText("Minha história")).toBeVisible();

  const salva = await api(token, "/api/historias?origem=professor");
  expect(salva.corpo.historias.map((h) => h.titulo)).toEqual([PROPRIA]);
  expect(salva.corpo.historias[0].faixaEtaria).toEqual({
    minima: 5,
    maxima: 7,
  });
  expect(salva.corpo.historias[0].totalPerguntas).toBe(1);
});

test("edição, arquivamento, reativação e exclusão com confirmação", async () => {
  await p.getByRole("link", { name: "Editar" }).click();
  await p.waitForURL(/\/historias\/nova\?id=/);
  await expect(p.getByLabel("Título")).toHaveValue(PROPRIA);
  await p.getByRole("button", { name: "Nova pergunta" }).click();
  const segunda = p.getByRole("group", { name: "Pergunta 2" });
  await segunda.getByLabel("Enunciado").fill("Como estava a praia?");
  await segunda.getByLabel("Texto da alternativa A da pergunta 2").fill("Suja");
  await segunda
    .getByLabel("Texto da alternativa B da pergunta 2")
    .fill("Limpinha");
  await segunda.getByRole("button", { name: "Adicionar alternativa" }).click();
  await segunda
    .getByLabel("Texto da alternativa C da pergunta 2")
    .fill("Gelada");
  await segunda.getByLabel("Alternativa B é a correta").check();
  await p.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(
    p.getByText("História salva no Banco de Histórias."),
  ).toBeVisible();
  await expect(p.getByRole("heading", { name: "Perguntas (2)" })).toBeVisible();

  await p.goto("/historias");
  const minha = cartao(p, PROPRIA);
  await expect(minha.getByText("Minha história")).toBeVisible();
  await minha.getByRole("button", { name: "Arquivar" }).click();
  await expect(p.getByText(/foi arquivada/)).toBeVisible();
  await expect(cartao(p, PROPRIA)).toHaveCount(0);
  await p.getByLabel("Situação").selectOption("arquivada");
  await expect(cartao(p, PROPRIA).getByText("Arquivada")).toBeVisible();
  await cartao(p, PROPRIA).getByRole("button", { name: "Reativar" }).click();
  await expect(p.getByText(/foi reativada/)).toBeVisible();
  await p.getByLabel("Situação").selectOption("ativa");
  await expect(cartao(p, PROPRIA)).toBeVisible();

  // Exclusão pede confirmação; cancelar não apaga.
  await cartao(p, PROPRIA)
    .getByRole("button", { name: `Excluir ${PROPRIA}` })
    .click();
  const dialogo = p.getByRole("alertdialog", { name: "Excluir história?" });
  await expect(dialogo).toBeVisible();
  await dialogo.getByRole("button", { name: "Cancelar" }).click();
  await expect(cartao(p, PROPRIA)).toBeVisible();
});

test("usar história do Zooly em atividade: preenche tudo, permite editar e envia no contrato", async () => {
  await p.goto("/historias");
  await cartao(p, "O Curupira da Mata Atlântica")
    .getByRole("link", { name: "Usar em atividade" })
    .click();
  await p.waitForURL(/\/atividades\/nova\?historiaId=/);

  await expect(p.getByLabel("Nome da atividade")).toHaveValue(
    "O Curupira da Mata Atlântica",
  );
  await expect(p.getByLabel("Usar o Banco de Histórias")).toBeChecked();
  await expect(p.getByLabel("Texto da história")).toHaveValue(
    /Na Mata Atlântica do Vale do Ribeira/,
  );
  await expect(p.getByText("Questão 5")).toBeVisible();
  const enunciados = p.locator('input[id^="enunciado-"]');
  await expect(enunciados).toHaveCount(5);
  await expect(enunciados.first()).toHaveValue(
    "Como são os cabelos do Curupira?",
  );
  // Respostas corretas marcadas para revisão e apoio pedagógico visível só ao professor.
  const primeira = p
    .locator("article")
    .filter({ has: p.getByText("Questão 1", { exact: true }) });
  await expect(primeira.getByPlaceholder("Alternativa A")).toHaveValue(
    "Vermelhos como fogo",
  );
  await expect(
    primeira.getByLabel("Marcar alternativa 1 como correta"),
  ).toBeChecked();
  await expect(
    p.getByRole("complementary", { name: "Apoio pedagógico da questão 1" }),
  ).toContainText("vermelhos como fogo");
  await expect(
    p.getByRole("complementary", { name: "Apoio pedagógico da história" }),
  ).toContainText("Mata Atlântica");

  // Edição antes de salvar: título, texto, alternativa, remover e adicionar questão, prazo.
  await p.getByLabel("Nome da atividade").fill("Missão do Curupira");
  await p
    .getByLabel("Texto da história")
    .fill("Texto adaptado pela professora.");
  await primeira.getByPlaceholder("Alternativa B").fill("Azuis como o mar");
  await p.getByRole("button", { name: "Excluir questão 5" }).click();
  await p.getByRole("button", { name: "Nova questão" }).click();
  const nova = p
    .locator("article")
    .filter({ has: p.getByText("Questão 5", { exact: true }) });
  await nova
    .getByPlaceholder("Digite a pergunta")
    .fill("Você gosta de árvores?");
  await nova.getByPlaceholder("Alternativa A").fill("Sim");
  await nova.getByPlaceholder("Alternativa B").fill("Não");
  await p.getByLabel("Prazo (opcional)").fill("2026-12-15");

  const envio = p.waitForRequest(
    (req) => req.url().endsWith("/api/atividades") && req.method() === "POST",
  );
  await p.getByRole("button", { name: "Salvar Atividade" }).click();
  const corpo = (await envio).postDataJSON();
  await expect(p.getByText(/Rascunho salvo/)).toBeVisible();

  expect(Object.keys(corpo).sort()).toEqual([
    "habilidadesBncc",
    "historia",
    "missao",
    "prazo",
    "questoes",
    "recompensaMoedas",
    "titulo",
    "turma",
  ]);
  expect(corpo.titulo).toBe("Missão do Curupira");
  expect(corpo.historia).toEqual({
    tipo: "propria",
    texto: "Texto adaptado pela professora.",
    bancoHistoriaId: expect.stringMatching(/^[0-9a-f]{24}$/),
  });
  expect(corpo.questoes).toHaveLength(5);
  expect(corpo.questoes[0].alternativas[1].texto).toBe("Azuis como o mar");
  for (const questao of corpo.questoes) {
    expect(Object.keys(questao).sort()).toEqual([
      "alternativas",
      "enunciado",
      "pontos",
      "respostasCorretas",
      "tipo",
    ]);
    const ids = questao.alternativas.map((a) => a._id);
    expect(ids).toContain(questao.respostasCorretas[0]);
  }
  expect(JSON.stringify(corpo)).not.toMatch(
    /feedback|objetivoPedagogico|apoio/,
  );

  // A atividade salva tem a cópia editada; o gabarito foi preservado.
  const lista = await api(token, "/api/atividades");
  const criada = lista.corpo.atividades.find(
    (a) => a.titulo === "Missão do Curupira",
  );
  const detalhe = await api(token, `/api/atividades/${criada._id}`);
  expect(detalhe.corpo.atividade.historia.texto).toBe(
    "Texto adaptado pela professora.",
  );
  const q1 = detalhe.corpo.atividade.questoes[0];
  expect(
    q1.alternativas.find((a) => a._id === q1.respostasCorretas[0]).texto,
  ).toBe("Vermelhos como fogo");

  await p.getByRole("button", { name: "Publicar atividade" }).click();
  await p.waitForURL(/\/atividades$/);
  await expect(
    p
      .locator("article")
      .filter({ hasText: "Missão do Curupira" })
      .getByText("Publicada", { exact: true }),
  ).toBeVisible();
});

test("reabrir a atividade do banco recupera o apoio pedagógico das perguntas", async () => {
  const lista = await api(token, "/api/atividades");
  const atividade = lista.corpo.atividades.find(
    (a) => a.titulo === "Missão do Curupira",
  );
  await p.goto(`/atividades/nova?id=${atividade._id}`);
  await expect(p.getByLabel("Nome da atividade")).toHaveValue(
    "Missão do Curupira",
  );
  await expect(
    p.getByRole("complementary", { name: "Apoio pedagógico da questão 2" }),
  ).toContainText("pegadas");
  // A questão criada pela professora não tem apoio do banco.
  await expect(
    p.getByRole("complementary", { name: "Apoio pedagógico da questão 5" }),
  ).toHaveCount(0);
});

test("atividade criada da história própria não muda quando a história é editada", async () => {
  await p.goto("/atividades/nova");
  await p.getByLabel("Nome da atividade").fill("Rascunho que será substituído");
  await p.getByLabel("Usar o Banco de Histórias").check();
  await p
    .getByLabel("História do banco")
    .selectOption({ label: `${PROPRIA} (minha)` });
  await p
    .getByRole("button", { name: "Carregar história e perguntas" })
    .click();
  const dialogo = p.getByRole("alertdialog", {
    name: "Substituir o conteúdo?",
  });
  await expect(dialogo).toBeVisible();
  await dialogo.getByRole("button", { name: "Substituir" }).click();
  await expect(p.getByLabel("Nome da atividade")).toHaveValue(PROPRIA);
  await expect(p.locator('input[id^="enunciado-"]')).toHaveCount(2);
  await p.getByRole("button", { name: "Salvar Atividade" }).click();
  await expect(p.getByText(/Rascunho salvo/)).toBeVisible();

  // A professora edita a história no banco depois.
  const proprias = await api(token, "/api/historias?origem=professor");
  const historia = proprias.corpo.historias[0];
  await p.goto(`/historias/nova?id=${historia._id}`);
  await p
    .getByLabel("Texto da história")
    .fill("Texto totalmente novo da história.");
  await p.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(
    p.getByText("História salva no Banco de Histórias."),
  ).toBeVisible();

  const lista = await api(token, "/api/atividades");
  const atividade = lista.corpo.atividades.find((a) => a.titulo === PROPRIA);
  await p.goto(`/atividades/${atividade._id}`);
  await expect(p.getByText(/A tartaruga Tita nadou muito longe/)).toBeVisible();
  await expect(p.getByText("Texto totalmente novo da história.")).toHaveCount(
    0,
  );

  // Agora a exclusão confirmada da história não afeta a atividade.
  await p.goto("/historias");
  await cartao(p, PROPRIA)
    .getByRole("button", { name: `Excluir ${PROPRIA}` })
    .click();
  await p
    .getByRole("alertdialog")
    .getByRole("button", { name: "Excluir" })
    .click();
  await expect(p.getByText(`"${PROPRIA}" foi excluída.`)).toBeVisible();
  await expect(cartao(p, PROPRIA)).toHaveCount(0);
  const atividadeDepois = await api(token, `/api/atividades/${atividade._id}`);
  expect(atividadeDepois.corpo.atividade.historia.texto).toMatch(
    /^A tartaruga Tita nadou/,
  );
});

test("erros da API aparecem com mensagem clara, sem dados substitutos", async () => {
  await p.route("**/api/historias?**", (rota) =>
    rota.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        sucesso: false,
        mensagem: "Ocorreu um erro interno no servidor.",
      }),
    }),
  );
  await p.goto("/historias");
  await expect(
    p.getByText("Ocorreu um erro interno no servidor."),
  ).toBeVisible();
  await expect(p.getByRole("article")).toHaveCount(0);
  await p.unroute("**/api/historias?**");
  await p.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(p.getByText("6 histórias encontradas")).toBeVisible();

  // API fora do ar.
  await p.route("**/api/historias/**", (rota) =>
    rota.abort("connectionrefused"),
  );
  await p.goto("/historias/507f1f77bcf86cd799439011");
  await expect(p.getByText(/Não consegui conectar à API/)).toBeVisible();
  await p.unroute("**/api/historias/**");

  // 403 vindo da API (ex.: perfil sem permissão) aparece como erro, sem tela vazia enganosa.
  await p.route("**/api/historias?**", (rota) =>
    rota.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        sucesso: false,
        mensagem: "Você não tem permissão para realizar esta operação.",
      }),
    }),
  );
  await p.goto("/historias");
  await expect(
    p.getByText("Você não tem permissão para realizar esta operação."),
  ).toBeVisible();
  await p.unroute("**/api/historias?**");
});

test("sessão expirada (401) volta para o login", async () => {
  await p.route("**/api/historias?**", (rota) =>
    rota.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        sucesso: false,
        mensagem: "Token inválido ou expirado.",
      }),
    }),
  );
  await p.goto("/historias");
  await p.waitForURL(/\/login\?sessao=expirada/);
  await expect(
    p.getByText("Sua sessão expirou. Entre novamente."),
  ).toBeVisible();
  expect(
    await p.evaluate(() => localStorage.getItem("zooly_token")),
  ).toBeNull();
  await p.unroute("**/api/historias?**");
});

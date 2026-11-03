/*
 * Regressão das telas existentes e ausência do modo demonstração: INTEGRAÇÃO REAL com a
 * Zooly API. O painel é iniciado com NEXT_PUBLIC_MODO_DEMO=true e NEXT_PUBLIC_AMBIENTE=
 * demonstracao (playwright.config.mjs) para provar que essas variáveis não têm mais efeito.
 */
import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { TURMA, URL_API } from "./dados.mjs";
import { api, entrar, tokenDe, vigiarConsole } from "./suporte.mjs";

test.describe.configure({ mode: "serial" });

let contexto;
let p;
let consoleVigiado;
const chamadasApi = [];

test.beforeAll(async ({ browser }) => {
  contexto = await browser.newContext({
    viewport: { width: 1280, height: 860 },
  });
  p = await contexto.newPage();
  consoleVigiado = vigiarConsole(p);
  p.on("request", (req) => {
    if (req.url().startsWith(URL_API)) chamadasApi.push(req.url());
  });
});

test.afterAll(async () => {
  consoleVigiado.verificar();
  await contexto.close();
});

test("sem modo demonstração: sem faixa, sem sessão fictícia e com chamadas reais à API", async () => {
  await p.goto("/painel");
  // Sem sessão real, o painel exige login (antes, o demo criava uma professora fictícia).
  await p.waitForURL(/\/login/);
  await expect(p.getByText(/demonstra/i)).toHaveCount(0);
  await p.goto("/admin/login");
  await expect(p.getByText(/demonstra/i)).toHaveCount(0);
  await expect(
    p.getByRole("button", { name: "Entrar no painel" }),
  ).toBeEnabled();

  await entrar(p);
  await expect(p.getByText(/demonstra|Helena Ferreira/i)).toHaveCount(0);
  await expect(
    p.getByRole("heading", { name: "Olá, Professora E2E!" }),
  ).toBeVisible();
  expect(chamadasApi.some((url) => url.endsWith("/api/auth/login"))).toBe(true);
  expect(await p.evaluate(() => localStorage.getItem("zooly_token"))).toMatch(
    /^ey/,
  );
});

test("o código não tem mais serviço, script nem variáveis do modo demo", async () => {
  for (const arquivo of [
    "src/services/demo.js",
    "src/components/AmbienteBanner/index.js",
    "scripts/dev-demo.mjs",
    ".env.demo.example",
  ])
    expect(existsSync(arquivo), arquivo).toBe(false);
  const pacote = JSON.parse(await readFile("package.json", "utf8"));
  expect(
    Object.keys(pacote.scripts).filter((nome) => /demo/i.test(nome)),
  ).toEqual([]);
  expect(await readFile(".env.local.example", "utf8")).not.toMatch(
    /DEMO|AMBIENTE/,
  );
});

test("telas existentes continuam carregando dados reais", async () => {
  await p.goto("/turmas");
  await expect(p.getByText(TURMA.nome).first()).toBeVisible();
  await p.goto("/atividades");
  await expect(p.getByRole("heading", { name: "Atividades" })).toBeVisible();
  await expect(
    p.getByRole("link", { name: "Banco de Histórias" }),
  ).toBeVisible();
  await p.goto("/desempenho");
  await expect(
    p.getByRole("heading", { name: /Desempenho/ }).first(),
  ).toBeVisible();
  await p.goto("/configuracoes");
  await expect(
    p.getByRole("heading", { name: /Configura/ }).first(),
  ).toBeVisible();
  await p.goto("/painel");
  await expect(p.getByText(/demonstra/i)).toHaveCount(0);
});

test("criar atividade com história escrita pela professora continua funcionando", async () => {
  await p.goto("/atividades/nova");
  await p.getByLabel("Nome da atividade").fill("Atividade escrita à mão");
  await expect(p.getByLabel("Escrever uma história")).toBeChecked();
  await p
    .getByLabel("Texto da história")
    .fill("Era uma vez um sapo que gostava de cantar.");
  await p.getByPlaceholder("Digite a pergunta").fill("Do que o sapo gostava?");
  await p.getByPlaceholder("Alternativa A").fill("De cantar");
  await p.getByPlaceholder("Alternativa B").fill("De dormir");

  const envio = p.waitForRequest(
    (req) => req.url().endsWith("/api/atividades") && req.method() === "POST",
  );
  await p.getByRole("button", { name: "Salvar Atividade" }).click();
  const corpo = (await envio).postDataJSON();
  expect(corpo.historia).toEqual({
    tipo: "propria",
    texto: "Era uma vez um sapo que gostava de cantar.",
  });
  await expect(p.getByText(/Rascunho salvo/)).toBeVisible();

  // Editar o rascunho (PUT) e publicar.
  await p
    .getByLabel("Nome da atividade")
    .fill("Atividade escrita à mão (revisada)");
  await p.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(p.getByText("Alterações salvas.")).toBeVisible();
  await p.getByRole("button", { name: "Publicar atividade" }).click();
  await p.waitForURL(/\/atividades$/);
  const token = await tokenDe(p);
  const lista = await api(token, "/api/atividades");
  const atividade = lista.corpo.atividades.find(
    (a) => a.titulo === "Atividade escrita à mão (revisada)",
  );
  expect(atividade.status).toBe("publicada");
  await p.goto(`/atividades/${atividade._id}`);
  await expect(
    p.getByText("Era uma vez um sapo que gostava de cantar."),
  ).toBeVisible();
});

test("responsivo: Banco de Histórias e formulário sem rolagem horizontal em 375px", async () => {
  await p.setViewportSize({ width: 375, height: 800 });
  for (const rota of ["/historias", "/historias/nova", "/atividades/nova"]) {
    await p.goto(rota);
    await p.waitForLoadState("networkidle");
    const largura = await p.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(largura, rota).toBeLessThanOrEqual(375);
  }
});

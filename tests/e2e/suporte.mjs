import { expect } from "@playwright/test";
import { PROFESSORA, URL_API } from "./dados.mjs";

export async function entrar(pagina, conta = PROFESSORA) {
  await pagina.goto("/login?force=1");
  await pagina.fill("#email", conta.email);
  await pagina.fill("#senha", conta.senha);
  await pagina.locator('button[type="submit"]').click();
  await pagina.waitForURL(/\/painel/);
}

export const tokenDe = (pagina) =>
  pagina.evaluate(() => localStorage.getItem("zooly_token"));

// Consulta direta à API, para confirmar o que o painel gravou de verdade.
export async function api(token, rota, opcoes = {}) {
  const resposta = await fetch(`${URL_API}${rota}`, {
    ...opcoes,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opcoes.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  return { status: resposta.status, corpo: await resposta.json() };
}

/** Coleta erros de console da página (exceto os provocados de propósito pelos cenários). */
export function vigiarConsole(pagina) {
  const erros = [];
  pagina.on("console", (mensagem) => {
    if (
      mensagem.type() === "error" &&
      !/401|403|404|409|500|Failed to load resource/.test(mensagem.text())
    )
      erros.push(mensagem.text());
  });
  pagina.on("pageerror", (erro) => erros.push(erro.message));
  return {
    verificar() {
      expect(erros, "erros de console").toEqual([]);
    },
  };
}

export const cartao = (pagina, titulo) =>
  pagina.getByRole("article", { name: titulo, exact: true });

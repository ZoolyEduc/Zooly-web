import { clearSession } from "./session";

// O painel usa somente a Zooly API: não há dados de demonstração nem respostas simuladas.
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:4000")
).replace(/\/$/, "");
const ERRO_API_NAO_CONFIGURADA =
  "A URL da API não foi configurada nesta publicação (NEXT_PUBLIC_API_URL).";

function encerrarSessaoExpirada(path) {
  if (typeof window === "undefined" || path.startsWith("/api/auth/")) return;
  const areaAdmin = window.location.pathname.startsWith("/admin");
  clearSession();
  window.location.replace(
    `${areaAdmin ? "/admin/login" : "/login"}?sessao=expirada`,
  );
}

export async function apiRequest(path, options = {}) {
  if (!API_BASE_URL) throw new Error(ERRO_API_NAO_CONFIGURADA);
  const {
    body,
    headers: customHeaders = {},
    timeoutMs,
    ...rest
  } = options;
  const headers = new Headers(customHeaders);
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("zooly_token")
      : null;

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let requestBody = body;
  if (
    body !== undefined &&
    body !== null &&
    !(typeof FormData !== "undefined" && body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  // Timeout opcional: sem ele, uma API "dormindo" deixa a tela carregando sem fim.
  const controller =
    timeoutMs && typeof AbortController !== "undefined"
      ? new AbortController()
      : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      ...(controller ? { signal: controller.signal } : {}),
      headers,
      body: requestBody,
    });
  } catch (error) {
    if (controller?.signal.aborted) {
      const erro = new Error(
        `A API em ${API_BASE_URL} não respondeu em ${Math.round(timeoutMs / 1000)} segundos. Se o servidor estava inativo, aguarde alguns instantes e tente de novo.`,
      );
      erro.timeout = true;
      throw erro;
    }
    throw new Error(
      `Não consegui conectar à API em ${API_BASE_URL}. Confira se o backend está rodando e se a URL está correta.`,
      { cause: error },
    );
  } finally {
    if (timer) clearTimeout(timer);
  }

  if (response.status === 204) return null;

  const raw = await response.text();
  let data = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { mensagem: raw };
    }
  }

  if (!response.ok) {
    if (response.status === 401) encerrarSessaoExpirada(path);
    const detalhes = Array.isArray(data?.detalhes)
      ? data.detalhes.join(" ")
      : "";
    const erro = new Error(
      detalhes ||
        data?.mensagem ||
        `A API respondeu com erro HTTP ${response.status}.`,
    );
    // Status e corpo ficam disponíveis para telas que mostram erros por campo.
    erro.status = response.status;
    erro.dados = data;
    throw erro;
  }

  return data;
}

export async function downloadApiFile(path, fileName) {
  if (!API_BASE_URL) throw new Error(ERRO_API_NAO_CONFIGURADA);
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("zooly_token")
      : null;
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { headers });
  } catch {
    throw new Error(`Não consegui conectar à API em ${API_BASE_URL}.`);
  }

  if (!response.ok) {
    if (response.status === 401) encerrarSessaoExpirada(path);
    let message = `Falha ao baixar o arquivo (HTTP ${response.status}).`;
    try {
      const data = await response.json();
      if (data?.mensagem) message = data.mensagem;
    } catch {}
    throw new Error(message);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

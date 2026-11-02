import { demoEnabled, demoResponse } from "./demo";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
  if (demoEnabled()) return demoResponse(path, options);
  const { body, headers: customHeaders = {}, ...rest } = options;
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

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers,
      body: requestBody,
    });
  } catch {
    throw new Error(
      `Não consegui conectar à API em ${API_BASE_URL}. Confira se o backend está rodando e se a URL está correta.`,
    );
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
    if (response.status === 401 && typeof window !== "undefined") {
      // Mantemos a mensagem visível na tela; cada página decide quando redirecionar.
    }
    throw new Error(
      data?.mensagem || `A API respondeu com erro HTTP ${response.status}.`,
    );
  }

  return data;
}

export async function downloadApiFile(path, fileName) {
  if (demoEnabled()) {
    window.print();
    return;
  }
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

export function makeObjectId() {
  return Array.from({ length: 24 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
}

import { demoEnabled } from "./demo";

export function saveSession({ token, usuario }) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem("zooly_token", token || "");
  window.localStorage.setItem("zooly_usuario", JSON.stringify(usuario || {}));
}

export function getSession() {
  if (demoEnabled()) {
    return {
      token: "demo-token-local",
      usuario: {
        nome: "Helena Ferreira",
        email: "helena.ferreira@zooly.edu.br",
        tipo: "professor",
      },
    };
  }

  if (typeof window === "undefined") {
    return { token: null, usuario: null };
  }

  let usuario = null;

  try {
    usuario = JSON.parse(
      window.localStorage.getItem("zooly_usuario") || "null",
    );
  } catch {
    usuario = null;
  }

  return {
    token: window.localStorage.getItem("zooly_token"),
    usuario,
  };
}

export function clearSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem("zooly_token");
  window.localStorage.removeItem("zooly_usuario");
}

export function getId(item) {
  return item?._id || item?.id || "";
}

export function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

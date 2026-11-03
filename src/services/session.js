export function saveSession({ token, usuario }) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem("zooly_token", token || "");
  window.localStorage.setItem("zooly_usuario", JSON.stringify(usuario || {}));
}

export function getSession() {
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

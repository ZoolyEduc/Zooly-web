// Endpoints do Banco de Histórias (Zooly-api, somente professores).
// O token, o 401 (sessão expirada) e as mensagens de erro ficam no apiRequest.
import { apiRequest } from "./api";

const base = (id) => `/api/historias/${encodeURIComponent(id)}`;

export const historiasApi = {
  listar: () => apiRequest("/api/historias?incluirArquivadas=true"),
  obter: (id) => apiRequest(base(id)),
  perguntas: (id) => apiRequest(`${base(id)}/perguntas`),
  modeloAtividade: (id) => apiRequest(`${base(id)}/modelo-atividade`),
  validar: (body) =>
    apiRequest("/api/historias/validar", { method: "POST", body }),
  criar: (body) => apiRequest("/api/historias", { method: "POST", body }),
  atualizar: (id, body) => apiRequest(base(id), { method: "PUT", body }),
  arquivar: (id) => apiRequest(`${base(id)}/arquivar`, { method: "PATCH" }),
  reativar: (id) => apiRequest(`${base(id)}/reativar`, { method: "PATCH" }),
  excluir: (id) => apiRequest(base(id), { method: "DELETE" }),
};

// Dados e portas da suíte E2E do painel. Tudo é fictício e vive só no MongoDB em memória.
export const PORTA_API = Number(process.env.E2E_PORTA_API || 4200);
export const PORTA_WEB = Number(process.env.E2E_PORTA_WEB || 3200);
export const URL_API = `http://localhost:${PORTA_API}`;
export const URL_WEB = `http://localhost:${PORTA_WEB}`;

export const PROFESSORA = {
  nome: "Professora E2E",
  email: "professora@e2e.example",
  senha: "senha-e2e-123",
};
export const OUTRO_PROFESSOR = {
  nome: "Professor B E2E",
  email: "outro@e2e.example",
  senha: "senha-e2e-456",
};
export const TURMA = { nome: "1º Ano E2E", codigo: "WEB-E2E-1A" };
export const HISTORIA_DO_OUTRO = "História particular do professor B";

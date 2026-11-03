/*
 * Sobe a Zooly API REAL (código de ../Zooly-api/src, sem alterações) sobre um MongoDB em
 * memória, com dados de teste próprios e as 6 histórias iniciais (seed real da API).
 * Nada é gravado no Atlas nem em bancos compartilhados: o banco some com o processo.
 *
 * Usado pelo Playwright (webServer em playwright.config.mjs). Variáveis:
 *   ZOOLY_API_DIR   pasta do Zooly-api (padrão: ../Zooly-api, ao lado deste repositório)
 *   E2E_PORTA_API   porta da API (padrão 4200)
 *   E2E_PORTA_WEB   porta do painel, liberada no CORS (padrão 3200)
 */
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import {
  HISTORIA_DO_OUTRO,
  OUTRO_PROFESSOR,
  PORTA_API,
  PROFESSORA,
  TURMA,
  URL_WEB,
} from "../dados.mjs";

const RAIZ_WEB = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const DIR_API = path.resolve(
  process.env.ZOOLY_API_DIR || path.join(RAIZ_WEB, "..", "Zooly-api"),
);

if (
  !existsSync(path.join(DIR_API, "src", "app.js")) ||
  !existsSync(path.join(DIR_API, "node_modules"))
) {
  console.error(
    `Zooly-api não encontrado ou sem dependências em "${DIR_API}". ` +
      'Clone o Zooly-api ao lado deste repositório, rode "npm install" nele ou defina ZOOLY_API_DIR.',
  );
  process.exit(1);
}

// Transações (moedas, exclusão de atividades) exigem replica set.
const replSet = await MongoMemoryReplSet.create({
  replSet: { count: 1, storageEngine: "wiredTiger" },
});
process.env.MONGODB_URI = replSet.getUri();
process.env.MONGODB_DB_NAME = "zooly_web_e2e";
process.env.JWT_SECRET = "segredo-somente-teste-e2e-web";
process.env.JWT_EXPIRES_IN = "2h";
process.env.CORS_ORIGINS = `${URL_WEB},http://127.0.0.1:${new URL(URL_WEB).port}`;
delete process.env.ZOOLY_AMBIENTE;

const importarDaApi = (relativo) =>
  import(pathToFileURL(path.join(DIR_API, relativo)).href);
const exigirDaApi = createRequire(path.join(DIR_API, "package.json"));
const bcrypt = exigirDaApi("bcryptjs");

const { default: app } = await importarDaApi("src/app.js");
const { connectDatabase } = await importarDaApi("src/config/database.js");
await connectDatabase();

const modelos = {};
for (const nome of ["Escola", "Professor", "Turma", "Aluno", "Historia"]) {
  modelos[nome] = (await importarDaApi(`src/models/${nome}.js`)).default;
  await modelos[nome].init();
}
const { Escola, Professor, Turma, Aluno, Historia } = modelos;

const escola = await Escola.create({
  nome: "Escola E2E Web",
  codigoPermanente: "WEB-E2E-ESCOLA",
  municipio: "Registro",
  endereco: "Rua Teste, 1",
  email: "escola@e2e.example",
  contato: "(00) 0000-0000",
});
const [professora, outro] = await Professor.create([
  {
    nome: PROFESSORA.nome,
    email: PROFESSORA.email,
    senha: await bcrypt.hash(PROFESSORA.senha, 4),
    escolas: [escola._id],
  },
  {
    nome: OUTRO_PROFESSOR.nome,
    email: OUTRO_PROFESSOR.email,
    senha: await bcrypt.hash(OUTRO_PROFESSOR.senha, 4),
    escolas: [escola._id],
  },
]);
const turma = await Turma.create({
  nome: TURMA.nome,
  codigoPermanente: TURMA.codigo,
  periodo: "Manhã",
  mascote: "sarue",
  anoEscolar: new Date().getFullYear(),
  escola: escola._id,
  professorResponsavel: professora._id,
  senhaAcessoHash: await bcrypt.hash("senha-turma-e2e", 4),
});
await Aluno.create({
  ra: "WEB-E2E-0001",
  nomeCompleto: "Aluno Teste",
  turma: turma._id,
});

// As 6 histórias iniciais, pelo mesmo seed que a equipe usa (idempotente).
const { semearHistoriasIniciais } = await importarDaApi(
  "src/services/seedHistorias.js",
);
const seed = await semearHistoriasIniciais({ aplicar: true });
if (seed.criadas.length !== 6) {
  console.error("Seed das histórias iniciais falhou:", seed);
  process.exit(1);
}
// Uma história particular de outro professor: nunca pode aparecer para a professora.
await Historia.create({
  titulo: HISTORIA_DO_OUTRO,
  conteudo: "Texto que só o professor B pode ver.",
  origem: "professor",
  professor: outro._id,
});

const servidor = app.listen(PORTA_API, () => {
  console.log(`API de teste pronta em http://localhost:${PORTA_API}`);
});

async function encerrar() {
  servidor.close();
  await replSet.stop();
  process.exit(0);
}
process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);

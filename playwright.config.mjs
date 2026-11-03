// Testes de ponta a ponta do painel (tests/e2e). Ver README, seção "Testes".
// Sobe a Zooly API real (código do ../Zooly-api) com MongoDB em memória e o painel em
// modo dev. As variáveis do antigo modo demo são passadas de propósito, para provar que
// o painel as ignora e usa somente a API.
import { defineConfig, devices } from "@playwright/test";
import { PORTA_API, PORTA_WEB, URL_API, URL_WEB } from "./tests/e2e/dados.mjs";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.mjs",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: URL_WEB,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: [
    {
      command: "node tests/e2e/servidor/api-local.mjs",
      url: `${URL_API}/api/health`,
      timeout: 180_000,
      reuseExistingServer: false,
      env: {
        E2E_PORTA_API: String(PORTA_API),
        E2E_PORTA_WEB: String(PORTA_WEB),
      },
    },
    {
      command: `npx next dev -p ${PORTA_WEB}`,
      url: URL_WEB,
      timeout: 180_000,
      reuseExistingServer: false,
      env: {
        NEXT_PUBLIC_API_URL: URL_API,
        NEXT_PUBLIC_MODO_DEMO: "true",
        NEXT_PUBLIC_AMBIENTE: "demonstracao",
      },
    },
  ],
});

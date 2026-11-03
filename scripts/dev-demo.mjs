import { spawn } from "node:child_process";

try {
  process.loadEnvFile(".env.demo");
} catch {
  console.error(
    "Arquivo .env.demo não encontrado. Copie de .env.demo.example.",
  );
  process.exit(1);
}

const next = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev"],
  { stdio: "inherit", env: process.env },
);
next.on("exit", (codigo) => process.exit(codigo ?? 0));

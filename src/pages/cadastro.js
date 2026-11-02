import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/auth.module.css";
import Logo from "../components/Logo";
import { apiRequest } from "../services/api";

export default function Cadastro() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    codigoPermanente: "",
    senha: "",
    confirmarSenha: "",
  });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  function atualizar(event) {
    setForm((atual) => ({ ...atual, [event.target.name]: event.target.value }));
  }

  async function cadastrar(event) {
    event.preventDefault();
    setErro("");
    if (form.senha !== form.confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }
    if (form.senha.length < 8) {
      setErro("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    setCarregando(true);
    try {
      await apiRequest("/api/professores", {
        method: "POST",
        body: {
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          codigoPermanente: form.codigoPermanente,
        },
      });
      await router.push("/login?cadastro=sucesso");
    } catch (error) {
      setErro(error.message || "Não foi possível concluir o cadastro.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <Head>
        <title>Criar conta | Zooly Education</title>
      </Head>
      <div className={`${styles.page} ${styles.registerPage}`}>
        <header className={styles.top}>
          <div className={styles.logoWrapper}>
            <Logo size="md" href="/" />
          </div>
          <nav className={styles.topLinks}>
            <Link href="/">Página inicial</Link>
            <Link href="/login">Entrar</Link>
          </nav>
        </header>
        <main className={styles.card}>
          <h1>Crie sua conta</h1>
          <p className={styles.subtitle}>
            Cadastre-se como professor para começar a organizar as atividades do
            Zooly.
          </p>
          {erro ? (
            <div className={styles.error} role="alert">
              {erro}
            </div>
          ) : null}
          <form className={styles.form} onSubmit={cadastrar}>
            <div className={styles.field}>
              <label htmlFor="nome">Nome completo</label>
              <input
                id="nome"
                name="nome"
                value={form.nome}
                onChange={atualizar}
                autoComplete="name"
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={atualizar}
                autoComplete="email"
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="codigoPermanente">
                Código permanente da escola
              </label>
              <input
                id="codigoPermanente"
                name="codigoPermanente"
                value={form.codigoPermanente}
                onChange={atualizar}
                required
              />
              <p className={styles.helper}>
                Use o código fornecido pela administração da escola. Ele é
                diferente do nome da escola.
              </p>
            </div>
            <div className={styles.field}>
              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                name="senha"
                type="password"
                value={form.senha}
                onChange={atualizar}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="confirmarSenha">Confirmar senha</label>
              <input
                id="confirmarSenha"
                name="confirmarSenha"
                type="password"
                value={form.confirmarSenha}
                onChange={atualizar}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <button
              className={styles.primary}
              type="submit"
              disabled={carregando}
            >
              {carregando ? "Cadastrando..." : "Criar conta"}
            </button>
          </form>
          <p className={styles.bottomText}>
            Já tem uma conta? <Link href="/login">Entrar</Link>
          </p>
        </main>
      </div>
    </>
  );
}
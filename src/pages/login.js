import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/auth.module.css";
import Notice from "../components/Notice";
import Logo from "../components/Logo";
import { apiRequest } from "../services/api";
import { getSession, saveSession } from "../services/session";
import { demoEnabled } from "../services/demo";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const cadastroOk = router.query.cadastro === "sucesso";

  useEffect(() => {
    if (!demoEnabled() && getSession().token && router.query.force !== "1")
      router.replace("/painel");
  }, [router]);

  async function entrar(event) {
    event.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const resposta = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email, senha },
      });
      saveSession(resposta);
      await router.push("/painel");
    } catch (error) {
      setErro(error.message || "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <Head>
        <title>Entrar | Zooly Education</title>
      </Head>
      <div className={styles.page}>
        <header className={styles.top}>
          <div className={styles.logoWrapper}>
            <Logo size="md" href="/" />
          </div>
          <nav className={styles.topLinks}>
            <Link href="/login">Entrar</Link>
            <Link href="/cadastro" className={styles.topAction}>
              Criar Conta
            </Link>
          </nav>
        </header>
        <main className={styles.card}>
          <h1>Que bom ter você de volta!</h1>
          <p className={styles.subtitle}>
            Entre na área do professor para organizar suas turmas e acompanhar
            as atividades.
          </p>
          {cadastroOk ? (
            <Notice kind="success">
              Cadastro enviado! Entre com o e-mail e a senha que você cadastrou.
            </Notice>
          ) : null}
          {erro ? (
            <div className={styles.error} role="alert">
              {erro}
            </div>
          ) : null}
          <form className={styles.form} onSubmit={entrar}>
            <div className={styles.field}>
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nome@escola.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.showPassword}
                onClick={() => setMostrarSenha((v) => !v)}
              >
                {mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              </button>
            </div>
            <button
              className={styles.primary}
              type="submit"
              disabled={carregando}
            >
              {carregando ? "Entrando..." : "Entrar no Zooly"}
            </button>
          </form>
          <p className={styles.bottomText}>
            Ainda não tem uma conta? <Link href="/cadastro">Cadastre-se</Link>
          </p>
        </main>
      </div>
    </>
  );
}
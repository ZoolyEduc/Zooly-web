import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import Logo from "../../components/Logo";
import Notice from "../../components/Notice";
import { apiRequest } from "../../services/api";
import { clearSession, getSession, saveSession } from "../../services/session";
import styles from "../../styles/auth.module.css";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);

  // A sessão só existe no navegador; lê-la no render causaria erro de hidratação.
  useEffect(() => {
    let ativo = true;
    Promise.resolve().then(() => {
      if (!ativo) return;
      const atual = getSession();
      if (atual.token && atual.usuario?.tipo === "administrador") {
        router.replace("/admin");
        return;
      }
      setSession(atual);
    });
    return () => {
      ativo = false;
    };
  }, [router]);

  async function entrar(event) {
    event.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const resposta = await apiRequest("/api/auth/admin/login", {
        method: "POST",
        body: { email, senha },
      });
      if (resposta?.usuario?.tipo !== "administrador" || !resposta?.token)
        throw new Error("A API não confirmou uma sessão administrativa.");
      saveSession(resposta);
      await router.replace("/admin");
    } catch (error) {
      setErro(error.message || "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Acesso administrativo | Zooly</title>
      </Head>
      <div className={styles.page}>
        <header className={styles.top}>
          <div className={styles.logoWrapper}>
            <Logo size="md" href="/" />
          </div>
          <nav className={styles.topLinks}>
            <Link href="/login">Área do professor</Link>
          </nav>
        </header>
        <main className={styles.card}>
          <h1>Acesso administrativo</h1>
          <p className={styles.subtitle}>
            Entre com as credenciais administrativas configuradas no servidor
            Zooly.
          </p>
          {router.query.sessao === "expirada" ? (
            <Notice kind="info">Sua sessão expirou. Entre novamente.</Notice>
          ) : null}
          {session?.usuario?.tipo === "professor" ? (
            <div className={styles.error} role="status">
              Sua sessão atual pertence à área do professor.{" "}
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  router.reload();
                }}
              >
                Encerrar sessão
              </button>
            </div>
          ) : null}
          {erro ? (
            <div className={styles.error} role="alert">
              {erro}
            </div>
          ) : null}
          <form className={styles.form} onSubmit={entrar}>
            <div className={styles.field}>
              <label htmlFor="admin-email">E-mail administrativo</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="admin-senha">Senha</label>
              <input
                id="admin-senha"
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                required
              />
            </div>
            <button
              className={styles.primary}
              type="submit"
              disabled={loading || session?.usuario?.tipo === "professor"}
            >
              {loading ? "Verificando..." : "Entrar no painel"}
            </button>
          </form>
        </main>
      </div>
    </>
  );
}

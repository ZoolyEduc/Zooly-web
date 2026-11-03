import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CircleAlert,
  GraduationCap,
  School,
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest } from "../../services/api";
import styles from "./admin.module.css";

export default function AdminDashboard() {
  const [state, setState] = useState({
    loading: true,
    error: "",
    schools: null,
    teachers: null,
  });
  useEffect(() => {
    let active = true;
    Promise.allSettled([
      apiRequest("/api/escolas"),
      apiRequest("/api/admin/professores"),
    ]).then(([schools, teachers]) => {
      if (!active) return;
      const falha = [schools, teachers].find(
        (item) => item.status === "rejected",
      );
      setState({
        loading: false,
        error: falha ? falha.reason.message : "",
        schools:
          schools.status === "fulfilled" &&
          Array.isArray(schools.value?.escolas)
            ? schools.value.escolas.length
            : null,
        teachers:
          teachers.status === "fulfilled" &&
          Array.isArray(teachers.value?.professores)
            ? teachers.value.professores.length
            : null,
      });
    });
    return () => {
      active = false;
    };
  }, []);

  const legenda = state.loading
    ? "Carregando dados da API"
    : "Total retornado pela API";

  return (
    <>
      <Head>
        <title>Administração | Zooly</title>
      </Head>
      <AdminLayout
        title="Visão geral"
        subtitle="Acompanhe os dados administrativos disponíveis para sua conta."
      >
        {state.error ? (
          <div className={styles.error} role="alert">
            <CircleAlert size={18} />
            {state.error}
          </div>
        ) : null}
        <section
          className={styles.stats}
          aria-label="Indicadores administrativos"
        >
          <article className={styles.stat}>
            <span className={styles.statIcon}>
              <School size={20} />
            </span>
            <span className={styles.statLabel}>Escolas cadastradas</span>
            <strong>{state.schools ?? "—"}</strong>
            <small>{legenda}</small>
          </article>
          <article className={styles.stat}>
            <span className={styles.statIcon}>
              <GraduationCap size={20} />
            </span>
            <span className={styles.statLabel}>Professores cadastrados</span>
            <strong>{state.teachers ?? "—"}</strong>
            <small>{legenda}</small>
          </article>
          <article className={`${styles.stat} ${styles.scope}`}>
            <span className={styles.statIcon}>
              <Building2 size={20} />
            </span>
            <span className={styles.statLabel}>Escopo atual</span>
            <strong>Plataforma</strong>
            <small>Visão global dos cadastros</small>
          </article>
        </section>
        <div className={styles.panels}>
          <section className={styles.panel}>
            <div>
              <h2>Gerenciamento de escolas</h2>
              <p>Consulte e mantenha os cadastros escolares da plataforma.</p>
            </div>
            <Link href="/admin/escolas" className={styles.action}>
              Abrir escolas <ArrowRight size={17} />
            </Link>
          </section>
          <section className={styles.panel}>
            <div>
              <h2>Gerenciamento de professores</h2>
              <p>
                Cadastre, edite e consulte as contas de acesso dos professores.
              </p>
            </div>
            <Link href="/admin/professores" className={styles.action}>
              Abrir professores <ArrowRight size={17} />
            </Link>
          </section>
        </div>
        <p className={styles.note}>
          Indicadores de alunos, turmas e utilização ainda não estão disponíveis
          por endpoints administrativos na API.
        </p>
      </AdminLayout>
    </>
  );
}

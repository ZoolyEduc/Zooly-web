import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  ClipboardList,
  GraduationCap,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import TeacherLayout from "../../components/TeacherLayout";
import StatCard from "../../components/StatCard";
import Notice from "../../components/Notice";
import { apiRequest } from "../../services/api";
import { getSession } from "../../services/session";
import { getId } from "../../utils/formatacao";
import styles from "./painel.module.css";

function dataLocalISO() {
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${hoje.getFullYear()}-${mes}-${dia}`;
}

export default function Painel() {
  const [dados, setDados] = useState({
    turmas: [],
    atividades: [],
    relatorios: [],
  });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [falhaCarga, setFalhaCarga] = useState(false);
  const [nomeProfessor, setNomeProfessor] = useState("");

  useEffect(() => {
    Promise.resolve().then(() => {
      setNomeProfessor(getSession().usuario?.nome || "");
    });
  }, []);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const [turmasResponse, atividadesResponse] = await Promise.all([
          apiRequest("/api/turmas"),
          apiRequest("/api/atividades/publicadas"),
        ]);
        const turmas = turmasResponse?.turmas || [];
        // Uma turma com falha não pode derrubar os indicadores das demais.
        const resultados = await Promise.allSettled(
          turmas.map((turma) =>
            apiRequest(
              `/api/desempenho/turmas/${getId(turma)}/semanal?data=${dataLocalISO()}`,
            ),
          ),
        );
        const relatorios = resultados
          .filter((resultado) => resultado.status === "fulfilled")
          .map((resultado) => resultado.value);
        if (ativo) {
          setDados({
            turmas,
            atividades: atividadesResponse?.atividades || [],
            relatorios,
          });
          if (relatorios.length < turmas.length) {
            setErro(
              "Não foi possível carregar o desempenho de todas as turmas. Os totais podem estar incompletos.",
            );
          }
        }
      } catch (error) {
        if (ativo) {
          setErro(error.message);
          setFalhaCarga(true);
        }
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  const alunos = dados.relatorios.flatMap((relatorio) =>
    (relatorio.alunos || []).map((item) => ({
      ...item,
      turmaNome: relatorio.turma?.nome || "Turma",
    })),
  );
  const totalIniciadas = dados.relatorios.reduce(
    (total, relatorio) =>
      total + (relatorio.indicadores?.atividadesIniciadas || 0),
    0,
  );
  const totalRespostas = dados.relatorios.reduce(
    (total, relatorio) =>
      total + (relatorio.indicadores?.respostasRegistradas || 0),
    0,
  );
  const totalAcertos = dados.relatorios.reduce(
    (total, relatorio) => total + (relatorio.indicadores?.acertos || 0),
    0,
  );
  const percentualAcerto = totalRespostas
    ? Math.round((totalAcertos / totalRespostas) * 100)
    : null;
  const semDados = loading || falhaCarga;

  return (
    <>
      <Head>
        <title>Home | Zooly</title>
      </Head>
      <TeacherLayout>
        <section className={styles.welcome}>
          <h2>Olá, {nomeProfessor || "professor(a)"}!</h2>
          <p>Aqui está um resumo das suas turmas e atividades.</p>
        </section>
        {erro ? <Notice kind="error">{erro}</Notice> : null}
        <section className={styles.stats} aria-label="Indicadores gerais">
          <StatCard
            label="TURMAS"
            value={semDados ? "—" : dados.turmas.length}
            icon={UsersRound}
          />
          <StatCard
            label="ALUNOS MATRICULADOS"
            value={semDados ? "—" : alunos.length}
            icon={GraduationCap}
          />
          <StatCard
            label="ATIVIDADES PUBLICADAS"
            value={semDados ? "—" : dados.atividades.length}
            icon={ClipboardList}
          />
          <StatCard
            label="ACERTO NA SEMANA"
            value={
              semDados || percentualAcerto == null
                ? "—"
                : `${percentualAcerto}%`
            }
            icon={TrendingUp}
          />
        </section>
        <section className={styles.history}>
          <div className={styles.historyHead}>
            <div>
              <h2>Desempenho semanal</h2>
              <p>
                {semDados
                  ? "Indicadores indisponíveis"
                  : `${totalIniciadas} atividades iniciadas · ${totalRespostas} respostas registradas`}
              </p>
            </div>
            <Link href="/desempenho">Ver Relatório Completo</Link>
          </div>
          {loading ? (
            <p className={styles.emptyState}>Carregando indicadores...</p>
          ) : alunos.length ? (
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Turma</th>
                    <th>Concluídas</th>
                    <th>Acerto na semana</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {alunos.slice(0, 5).map((item, index) => {
                    const aluno = item.aluno || {};
                    const percentual = item.indicadores?.percentualAcerto;
                    return (
                      <tr key={aluno.id || `${item.turmaNome}-${index}`}>
                        <td>
                          <div className={styles.student}>
                            <span className={styles.studentAvatar}>
                              {(aluno.nomeCompleto || "A")
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                            <strong>
                              {aluno.nomeCompleto ||
                                (aluno.ra ? `RA ${aluno.ra}` : "Aluno")}
                            </strong>
                          </div>
                        </td>
                        <td>{item.turmaNome}</td>
                        <td>{item.indicadores?.atividadesConcluidas ?? 0}</td>
                        <td>
                          <div className={styles.score}>
                            <span>
                              {percentual != null ? (
                                <i style={{ width: `${percentual}%` }} />
                              ) : null}
                            </span>
                            <strong
                              className={
                                percentual != null && percentual < 50
                                  ? styles.low
                                  : ""
                              }
                            >
                              {percentual == null
                                ? "Sem respostas"
                                : `${percentual}%`}
                            </strong>
                          </div>
                        </td>
                        <td>
                          <Link
                            className={styles.more}
                            href={`/desempenho/alunos/${aluno.id}`}
                            aria-label={`Ver desempenho de ${aluno.nomeCompleto || "aluno"}`}
                          >
                            Ver
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.emptyState}>
              {falhaCarga
                ? "Não foi possível carregar os indicadores."
                : dados.turmas.length
                  ? "Ainda não há alunos nas turmas vinculadas."
                  : "Nenhuma turma vinculada foi retornada pela API."}
            </p>
          )}
        </section>
      </TeacherLayout>
    </>
  );
}

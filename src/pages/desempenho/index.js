import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import TeacherLayout from "../../components/TeacherLayout";
import Notice from "../../components/Notice";
import { apiRequest, downloadApiFile } from "../../services/api";
import { getId, formatDate } from "../../utils/formatacao";
import styles from "./desempenho.module.css";

function dataLocalISO() {
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${hoje.getFullYear()}-${mes}-${dia}`;
}

export default function Desempenho() {
  const [turmas, setTurmas] = useState([]);
  const [turmaId, setTurmaId] = useState("");
  const [dataReferencia, setDataReferencia] = useState(dataLocalISO);
  const [relatorio, setRelatorio] = useState(null);
  const [loadingTurmas, setLoadingTurmas] = useState(true);
  const [buscandoRelatorio, setBuscandoRelatorio] = useState(false);
  const [erro, setErro] = useState("");
  const [baixando, setBaixando] = useState(false);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  useEffect(() => {
    let ativo = true;
    apiRequest("/api/turmas")
      .then((resposta) => {
        if (!ativo) return;
        const lista = resposta?.turmas || [];
        setTurmas(lista);
        if (lista.length > 0) {
          setTurmaId(getId(lista[0]));
        }
      })
      .catch((error) => {
        if (ativo) setErro(error.message);
      })
      .finally(() => {
        if (ativo) setLoadingTurmas(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!turmaId || !dataReferencia) return undefined;
    let ativo = true;
    const timer = window.setTimeout(() => {
      setBuscandoRelatorio(true);
      setErro("");
      setRelatorio(null);
      setMostrarTodos(false);
      apiRequest(
        `/api/desempenho/turmas/${turmaId}/semanal?data=${dataReferencia}`,
      )
        .then((resposta) => {
          if (ativo) setRelatorio(resposta);
        })
        .catch((error) => {
          if (ativo) setErro(error.message);
        })
        .finally(() => {
          if (ativo) setBuscandoRelatorio(false);
        });
    }, 300);

    return () => {
      ativo = false;
      window.clearTimeout(timer);
    };
  }, [turmaId, dataReferencia]);

  async function baixarPdf() {
    if (!turmaId) return;
    setErro("");
    setBaixando(true);
    try {
      await downloadApiFile(
        `/api/desempenho/turmas/${turmaId}/semanal/pdf?data=${dataReferencia}`,
        `relatorio-zooly-semanal-${dataReferencia}.pdf`,
      );
    } catch (error) {
      setErro(error.message);
    } finally {
      setBaixando(false);
    }
  }

  const indicadores = relatorio?.indicadores || {};
  const alunos = relatorio?.alunos || [];
  const dificuldades = alunos.filter(
    (item) =>
      item.indicadores?.percentualAcerto != null &&
      item.indicadores.percentualAcerto < 50,
  ).length;

  return (
    <>
      <Head>
        <title>Desempenho | Zooly</title>
      </Head>
      <TeacherLayout
        title="Desempenho Acadêmico"
        subtitle="Acompanhe o progresso fonético de cada turma de forma detalhada."
      >
        {erro ? <Notice kind="error">{erro}</Notice> : null}

        <div className={styles.controls}>
          <label>
            <span>Turma:</span>
            <select
              value={turmaId}
              onChange={(e) => setTurmaId(e.target.value)}
              disabled={loadingTurmas || turmas.length === 0}
            >
              {turmas.length === 0 && <option value="">Nenhuma turma</option>}
              {turmas.map((turma) => (
                <option key={getId(turma)} value={getId(turma)}>
                  {turma.nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Data de referência:</span>
            <input
              type="date"
              value={dataReferencia}
              onChange={(event) => setDataReferencia(event.target.value)}
              disabled={loadingTurmas}
              required
            />
          </label>
        </div>

        {loadingTurmas ? (
          <p className={styles.loading}>Carregando turmas...</p>
        ) : turmas.length === 0 ? (
          <div className={styles.empty}>
            Nenhuma turma está disponível para consultar desempenho.
          </div>
        ) : buscandoRelatorio ? (
          <p className={styles.loading}>Buscando dados da turma...</p>
        ) : relatorio ? (
          <>
            <div className={styles.metrics}>
              <article>
                <span className={`${styles.metricIcon} ${styles.green}`}>
                  ↗
                </span>
                <div>
                  <small>MÉDIA DA TURMA</small>
                  <strong>
                    {indicadores.percentualAcerto == null
                      ? "—"
                      : `${indicadores.percentualAcerto}%`}
                  </strong>
                </div>
              </article>
              <article>
                <span className={`${styles.metricIcon} ${styles.blue}`}>☑</span>
                <div>
                  <small>ATIVIDADES INICIADAS</small>
                  <strong>
                    {indicadores.atividadesIniciadas ?? 0}
                    <em> no período</em>
                  </strong>
                </div>
              </article>
              <article>
                <span className={`${styles.metricIcon} ${styles.red}`}>△</span>
                <div>
                  <small>DIFICULDADES</small>
                  <strong>
                    {String(dificuldades).padStart(2, "0")}
                    <em> alunos</em>
                  </strong>
                </div>
              </article>
            </div>

            <section className={styles.reportCard}>
              <div className={styles.reportTitle}>
                <h2>Lista de Alunos</h2>
                <span>{relatorio.turma?.nome || "Turma"}</span>
              </div>

              {alunos.length > 0 ? (
                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Aluno</th>
                        <th>Iniciadas</th>
                        <th>Concluídas</th>
                        <th>Respostas</th>
                        <th>Acerto</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(mostrarTodos ? alunos : alunos.slice(0, 4)).map(
                        (item, index) => {
                          const aluno = item.aluno || {};
                          const percent =
                            item.indicadores?.percentualAcerto ?? null;
                          return (
                            <tr key={aluno.id || aluno.ra || index}>
                              <td>
                                <div className={styles.student}>
                                  <span>
                                    {(aluno.nomeCompleto || "A")
                                      .split(" ")
                                      .map((name) => name[0])
                                      .slice(0, 2)
                                      .join("")}
                                  </span>
                                  <strong>
                                    {aluno.nomeCompleto ||
                                      (aluno.ra ? `RA ${aluno.ra}` : "Aluno")}
                                  </strong>
                                </div>
                              </td>
                              <td>
                                {item.indicadores?.atividadesIniciadas ?? 0}
                              </td>
                              <td>
                                {item.indicadores?.atividadesConcluidas ?? 0}
                              </td>
                              <td>
                                {item.indicadores?.respostasRegistradas ?? 0}
                              </td>
                              <td>
                                {percent == null
                                  ? "Sem respostas"
                                  : `${percent}%`}
                              </td>
                              <td>
                                <Link href={`/desempenho/alunos/${aluno.id}`}>
                                  Detalhes
                                </Link>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={styles.emptyTable}>
                  Nenhum aluno cadastrado nesta turma.
                </p>
              )}

              {alunos.length > 4 ? (
                <button
                  type="button"
                  className={styles.more}
                  onClick={() => setMostrarTodos((value) => !value)}
                >
                  {mostrarTodos ? "Mostrar menos" : "Carregar mais alunos"}⌄
                </button>
              ) : null}
            </section>

            <div className={styles.reportFooter}>
              <span>
                Semana de {formatDate(relatorio.periodo?.inicio)} a{" "}
                {formatDate(relatorio.periodo?.fim)} ({relatorio.periodo?.fuso})
                {relatorio.periodo?.disponivel
                  ? " · período encerrado"
                  : " · período em andamento"}
              </span>
              <button
                type="button"
                className={styles.primary}
                onClick={baixarPdf}
                disabled={baixando || buscandoRelatorio || !relatorio}
              >
                {baixando ? "Preparando PDF..." : "⇩ Gerar Relatório PDF"}
              </button>
            </div>
          </>
        ) : null}
      </TeacherLayout>
    </>
  );
}

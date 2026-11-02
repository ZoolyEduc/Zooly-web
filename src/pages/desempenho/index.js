import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import TeacherLayout from "../../components/TeacherLayout";
import Notice from "../../components/Notice";
import { apiRequest, downloadApiFile } from "../../services/api";
import { getId, formatDate } from "../../services/session";
import styles from "./desempenho.module.css";

const anoAtual = new Date().getFullYear();

// Função que calcula qual é o bimestre atual baseado no mês e dia
function obterBimestreAtual() {
  const hoje = new Date();
  const mes = hoje.getMonth() + 1; // 1 a 12
  const dia = hoje.getDate();

  // Datas do Calendário Escolar 2026 (baseado no PDF)
  if ((mes === 2 && dia >= 4) || mes === 3 || (mes === 4 && dia <= 22)) return "1";
  if ((mes === 4 && dia >= 23) || mes === 5 || mes === 6 || (mes === 7 && dia <= 6)) return "2";
  if ((mes === 7 && dia >= 24) || mes === 8 || mes === 9 || (mes === 10 && dia <= 2)) return "3";
  
  // Se não cair em nenhum dos anteriores (ex: férias de julho ou janeiro), 
  // assume o próximo ou o último. Para outubro (dia 31) cai no 4º.
  if (mes >= 10 || mes === 11 || mes === 12) return "4"; 
  
  return "1"; // Fallback (ex: janeiro)
}

// Define as datas exatas do calendário escolar para o Back-end/Exibição
function calcularPeriodoBimestre(bimestre, ano) {
  const periodos = {
    1: { inicio: `${ano}-02-04`, fim: `${ano}-04-22` },
    2: { inicio: `${ano}-04-23`, fim: `${ano}-07-06` },
    3: { inicio: `${ano}-07-24`, fim: `${ano}-10-02` },
    4: { inicio: `${ano}-10-05`, fim: `${ano}-12-18` },
  };
  return periodos[bimestre] || periodos[1];
}

export default function Desempenho() {
  const [turmas, setTurmas] = useState([]);
  const [turmaId, setTurmaId] = useState("");
  
  // Inicia com o bimestre atual detectado automaticamente
  const [bimestre, setBimestre] = useState(obterBimestreAtual()); 
  
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
    if (!turmaId || !bimestre) return undefined;
    
    let ativo = true;
    
    const timer = window.setTimeout(() => {
      setBuscandoRelatorio(true);
      setErro("");
      setMostrarTodos(false);

      // Instrução para quando o Back-end estiver pronto:
      // Substitua a chamada apiRequest atual por esta e remova a sobrescrita de periodo:
      // apiRequest(`/api/desempenho/turmas/${turmaId}/bimestral?ano=${anoAtual}&bimestre=${bimestre}`)
      //   .then((resposta) => { if (ativo) setRelatorio(resposta); })
      
      apiRequest(
        `/api/desempenho/turmas/${turmaId}/semanal?data=${anoAtual}-06-15` 
      )
        .then((resposta) => {
          if (!ativo) return;
          
          const periodoCalculado = calcularPeriodoBimestre(bimestre, anoAtual);
          
          setRelatorio({
            ...resposta,
            turma: resposta?.turma || turmas.find(t => getId(t) === turmaId),
            periodo: periodoCalculado,
          });
        })
        .catch((error) => {
          if (ativo) {
            const periodoCalculado = calcularPeriodoBimestre(bimestre, anoAtual);
            setRelatorio({
              turma: turmas.find(t => getId(t) === turmaId),
              periodo: periodoCalculado,
              indicadores: { percentualAcerto: 0, atividadesIniciadas: 0 },
              alunos: []
            });
            setErro(""); 
          }
        })
        .finally(() => {
          if (ativo) setBuscandoRelatorio(false);
        });
    }, 300);

    return () => {
      ativo = false;
      window.clearTimeout(timer);
    };
  }, [turmaId, bimestre, turmas]);

  async function baixarPdf() {
    if (!turmaId) return;
    setErro("");
    setBaixando(true);
    try {
      // Instrução para quando o Back-end estiver pronto:
      // Substitua a URL abaixo por: 
      // `/api/desempenho/turmas/${turmaId}/bimestral/pdf?ano=${anoAtual}&bimestre=${bimestre}`
      
      await downloadApiFile(
        `/api/desempenho/turmas/${turmaId}/semanal/pdf?data=${anoAtual}-06-15`,
        `relatorio-zooly-bim${bimestre}.pdf`
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
    (item) => (item.indicadores?.percentualAcerto ?? 80) < 50
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
            <span>Bimestre ({anoAtual}):</span>
            <select
              value={bimestre}
              onChange={(e) => setBimestre(e.target.value)}
              disabled={loadingTurmas}
            >
              <option value="1">1º Bimestre</option>
              <option value="2">2º Bimestre</option>
              <option value="3">3º Bimestre</option>
              <option value="4">4º Bimestre</option>
            </select>
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
                <span className={`${styles.metricIcon} ${styles.green}`}>↗</span>
                <div>
                  <small>MÉDIA DA TURMA</small>
                  <strong>{indicadores.percentualAcerto ?? 0}%</strong>
                </div>
              </article>
              <article>
                <span className={`${styles.metricIcon} ${styles.blue}`}>☑</span>
                <div>
                  <small>ATIVIDADES</small>
                  <strong>
                    {indicadores.atividadesIniciadas ?? 0}
                    <em> total</em>
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
                        <th>Nível de leitura</th>
                        <th>Progresso</th>
                        <th>Última atividade</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(mostrarTodos ? alunos : alunos.slice(0, 4)).map(
                        (item, index) => {
                          const aluno = item.aluno || {};
                          const percent = item.indicadores?.percentualAcerto ?? 0;
                          const nivel =
                            percent >= 85
                              ? "Avançado"
                              : percent < 50
                              ? "Em Alerta"
                              : "Intermediário";
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
                                  <strong>{aluno.nomeCompleto || "Aluno"}</strong>
                                </div>
                              </td>
                              <td>
                                <span
                                  className={`${styles.level} ${
                                    nivel === "Avançado"
                                      ? styles.levelAdvanced
                                      : nivel === "Em Alerta"
                                      ? styles.levelAlert
                                      : styles.levelMiddle
                                  }`}
                                >
                                  {nivel}
                                </span>
                              </td>
                              <td>
                                <div className={styles.progress}>
                                  <span>
                                    <i style={{ width: `${percent}%` }} />
                                  </span>
                                  <strong>{percent}%</strong>
                                </div>
                              </td>
                              <td>{item.ultimoAcesso || "Sem registro"}</td>
                              <td>
                                <Link href={`/turmas/${turmaId}/alunos`}>
                                  Ver Detalhes
                                </Link>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={styles.emptyTable}>
                  Nenhum dado cadastrado para esta turma neste bimestre.
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
                Período do {bimestre}º Bimestre: {formatDate(relatorio.periodo?.inicio)} a{" "}
                {formatDate(relatorio.periodo?.fim)}
              </span>
              <button
                type="button"
                className={styles.primary}
                onClick={baixarPdf}
                disabled={baixando || alunos.length === 0}
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
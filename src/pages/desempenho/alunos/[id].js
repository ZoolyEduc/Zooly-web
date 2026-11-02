import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import TeacherLayout from "../../../components/TeacherLayout";
import Notice from "../../../components/Notice";
import { apiRequest } from "../../../services/api";
import styles from "../desempenho.module.css";

export default function DesempenhoAluno() {
  const router = useRouter();
  const { id } = router.query;
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!router.isReady || !id) return undefined;
    let ativo = true;

    apiRequest(`/api/desempenho/alunos/${id}`)
      .then((resposta) => {
        if (ativo) setDados(resposta);
      })
      .catch((error) => {
        if (ativo) setErro(error.message);
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, [router.isReady, id]);

  const aluno = dados?.aluno || {};
  const indicadores = dados?.indicadores || {};
  const questoes = dados?.questoesComMaisErros || [];

  return (
    <>
      <Head>
        <title>Desempenho do aluno | Zooly</title>
      </Head>
      <TeacherLayout
        title={aluno.nomeCompleto || "Desempenho do aluno"}
        subtitle={
          dados?.turma?.nome
            ? `Turma ${dados.turma.nome} · indicadores acumulados`
            : "Acompanhamento individual acumulado"
        }
      >
        <div className={styles.controls}>
          <Link href="/desempenho">Voltar ao relatório semanal</Link>
        </div>
        {erro ? <Notice kind="error">{erro}</Notice> : null}
        {loading ? (
          <p className={styles.loading}>Carregando desempenho...</p>
        ) : !dados ? (
          <div className={styles.empty}>Não foi possível carregar o desempenho deste aluno.</div>
        ) : (
          <>
            <section className={styles.metrics} aria-label="Indicadores do aluno">
              <article>
                <div>
                  <small>ATIVIDADES INICIADAS</small>
                  <strong>{indicadores.atividadesIniciadas ?? 0}</strong>
                </div>
              </article>
              <article>
                <div>
                  <small>ATIVIDADES CONCLUÍDAS</small>
                  <strong>{indicadores.atividadesConcluidas ?? 0}</strong>
                </div>
              </article>
              <article>
                <div>
                  <small>PERCENTUAL DE ACERTO</small>
                  <strong>
                    {indicadores.percentualAcerto == null
                      ? "—"
                      : `${indicadores.percentualAcerto}%`}
                  </strong>
                </div>
              </article>
            </section>

            <section className={styles.reportCard}>
              <div className={styles.reportTitle}>
                <h2>Questões com mais erros</h2>
                {aluno.ra ? <span>RA {aluno.ra}</span> : null}
              </div>
              {questoes.length ? (
                <div className={styles.questionList}>
                  {questoes.map((questao) => (
                    <article className={styles.questionItem} key={questao.questaoId}>
                      <div>
                        <strong>{questao.enunciado || "Questão sem enunciado"}</strong>
                        <span>{questao.tituloAtividade || "Atividade"}</span>
                      </div>
                      <p>
                        {questao.erros} {questao.erros === 1 ? "erro" : "erros"} em{" "}
                        {questao.respostasRegistradas} respostas
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyTable}>
                  {indicadores.respostasRegistradas
                    ? "Não há questões com erros registrados."
                    : "Ainda não há respostas registradas."}
                </p>
              )}
            </section>
          </>
        )}
      </TeacherLayout>
    </>
  );
}
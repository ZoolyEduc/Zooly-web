import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import TeacherLayout from "../../components/TeacherLayout";
import Notice from "../../components/Notice";
import styles from "./atividades.module.css";

export default function DetalhesAtividade() {
  const router = useRouter();
  const { id } = router.query;

  const [atividade, setAtividade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!router.isReady || !id) return;

    let ativo = true;

    // Simulação de dados (futuramente substituir por apiRequest)
    Promise.resolve({
      titulo: "Descobrindo os sons",
      fonema: "/b/",
      status: "Em andamento",
      turmaNome: "1º Ano A",
      historia: "Era uma vez uma cobra muito curiosa que adorava ler...",
      questoes: [
        {
          enunciado: "Qual é a primeira letra da palavra 'Bola'?",
          alternativas: ["A", "B", "C", "D"],
        },
      ],
    })
      .then((resposta) => {
        if (ativo) {
          setAtividade(resposta);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (ativo) {
          setErro(err.message);
          setLoading(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [router.isReady, id]);

  return (
    <>
      <Head>
        <title>Detalhes da Atividade | Zooly</title>
      </Head>
      <TeacherLayout
        title="Detalhes da Atividade"
        subtitle="Visualize as informações e o progresso desta missão."
      >
        <div className={styles.back}>
          <Link href="/atividades">← Voltar para atividades</Link>
        </div>

        {erro ? <Notice kind="error">{erro}</Notice> : null}

        {loading ? (
          <p className={styles.loading}>Carregando dados da atividade...</p>
        ) : !atividade ? (
          <div className={styles.empty}>
            <h2>Atividade não encontrada</h2>
            <p>Não foi possível carregar os detalhes desta atividade.</p>
            <Link href="/atividades" className={styles.primary}>
              Voltar para a lista
            </Link>
          </div>
        ) : (
          <div className={styles.detailContainer}>
            {/* TÍTULO EM EVIDÊNCIA */}
            <div className={styles.detailHero}>
              <span className={styles.status}>{atividade.status}</span>
              <h1>{atividade.titulo}</h1>
              <p>
                Turma: <strong>{atividade.turmaNome}</strong> · Fonema:{" "}
                <strong>{atividade.fonema}</strong>
              </p>
            </div>

            {/* BLOCO BRANCO ÚNICO COM TODO O CONTEÚDO */}
            <div className={styles.detailMainBox}>
              {/* Seções de Missão e BNCC lado a lado */}
              <div className={styles.detailTopGrid}>
                <section>
                  <h2 className={styles.detailSectionTitle}>
                    ◎ Missão do Aluno
                  </h2>
                  <div className={styles.missionTags}>
                    <span>✓ Ler um texto</span>
                    <span>✓ Identificar sons</span>
                    <span>✓ Responder perguntas</span>
                  </div>
                </section>

                <section>
                  <h2 className={styles.detailSectionTitle}>▤ BNCC</h2>
                  <div className={`${styles.missionTags} ${styles.bnccTags}`}>
                    <span>EF01LP05</span>
                    <span>EF02LP26</span>
                  </div>
                </section>
              </div>

              {/* História */}
              <div className={styles.detailSection}>
                <h3 className={styles.detailSectionTitle}>
                  História da Atividade
                </h3>
                <div className={styles.detailHistory}>{atividade.historia}</div>
              </div>

              {/* Questões */}
              <div className={styles.detailSection}>
                <h3 className={styles.detailSectionTitle}>Questões</h3>
                {atividade.questoes.map((q, i) => (
                  <div key={i} className={styles.questionCard}>
                    <div className={styles.questionTitle}>
                      <strong>Questão {i + 1}</strong>
                    </div>
                    <p className={styles.questionEnunciado}>{q.enunciado}</p>
                    <div className={styles.alternatives}>
                      {q.alternativas.map((alt, j) => (
                        <div key={j} className={styles.alternative}>
                          <label>
                            <span>{String.fromCharCode(65 + j)}</span>
                          </label>
                          <div className={styles.alternativeText}>{alt}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botão Editar */}
              <div className={styles.detailFooter}>
                <button
                  className={styles.primary}
                  onClick={() => alert("Edição de atividade em breve!")}
                >
                  Editar Atividade
                </button>
              </div>
            </div>
          </div>
        )}
      </TeacherLayout>
    </>
  );
}
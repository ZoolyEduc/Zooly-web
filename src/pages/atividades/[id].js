import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import TeacherLayout from "../../components/TeacherLayout";
import Notice from "../../components/Notice";
import { apiRequest } from "../../services/api";
import { getId, formatDate } from "../../services/session";
import styles from "./atividades.module.css";

export default function DetalhesAtividade() {
  const router = useRouter();
  const { id } = router.query;

  const [atividade, setAtividade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    if (!router.isReady || !id) return;

    let ativo = true;
    async function carregar() {
      try {
        const [atividadesResponse, turmasResponse] = await Promise.all([
          apiRequest("/api/atividades/publicadas"),
          apiRequest("/api/turmas"),
        ]);
        const atividadeEncontrada = (atividadesResponse?.atividades || []).find(
          (item) => getId(item) === id,
        );
        if (!atividadeEncontrada) {
          if (ativo) setAtividade(null);
          return;
        }
        const turmaId =
          typeof atividadeEncontrada.turma === "object"
            ? getId(atividadeEncontrada.turma)
            : atividadeEncontrada.turma;
        const turma = (turmasResponse?.turmas || []).find(
          (item) => getId(item) === turmaId,
        );
        let historiaTexto = atividadeEncontrada.historia?.texto || "";
        if (
          atividadeEncontrada.historia?.tipo === "oficial" &&
          atividadeEncontrada.historia.historiaId
        ) {
          const historiaResponse = await apiRequest(
            `/api/historias/${atividadeEncontrada.historia.historiaId}`,
          );
          historiaTexto = historiaResponse?.historia?.conteudo || "";
        }
        if (ativo) {
          setAtividade({
            ...atividadeEncontrada,
            turmaNome: turma?.nome || atividadeEncontrada.turma?.nome || "—",
            historiaTexto,
          });
        }
      } catch (err) {
        if (ativo) {
          setErro(err.message);
        }
      } finally {
        if (ativo) setLoading(false);
      }
    }
    carregar();

    return () => {
      ativo = false;
    };
  }, [router.isReady, id]);

  async function excluir() {
    if (!window.confirm("Excluir esta atividade?")) return;
    setErro("");
    setExcluindo(true);
    try {
      await apiRequest(`/api/atividades/${id}`, { method: "DELETE" });
      await router.push("/atividades");
    } catch (error) {
      setErro(error.message);
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <>
      <Head>
        <title>Detalhes da Atividade | Zooly</title>
      </Head>
      <TeacherLayout
        title="Detalhes da Atividade"
        subtitle="Consulte os dados publicados desta atividade."
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
              <span className={styles.status}>Publicada</span>
              <h1>{atividade.titulo}</h1>
              <p>
                Turma: <strong>{atividade.turmaNome}</strong> · {atividade.questoes?.length ?? 0} questões · {atividade.recompensaMoedas ?? "—"} moedas
              </p>
            </div>

            {/* BLOCO BRANCO ÚNICO COM TODO O CONTEÚDO */}
            <div className={styles.detailMainBox}>
              <div className={styles.detailTopGrid}>
                <section>
                  <h2 className={styles.detailSectionTitle}>
                    Prazo
                  </h2>
                  <p>{atividade.prazo ? formatDate(atividade.prazo) : "Sem prazo definido"}</p>
                </section>

                <section>
                  <h2 className={styles.detailSectionTitle}>Publicação</h2>
                  <p>{formatDate(atividade.publicadoEm)}</p>
                </section>
              </div>

              {/* História */}
              <div className={styles.detailSection}>
                <h3 className={styles.detailSectionTitle}>
                  História da Atividade
                </h3>
                <div className={styles.detailHistory}>
                  {atividade.historiaTexto || "O texto desta história não está disponível."}
                </div>
              </div>

              {/* Questões */}
              <div className={styles.detailSection}>
                <h3 className={styles.detailSectionTitle}>Questões</h3>
                {(atividade.questoes || []).map((q, i) => (
                  <div key={i} className={styles.questionCard}>
                    <div className={styles.questionTitle}>
                      <strong>Questão {i + 1}</strong>
                    </div>
                    <p className={styles.questionEnunciado}>{q.enunciado}</p>
                    <div className={styles.alternatives}>
                      {(q.alternativas || []).map((alt, j) => (
                        <div key={j} className={styles.alternative}>
                          <label>
                            <span>{String.fromCharCode(65 + j)}</span>
                          </label>
                          <div className={styles.alternativeText}>{alt.texto}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.detailFooter}>
                <button
                  className={styles.secondary}
                  type="button"
                  disabled
                  title="A API não retorna o gabarito necessário para editar esta atividade com segurança."
                >
                  Edição indisponível
                </button>
                <button
                  className={styles.primary}
                  type="button"
                  onClick={excluir}
                  disabled={excluindo}
                >
                  {excluindo ? "Excluindo..." : "Excluir atividade"}
                </button>
              </div>
            </div>
          </div>
        )}
      </TeacherLayout>
    </>
  );
}
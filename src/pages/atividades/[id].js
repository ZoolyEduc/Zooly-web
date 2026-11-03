import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Pencil,
  ShieldAlert,
  Trash2,
  Trophy,
} from "lucide-react";
import TeacherLayout from "../../components/TeacherLayout";
import Notice from "../../components/Notice";
import { apiRequest } from "../../services/api";
import { formatDate, getId } from "../../utils/formatacao";
import styles from "./atividades.module.css";

const etapasMissao = {
  ler_texto: "Ler um texto",
  completar_palavras: "Completar palavras",
  escutar_escrever: "Escutar e escrever",
  identificar_sons: "Identificar sons",
  responder_perguntas: "Responder perguntas",
};

export default function DetalhesAtividade() {
  const router = useRouter();
  const atividadeId =
    typeof router.query.id === "string" ? router.query.id : "";
  const [atividade, setAtividade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [publicando, setPublicando] = useState(false);

  useEffect(() => {
    if (!router.isReady || !atividadeId) return undefined;
    let ativo = true;

    async function carregar() {
      try {
        const [atividadeResponse, turmasResponse] = await Promise.all([
          apiRequest(`/api/atividades/${encodeURIComponent(atividadeId)}`),
          apiRequest("/api/turmas"),
        ]);
        const atividadeCarregada = atividadeResponse?.atividade;
        if (!atividadeCarregada) {
          if (ativo) setAtividade(null);
          return;
        }
        const turmaId =
          typeof atividadeCarregada.turma === "object"
            ? getId(atividadeCarregada.turma)
            : atividadeCarregada.turma;
        const turma = (turmasResponse?.turmas || []).find(
          (item) => getId(item) === turmaId,
        );
        // A atividade guarda uma cópia da história (o que o aluno lê). Só atividades
        // antigas, sem cópia, consultam a história no Banco de Histórias.
        let historiaTexto =
          atividadeCarregada.historia?.texto ||
          atividadeCarregada.historia?.textoCopia ||
          "";
        if (
          !historiaTexto &&
          atividadeCarregada.historia?.tipo === "oficial" &&
          atividadeCarregada.historia.historiaId
        ) {
          const historiaResponse = await apiRequest(
            `/api/historias/${encodeURIComponent(atividadeCarregada.historia.historiaId)}`,
          );
          historiaTexto = historiaResponse?.historia?.conteudo || "";
        }
        if (ativo) {
          setAtividade({
            ...atividadeCarregada,
            turmaNome: turma?.nome || "Turma não informada",
            turmaAno: turma?.anoEscolar ?? null,
            historiaTexto,
          });
        }
      } catch (error) {
        if (ativo) setErro(error.message);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, [router.isReady, atividadeId]);

  async function excluir() {
    if (!window.confirm("Excluir esta atividade?")) return;
    setErro("");
    setExcluindo(true);
    try {
      await apiRequest(`/api/atividades/${encodeURIComponent(atividadeId)}`, {
        method: "DELETE",
      });
      await router.push("/atividades");
    } catch (error) {
      setErro(error.message);
    } finally {
      setExcluindo(false);
    }
  }

  async function publicar() {
    if (atividade?.status !== "rascunho") return;
    setErro("");
    setPublicando(true);
    try {
      await apiRequest(
        `/api/atividades/${encodeURIComponent(atividadeId)}/publicar`,
        { method: "PATCH" },
      );
      await router.push("/atividades");
    } catch (error) {
      setErro(error.message);
    } finally {
      setPublicando(false);
    }
  }

  const missaoSelecionada = (atividade?.missao?.etapas || [])
    .map((etapa) => etapasMissao[etapa])
    .filter(Boolean);

  return (
    <>
      <Head>
        <title>Atividade | Zooly</title>
      </Head>
      <TeacherLayout>
        <div className={styles.editorHeader}>
          <Link href="/atividades" aria-label="Voltar para atividades">
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
          <h1>Visualizar Atividade</h1>
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
          <div className={styles.activityForm}>
            <section className={`${styles.formPanel} ${styles.generalPanel}`}>
              <h2>
                <span className={styles.sectionIcon}>
                  <FileText size={17} aria-hidden="true" />
                </span>
                Informações Gerais
              </h2>
              <div className={styles.formGrid}>
                <label className={styles.fullField}>
                  Nome da atividade
                  <input value={atividade.titulo || ""} readOnly />
                </label>
                <label>
                  Série / Ano
                  <input
                    value={atividade.turmaAno ?? "Não informado"}
                    readOnly
                  />
                </label>
                <label>
                  Turma
                  <input value={atividade.turmaNome} readOnly />
                </label>
                <label>
                  <span className={styles.fieldLabel}>
                    <Clock3 size={14} aria-hidden="true" />
                    Duração estimada
                  </span>
                  <input value="Não disponível na API" readOnly disabled />
                </label>
                <label>
                  Prazo
                  <input
                    value={
                      atividade.prazo
                        ? formatDate(atividade.prazo)
                        : "Sem prazo definido"
                    }
                    readOnly
                  />
                </label>
              </div>
            </section>

            <section className={`${styles.formPanel} ${styles.storyPanel}`}>
              <h2>
                <span className={`${styles.sectionIcon} ${styles.storyIcon}`}>
                  <BookOpen size={17} aria-hidden="true" />
                </span>
                História da Atividade
              </h2>
              <div className={styles.detailHistory}>
                {atividade.historiaTexto ||
                  "O texto desta história não está disponível."}
              </div>
            </section>

            <section className={`${styles.formPanel} ${styles.questionsPanel}`}>
              <div className={styles.questionHeader}>
                <div>
                  <h2>Questões da Atividade</h2>
                  <p>{atividade.questoes?.length ?? 0} questões</p>
                </div>
              </div>
              {(atividade.questoes || []).map((questao, index) => (
                <article
                  className={styles.editorQuestionCard}
                  key={getId(questao) || index}
                >
                  <div className={styles.questionTitle}>
                    <span className={styles.questionNumber}>{index + 1}</span>
                    <div className={styles.questionMeta}>
                      <strong>Questão {index + 1}</strong>
                      <span>
                        {questao.tipo === "multipla_escolha"
                          ? "Múltipla escolha"
                          : "Tipo não informado"}
                        {" · "}
                        {questao.pontos ?? 0} pts
                      </span>
                    </div>
                  </div>
                  <p className={styles.questionEnunciado}>
                    {questao.enunciado}
                  </p>
                  <div className={styles.alternatives}>
                    {(questao.alternativas || []).map((alternativa, indice) => (
                      <div
                        className={styles.alternative}
                        key={getId(alternativa) || indice}
                      >
                        <span className={styles.alternativeLetter}>
                          {String.fromCharCode(65 + indice)}
                        </span>
                        <div className={styles.alternativeText}>
                          {alternativa.texto}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </section>

            <aside className={styles.editorAside}>
              <section className={styles.asideCard}>
                <h2>
                  <CheckCircle2 size={17} aria-hidden="true" />
                  Missão do Aluno
                </h2>
                {missaoSelecionada.length ? (
                  <div className={styles.missionTags}>
                    {missaoSelecionada.map((etapa) => (
                      <span key={etapa}>{etapa}</span>
                    ))}
                  </div>
                ) : (
                  <p className={styles.asideDescription}>
                    Nenhuma etapa selecionada.
                  </p>
                )}
              </section>
              <section className={styles.asideCard}>
                <h2>
                  <ShieldAlert size={17} aria-hidden="true" />
                  BNCC
                </h2>
                {atividade.habilidadesBncc?.length ? (
                  <ul
                    className={styles.bnccResults}
                    aria-label="Habilidades BNCC selecionadas"
                  >
                    {atividade.habilidadesBncc.map((habilidade) => (
                      <li key={habilidade.codigo}>
                        <div className={styles.bnccDetail}>
                          <strong>{habilidade.codigo}</strong>
                          <span>{habilidade.texto}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.asideDescription}>
                    Nenhuma habilidade selecionada.
                  </p>
                )}
              </section>
              <section className={`${styles.asideCard} ${styles.rewardCard}`}>
                <h2>
                  <Trophy size={17} aria-hidden="true" />
                  Recompensa
                </h2>
                <div className={styles.rewardTotal}>
                  <span>Pontuação total</span>
                  <strong>{atividade.pontuacaoTotal ?? 0} pts</strong>
                </div>
                <p className={styles.rewardCaption}>
                  {atividade.recompensaMoedas == null
                    ? "Recompensa em moedas não informada."
                    : `${atividade.recompensaMoedas} moedas`}
                </p>
                <p className={styles.asideDescription}>
                  {atividade.status === "rascunho"
                    ? "Rascunho"
                    : `Publicada em ${formatDate(atividade.publicadoEm)}`}
                </p>
              </section>
            </aside>

            <footer className={styles.formBottom}>
              <Link href="/atividades" className={styles.cancel}>
                Voltar
              </Link>
              <Link
                href={`/atividades/nova?id=${encodeURIComponent(atividadeId)}`}
                className={styles.secondary}
              >
                <Pencil size={15} aria-hidden="true" />
                Editar atividade
              </Link>
              {atividade.status === "rascunho" ? (
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={publicar}
                  disabled={publicando}
                >
                  {publicando ? "Publicando..." : "Publicar atividade"}
                </button>
              ) : null}
              <button
                className={styles.detailDelete}
                type="button"
                onClick={excluir}
                disabled={excluindo}
              >
                <Trash2 size={15} aria-hidden="true" />
                {excluindo ? "Excluindo..." : "Excluir atividade"}
              </button>
            </footer>
          </div>
        )}
      </TeacherLayout>
    </>
  );
}

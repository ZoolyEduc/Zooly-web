import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Plus,
  TreePine,
  Volume2,
} from "lucide-react";
import TeacherLayout from "../../components/TeacherLayout";
import Notice from "../../components/Notice";
import { apiRequest } from "../../services/api";
import { getId, formatDate } from "../../services/session";
import styles from "./atividades.module.css";

const iconColors = ["blue", "yellow", "sky", "coral"];
const activityIcons = [ClipboardList, TreePine, BookOpen, Volume2];

export default function Atividades() {
  const [atividades, setAtividades] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [historias, setHistorias] = useState([]);
  const [aba, setAba] = useState("atividades");
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingHistorias, setLoadingHistorias] = useState(true);
  const [erro, setErro] = useState("");
  const [erroHistorias, setErroHistorias] = useState("");

  useEffect(() => {
    let ativo = true;
    Promise.all([apiRequest("/api/atividades"), apiRequest("/api/turmas")])
      .then(([a, t]) => {
        if (ativo) {
          setAtividades(a?.atividades || []);
          setTurmas(t?.turmas || []);
        }
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
  }, []);

  useEffect(() => {
    let ativo = true;
    apiRequest("/api/historias")
      .then((resposta) => {
        if (ativo) setHistorias(resposta?.historias || []);
      })
      .catch((error) => {
        if (ativo) setErroHistorias(error.message);
      })
      .finally(() => {
        if (ativo) setLoadingHistorias(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      atividades.filter((atividade) => {
        const turmaId =
          typeof atividade.turma === "object"
            ? getId(atividade.turma)
            : atividade.turma;
        return !turmaSelecionada || turmaId === turmaSelecionada;
      }),
    [atividades, turmaSelecionada],
  );
  const nomesTurmas = Object.fromEntries(
    turmas.map((turma) => [getId(turma), turma.nome]),
  );

  return (
    <>
      <Head>
        <title>Atividades | Zooly</title>
      </Head>
      <TeacherLayout
        title="Atividades"
        subtitle="Gerencie as atividades e consulte a biblioteca de histórias."
      >
        {erro ? <Notice kind="error">{erro}</Notice> : null}
        <div
          className={styles.viewTabs}
          role="tablist"
          aria-label="Atividades e histórias"
        >
          <button
            type="button"
            role="tab"
            aria-selected={aba === "atividades"}
            className={aba === "atividades" ? styles.viewTabActive : ""}
            onClick={() => setAba("atividades")}
          >
            Minhas atividades
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={aba === "historias"}
            className={aba === "historias" ? styles.viewTabActive : ""}
            onClick={() => setAba("historias")}
          >
            Biblioteca de histórias
          </button>
        </div>
        {aba === "atividades" ? (
          <>
            <div className={styles.toolbar}>
              <div className={styles.filters}>
                <label htmlFor="activity-class-filter">Turma</label>
                <select
                  id="activity-class-filter"
                  value={turmaSelecionada}
                  onChange={(event) => setTurmaSelecionada(event.target.value)}
                  disabled={loading || turmas.length === 0}
                >
                  <option value="">Todas as turmas</option>
                  {turmas.map((turma) => (
                    <option key={getId(turma)} value={getId(turma)}>
                      {turma.nome}
                    </option>
                  ))}
                </select>
              </div>
              <Link href="/atividades/nova" className={styles.primary}>
                <Plus size={17} aria-hidden="true" />
                Nova Atividade
              </Link>
            </div>
            {loading ? (
              <p className={styles.loading}>Carregando atividades...</p>
            ) : filtered.length ? (
              <div className={styles.grid}>
                {filtered.map((atividade, index) => {
                  const turmaId =
                    typeof atividade.turma === "object"
                      ? getId(atividade.turma)
                      : atividade.turma;
                  const total = Number.isFinite(atividade.totalAlunos)
                    ? atividade.totalAlunos
                    : null;
                  const concluidas = Number.isFinite(atividade.concluidas)
                    ? atividade.concluidas
                    : null;
                  const ActivityIcon =
                    activityIcons[index % activityIcons.length];
                  const isDraft = atividade.status === "rascunho";
                  return (
                    <article
                      className={`${styles.card} ${isDraft ? styles.draftCard : ""}`}
                      key={getId(atividade) || index}
                    >
                      <div className={styles.cardTop}>
                        <span
                          className={`${styles.activityIcon} ${styles[iconColors[index % iconColors.length]]}`}
                        >
                          <ActivityIcon size={21} aria-hidden="true" />
                        </span>
                        <span
                          className={`${styles.status} ${isDraft ? styles.draftStatus : ""}`}
                        >
                          {isDraft ? "Rascunho" : "Publicada"}
                        </span>
                      </div>
                      <h2>{atividade.titulo || "Atividade sem título"}</h2>
                      <p className={styles.className}>
                        {nomesTurmas[turmaId] ||
                          atividade.turma?.nome ||
                          "Turma não informada"}
                      </p>
                      <p className={styles.phoneme}>
                        {atividade.questoes?.length ?? 0} questões ·{" "}
                        {atividade.pontuacaoTotal == null
                          ? "Pontuação indisponível"
                          : `${atividade.pontuacaoTotal} pts`}
                      </p>
                      <div className={styles.cardBottom}>
                        <small>
                          {total != null && concluidas != null
                            ? `${concluidas}/${total} alunos concluíram`
                            : atividade.prazo
                              ? `Prazo: ${formatDate(atividade.prazo)}`
                              : "Sem prazo definido"}
                        </small>
                        {isDraft ? (
                          <>
                            <Link
                              href={`/atividades/${encodeURIComponent(getId(atividade))}`}
                            >
                              Abrir
                              <ArrowRight size={14} aria-hidden="true" />
                            </Link>
                            <Link
                              href={`/atividades/nova?id=${encodeURIComponent(getId(atividade))}`}
                            >
                              Editar
                              <ArrowRight size={14} aria-hidden="true" />
                            </Link>
                          </>
                        ) : (
                          <Link href={`/atividades/${getId(atividade)}`}>
                            Visualizar
                            <ArrowRight size={14} aria-hidden="true" />
                          </Link>
                        )}
                      </div>
                      {atividade.publicadoEm ? (
                        <div className={styles.meta}>
                          Publicada em {formatDate(atividade.publicadoEm)}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className={styles.empty}>
                <Image
                  src="/img/lagarto-vetor.png"
                  alt="Mascote Lagarto"
                  width={180}
                  height={180}
                />
                <h2>Nenhuma atividade encontrada</h2>
                <p>
                  Crie uma atividade para esta turma ou selecione outra turma.
                </p>
                <Link href="/atividades/nova" className={styles.primary}>
                  Criar atividade
                </Link>
              </div>
            )}
          </>
        ) : (
          <section className={styles.storyLibrary}>
            {erroHistorias ? (
              <Notice kind="error">{erroHistorias}</Notice>
            ) : null}
            {loadingHistorias ? (
              <p className={styles.loading}>Carregando histórias...</p>
            ) : historias.length ? (
              <div className={styles.storyGrid}>
                {historias.map((historia) => (
                  <article className={styles.story} key={getId(historia)}>
                    <div className={styles.storyCover} aria-hidden="true">
                      <BookOpen size={27} />
                    </div>
                    <h2>{historia.titulo}</h2>
                    <details className={styles.storyDetails}>
                      <summary>Ver história completa</summary>
                      <p>{historia.conteudo}</p>
                    </details>
                    <Link
                      href={`/atividades/nova?historiaId=${encodeURIComponent(getId(historia))}`}
                    >
                      Criar atividade com esta história
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <h2>Nenhuma história disponível</h2>
                <p>A biblioteca não retornou histórias para esta conta.</p>
              </div>
            )}
          </section>
        )}
      </TeacherLayout>
    </>
  );
}

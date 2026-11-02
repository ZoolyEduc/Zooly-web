import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import TeacherLayout from "../../components/TeacherLayout";
import Notice from "../../components/Notice";
import { apiRequest } from "../../services/api";
import { getId, formatDate } from "../../services/session";
import styles from "./atividades.module.css";

const filtros = ["1º ANO", "2º ANO", "3º ANO"];
const iconColors = ["blue", "yellow", "sky", "coral"];

export default function Atividades() {
  const [atividades, setAtividades] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [ano, setAno] = useState("1º ANO");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    Promise.all([
      apiRequest("/api/atividades/publicadas"),
      apiRequest("/api/turmas"),
    ])
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

  const filtered = useMemo(
    () =>
      atividades.filter((atividade) => {
        const turmaId =
          typeof atividade.turma === "object"
            ? getId(atividade.turma)
            : atividade.turma;
        const turma = turmas.find((item) => getId(item) === turmaId);
        return turma && `${turma.anoEscolar}º ANO` === ano;
      }),
    [atividades, turmas, ano],
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
        subtitle="Gerencie as missões e acompanhe o progresso das suas turmas."
      >
        {erro ? <Notice kind="error">{erro}</Notice> : null}
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            {filtros.map((item) => (
              <button
                type="button"
                key={item}
                aria-pressed={ano === item}
                className={ano === item ? styles.filterActive : ""}
                onClick={() => setAno(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <Link href="/atividades/nova" className={styles.primary}>
            ＋ Nova Atividade
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
              const total = atividade.totalAlunos || 32;
              const concluidas = atividade.concluidas || 0;
              const progresso = total
                ? Math.round((concluidas / total) * 100)
                : 0;
              return (
                <article
                  className={styles.card}
                  key={getId(atividade) || index}
                >
                  <div className={styles.cardTop}>
                    <span
                      className={`${styles.activityIcon} ${styles[iconColors[index % iconColors.length]]}`}
                    >
                      {["♣", "♟", "▣", "◖"][index % 4]}
                    </span>
                    <span
                      className={
                        atividade.status === "Agendada"
                          ? styles.scheduled
                          : styles.status
                      }
                    >
                      {atividade.status || "Em andamento"}
                    </span>
                  </div>
                  <h2>{atividade.titulo || "Atividade sem título"}</h2>
                  <p className={styles.className}>
                    {nomesTurmas[turmaId] ||
                      atividade.turma?.nome ||
                      "Turma vinculada"}
                  </p>
                  <p className={styles.phoneme}>
                    Fonema: <strong>{atividade.fonema || "/b/"}</strong>
                  </p>
                  <div className={styles.progress}>
                    <span>
                      <i style={{ width: `${progresso}%` }} />
                    </span>
                  </div>
                  <div className={styles.cardBottom}>
                    <small>
                      {atividade.status === "Agendada"
                        ? "Inicia em 2 dias"
                        : `${concluidas}/${total} Alunos`}
                    </small>
                    <Link href={`/atividades/${getId(atividade)}`}>Visualizar →</Link>
                  </div>
                  <div className={styles.meta}>
                    Missão{" "}
                    {String(atividade.ordem || index + 1).padStart(2, "0")} ·{" "}
                    {atividade.recompensaMoedas || 10} moedas ·{" "}
                    {formatDate(atividade.publicadoEm)}
                  </div>
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
            <h2>Nenhuma atividade para esta turma</h2>
            <p>
              Crie uma missão educativa para começar a acompanhar o progresso
              dos alunos.
            </p>
            <Link href="/atividades/nova" className={styles.primary}>
              Criar atividade
            </Link>
          </div>
        )}
      </TeacherLayout>
    </>
  );
}

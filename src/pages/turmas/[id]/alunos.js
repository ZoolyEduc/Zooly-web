import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import TeacherLayout from "../../../components/TeacherLayout";
import Notice from "../../../components/Notice";
import { apiRequest } from "../../../services/api";
import { demoEnabled } from "../../../services/demo";
import { getId, formatDate } from "../../../services/session";
import styles from "./alunos.module.css";

const vazio = {
  nomeCompleto: "",
  idade: "",
  ra: "",
  responsavel: "",
  email: "",
};

export default function AlunosDaTurma() {
  const router = useRouter();
  const turmaId = router.query.id;
  const [turma, setTurma] = useState(null);
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(vazio);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);

  const carregar = useCallback(async () => {
    if (!turmaId) return;
    try {
      const [turmaResposta, alunosResposta] = await Promise.all([
        apiRequest(`/api/turmas/${turmaId}`),
        apiRequest(`/api/alunos/turma/${turmaId}`),
      ]);
      setTurma(turmaResposta?.turma || null);
      setAlunos(alunosResposta?.alunos || []);
    } catch (error) {
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  }, [turmaId]);

  useEffect(() => {
    if (!router.isReady) return undefined;
    const timer = window.setTimeout(carregar, 0);
    return () => window.clearTimeout(timer);
  }, [router.isReady, carregar]);

  async function cadastrar(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");
    setSalvando(true);
    try {
      const body = demoEnabled()
        ? { ...form, turmaId, ra: form.ra.trim() }
        : { ra: form.ra.trim(), turmaId };
      const resposta = await apiRequest("/api/alunos", {
        method: "POST",
        body,
      });
      setSucesso(
        resposta?.mensagem ||
          "Aluno cadastrado. O cadastro inicial está pendente.",
      );
      setForm(vazio);
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <Head>
        <title>Alunos da turma | Zooly</title>
      </Head>
      <TeacherLayout
        title={turma?.nome || "Turma 1º Ano A"}
        subtitle="Gestão de alunos e progresso de missões acadêmicas."
      >
        <div className={styles.back}>
          <Link href="/turmas">← Voltar para Turmas</Link>
          <button
            type="button"
            className={styles.primary}
            onClick={() => setMostrarForm(true)}
          >
            ＋ Novo Aluno
          </button>
        </div>
        {erro ? <Notice kind="error">{erro}</Notice> : null}
        {sucesso ? <Notice kind="success">{sucesso}</Notice> : null}
        <section className={styles.metrics}>
          <article>
            <div>
              <span>ALUNOS</span>
              <strong>{alunos.length}</strong>
              <small>Matriculados</small>
            </div>
            <span className={styles.metricIcon}>♙</span>
          </article>
          <article>
            <div>
              <span>MISSÕES</span>
              <strong>10</strong>
              <small>Ativas</small>
            </div>
            <div className={styles.missionProgress}>
              <i />
            </div>
          </article>
          <article>
            <div>
              <span>CONCLUÍDAS</span>
              <strong>5</strong>
              <small>Finalizadas</small>
            </div>
            <span className={styles.award}>✿</span>
          </article>
        </section>
        <section className={styles.tableCard}>
          <div className={styles.tableTitle}>
            <h2>Lista de Alunos</h2>
            <button
              type="button"
              aria-label="Filtrar alunos"
              onClick={() =>
                setAlunos((list) =>
                  [...list].sort((a, b) =>
                    a.nomeCompleto.localeCompare(b.nomeCompleto),
                  ),
                )
              }
            >
              ☷
            </button>
          </div>
          {loading ? (
            <p className={styles.loading}>Carregando alunos...</p>
          ) : alunos.length ? (
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Status</th>
                    <th>Progresso</th>
                    <th>Último acesso</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {alunos.map((aluno, index) => {
                    const progresso =
                      aluno.progresso ?? [85, 40, 92, 15][index % 4];
                    return (
                      <tr key={getId(aluno)}>
                        <td>
                          <div className={styles.student}>
                            <span
                              className={`${styles.studentAvatar} ${styles[`avatar${index % 4}`]}`}
                            >
                              {(aluno.nomeCompleto || "A")
                                .slice(0, 1)
                                .toUpperCase()}
                            </span>
                            <div>
                              <strong>
                                {aluno.nomeCompleto ||
                                  "Cadastro inicial pendente"}
                              </strong>
                              <small>
                                {aluno.email || "E-mail não informado"}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={styles.activeBadge}>
                            {aluno.cadastroInicialConcluido
                              ? "ATIVO"
                              : "PENDENTE"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.progress}>
                            <span>
                              <i style={{ width: `${progresso}%` }} />
                            </span>
                            <strong>{progresso}%</strong>
                          </div>
                        </td>
                        <td>
                          {aluno.ultimoAcesso || formatDate(aluno.createdAt)}
                        </td>
                        <td>
                          <button
                            className={styles.more}
                            type="button"
                            aria-label={`Ver ${aluno.nomeCompleto}`}
                            onClick={() => setAlunoSelecionado(aluno)}
                          >
                            ⋮
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.empty}>
              <Image
                src="/img/cobra-vetor.png"
                alt="Mascote Cobra"
                width={160}
                height={160}
              />
              <h2>Esta turma ainda não tem alunos</h2>
              <p>
                Cadastre o primeiro aluno para acompanhar o progresso das
                missões.
              </p>
              <button
                type="button"
                className={styles.primary}
                onClick={() => setMostrarForm(true)}
              >
                ＋ Novo Aluno
              </button>
            </div>
          )}
          {!loading && alunos.length > 0 ? (
            <div className={styles.tableFooter}>
              EXIBINDO {alunos.length} DE {alunos.length} ALUNOS{" "}
              <span>
                ‹　<b>1</b>　›
              </span>
            </div>
          ) : null}
        </section>
        {mostrarForm ? (
          <div
            className={styles.modalBackdrop}
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setMostrarForm(false);
            }}
          >
            <section
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="student-modal-title"
            >
              <h2 id="student-modal-title">Novo Aluno</h2>
              <form onSubmit={cadastrar}>
                <label>
                  Nome do Aluno
                  <input
                    value={form.nomeCompleto}
                    onChange={(e) =>
                      setForm({ ...form, nomeCompleto: e.target.value })
                    }
                    placeholder="Ex.: Sarah do Nascimento"
                    required
                  />
                </label>
                <div className={styles.formRow}>
                  <label>
                    Idade
                    <input
                      type="number"
                      min="3"
                      max="18"
                      value={form.idade}
                      onChange={(e) =>
                        setForm({ ...form, idade: e.target.value })
                      }
                      placeholder="Ex.: 5 anos"
                    />
                  </label>
                  <label>
                    RA do aluno
                    <input
                      value={form.ra}
                      onChange={(e) => setForm({ ...form, ra: e.target.value })}
                      placeholder="Ex.: 154542026"
                      required
                    />
                  </label>
                </div>
                <label>
                  Nome do responsável
                  <input
                    value={form.responsavel}
                    onChange={(e) =>
                      setForm({ ...form, responsavel: e.target.value })
                    }
                    placeholder="Nome do responsável"
                  />
                </label>
                <label>
                  E-mail do responsável
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="responsavel@email.com"
                  />
                </label>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.cancel}
                    onClick={() => setMostrarForm(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={styles.primary}
                    disabled={salvando}
                  >
                    {salvando ? "Cadastrando..." : "✓ Cadastrar"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : null}
        {alunoSelecionado ? (
          <div
            className={styles.modalBackdrop}
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget)
                setAlunoSelecionado(null);
            }}
          >
            <section
              className={styles.detailModal}
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                className={styles.close}
                aria-label="Fechar"
                onClick={() => setAlunoSelecionado(null)}
              >
                ×
              </button>
              <span className={styles.studentAvatar}>
                {(alunoSelecionado.nomeCompleto || "A").slice(0, 1)}
              </span>
              <h2>{alunoSelecionado.nomeCompleto}</h2>
              <p>{alunoSelecionado.email || "E-mail não informado"}</p>
              <strong>
                Progresso da turma: {alunoSelecionado.progresso ?? 0}%
              </strong>
            </section>
          </div>
        ) : null}
      </TeacherLayout>
    </>
  );
}

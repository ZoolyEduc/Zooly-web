import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import TeacherLayout from "../../../components/TeacherLayout";
import Notice from "../../../components/Notice";
import { apiRequest } from "../../../services/api";
import { getId, formatDate } from "../../../utils/formatacao";
import styles from "./alunos.module.css";

const vazio = {
  ra: "",
};

export default function AlunosDaTurma() {
  const router = useRouter();
  const turmaId = router.query.id;
  const [turma, setTurma] = useState(null);
  const [turmas, setTurmas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(vazio);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [alunoEmEdicao, setAlunoEmEdicao] = useState(null);
  const [formEdicao, setFormEdicao] = useState({ ra: "", turmaId: "" });
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const carregar = useCallback(async () => {
    const id = router.query.id;
    if (!id) return;
    try {
      const [turmaResposta, alunosResposta, turmasResposta] = await Promise.all(
        [
          apiRequest(`/api/turmas/${id}`),
          apiRequest(`/api/alunos/turma/${id}`),
          apiRequest("/api/turmas"),
        ],
      );
      setTurma(turmaResposta?.turma || null);
      setAlunos(alunosResposta?.alunos || []);
      setTurmas(turmasResposta?.turmas || []);
    } catch (error) {
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

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
      const resposta = await apiRequest("/api/alunos", {
        method: "POST",
        body: { ra: form.ra.trim(), turmaId },
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

  function abrirNovoAluno() {
    setErro("");
    setSucesso("");
    setMostrarForm(true);
  }

  function fecharNovoAluno() {
    setErro("");
    setMostrarForm(false);
  }

  function fecharEdicao() {
    setErro("");
    setAlunoEmEdicao(null);
  }

  function iniciarEdicao(aluno) {
    setAlunoSelecionado(null);
    setAlunoEmEdicao(aluno);
    setFormEdicao({ ra: "", turmaId: "" });
    setErro("");
  }

  async function atualizarAluno(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");
    const body = {};
    if (formEdicao.ra.trim()) body.ra = formEdicao.ra.trim();
    if (formEdicao.turmaId) body.turmaId = formEdicao.turmaId;
    if (Object.keys(body).length === 0) {
      setErro("Informe um novo RA ou escolha uma turma de destino.");
      return;
    }

    setSalvandoEdicao(true);
    try {
      const resposta = await apiRequest(`/api/alunos/${getId(alunoEmEdicao)}`, {
        method: "PUT",
        body,
      });
      setSucesso(resposta?.mensagem || "Aluno atualizado com sucesso.");
      setAlunoEmEdicao(null);
      await carregar();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvandoEdicao(false);
    }
  }

  return (
    <>
      <Head>
        <title>Alunos da turma | Zooly</title>
      </Head>
      <TeacherLayout
        title={turma?.nome || "Alunos da turma"}
        subtitle="Gestão de alunos e progresso de missões acadêmicas."
        actions={
          <button
            type="button"
            className={styles.primary}
            onClick={abrirNovoAluno}
          >
            ＋ Novo Aluno
          </button>
        }
      >
        <div className={styles.back}>
          <Link href="/turmas">← Voltar para Turmas</Link>
        </div>
        {erro && !mostrarForm && !alunoEmEdicao ? (
          <Notice kind="error">{erro}</Notice>
        ) : null}
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
              <span>CADASTROS PENDENTES</span>
              <strong>
                {
                  alunos.filter((aluno) => !aluno.cadastroInicialConcluido)
                    .length
                }
              </strong>
              <small>Precisam concluir o primeiro acesso</small>
            </div>
            <span className={styles.metricIcon}>…</span>
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
                    (a.nomeCompleto || "").localeCompare(
                      b.nomeCompleto || "",
                      "pt-BR",
                    ),
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
                    <th>Cadastro</th>
                    <th>Data do cadastro</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {alunos.map((aluno, index) => {
                    return (
                      <tr key={getId(aluno)}>
                        <td data-label="Aluno">
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
                              {aluno.ra ? <small>RA {aluno.ra}</small> : null}
                            </div>
                          </div>
                        </td>
                        <td data-label="Cadastro">
                          <span className={styles.activeBadge}>
                            {aluno.cadastroInicialConcluido
                              ? "ATIVO"
                              : "PENDENTE"}
                          </span>
                        </td>
                        <td data-label="Data do cadastro">
                          {formatDate(aluno.createdAt)}
                        </td>
                        <td data-label="Ações">
                          <button
                            className={styles.more}
                            type="button"
                            aria-label={`Consultar ${aluno.nomeCompleto || "aluno"}`}
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
                onClick={abrirNovoAluno}
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
              if (event.target === event.currentTarget) fecharNovoAluno();
            }}
          >
            <section
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="student-modal-title"
            >
              <h2 id="student-modal-title">Novo Aluno</h2>
              {erro ? <Notice kind="error">{erro}</Notice> : null}
              <form onSubmit={cadastrar}>
                <label>
                  RA do aluno
                  <input
                    value={form.ra}
                    onChange={(e) => setForm({ ...form, ra: e.target.value })}
                    placeholder="RA informado pela escola"
                    required
                  />
                </label>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.cancel}
                    onClick={fecharNovoAluno}
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
              <h2>
                {alunoSelecionado.nomeCompleto || "Nome ainda não informado"}
              </h2>
              {alunoSelecionado.ra ? <p>RA {alunoSelecionado.ra}</p> : null}
              <p>Cadastro criado em {formatDate(alunoSelecionado.createdAt)}</p>
              <strong>
                {alunoSelecionado.cadastroInicialConcluido
                  ? "Cadastro inicial concluído"
                  : "Cadastro inicial pendente"}
              </strong>
              <button
                type="button"
                className={styles.primary}
                onClick={() => iniciarEdicao(alunoSelecionado)}
              >
                Editar RA ou transferir
              </button>
            </section>
          </div>
        ) : null}
        {alunoEmEdicao ? (
          <div
            className={styles.modalBackdrop}
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) fecharEdicao();
            }}
          >
            <section
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="student-edit-title"
            >
              <h2 id="student-edit-title">Editar aluno</h2>
              {erro ? <Notice kind="error">{erro}</Notice> : null}
              <form onSubmit={atualizarAluno}>
                <label>
                  Novo RA
                  <input
                    value={formEdicao.ra}
                    onChange={(event) =>
                      setFormEdicao({ ...formEdicao, ra: event.target.value })
                    }
                    placeholder={
                      alunoEmEdicao.ra
                        ? `Atual: ${alunoEmEdicao.ra}`
                        : "Deixe em branco para manter"
                    }
                  />
                </label>
                <label>
                  Transferir para outra turma
                  <select
                    value={formEdicao.turmaId}
                    onChange={(event) =>
                      setFormEdicao({
                        ...formEdicao,
                        turmaId: event.target.value,
                      })
                    }
                  >
                    <option value="">Manter turma atual</option>
                    {turmas
                      .filter((item) => getId(item) !== turmaId)
                      .map((item) => (
                        <option key={getId(item)} value={getId(item)}>
                          {item.nome}
                        </option>
                      ))}
                  </select>
                </label>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.cancel}
                    onClick={fecharEdicao}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={styles.primary}
                    disabled={salvandoEdicao}
                  >
                    {salvandoEdicao ? "Salvando..." : "Salvar alterações"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : null}
      </TeacherLayout>
    </>
  );
}

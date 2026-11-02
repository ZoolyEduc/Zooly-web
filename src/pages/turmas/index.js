import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import TeacherLayout from "../../components/TeacherLayout";
import Notice from "../../components/Notice";
import { apiRequest } from "../../services/api";
import { getId } from "../../services/session";
import styles from "./turmas.module.css";

export default function Turmas() {
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [turmaEmEdicao, setTurmaEmEdicao] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    escolaId: "",
    anoEscolar: String(new Date().getFullYear()),
  });
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const resposta = await apiRequest("/api/turmas");
      setTurmas(resposta?.turmas || []);
    } catch (error) {
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(carregar, 0);
    return () => window.clearTimeout(timer);
  }, [carregar]);

  async function cadastrar(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");
    setSalvando(true);
    try {
      const dados = {
        nome: form.nome.trim(),
        anoEscolar: Number(form.anoEscolar),
      };
      const resposta = turmaEmEdicao
        ? await apiRequest(`/api/turmas/${getId(turmaEmEdicao)}`, {
            method: "PUT",
            body: dados,
          })
        : await apiRequest("/api/turmas", {
            method: "POST",
            body: { ...dados, escolaId: form.escolaId.trim() },
          });
      setSucesso(
        resposta?.mensagem ||
          (turmaEmEdicao
            ? "Turma atualizada com sucesso."
            : "Turma cadastrada com sucesso."),
      );
      setForm({
        nome: "",
        escolaId: "",
        anoEscolar: String(new Date().getFullYear()),
      });
      setTurmaEmEdicao(null);
      setMostrarFormulario(false);
      await carregar();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function arquivar(turma) {
    const id = getId(turma);
    if (!id || !window.confirm(`Arquivar a turma "${turma.nome}"?`)) return;
    setErro("");
    setSucesso("");
    try {
      const resposta = await apiRequest(`/api/turmas/${id}/arquivar`, {
        method: "PATCH",
      });
      setSucesso(resposta?.mensagem || "Turma arquivada.");
      await carregar();
    } catch (error) {
      setErro(error.message);
    }
  }

  function abrirCadastro() {
    setTurmaEmEdicao(null);
    setForm({
      nome: "",
      escolaId: "",
      anoEscolar: String(new Date().getFullYear()),
    });
    setMostrarFormulario(true);
  }

  function abrirEdicao(turma) {
    setTurmaEmEdicao(turma);
    setForm({
      nome: turma.nome || "",
      escolaId: "",
      anoEscolar: String(turma.anoEscolar || new Date().getFullYear()),
    });
    setMostrarFormulario(true);
  }

  function fecharFormulario() {
    setMostrarFormulario(false);
    setTurmaEmEdicao(null);
  }

  return (
    <>
      <Head>
        <title>Turmas | Zooly</title>
      </Head>
      <TeacherLayout
        title="Turmas"
        subtitle="Gerencie suas turmas e mascotes. Acompanhe o progresso de cada grupo de forma intuitiva."
      >
        {erro ? <Notice kind="error">{erro}</Notice> : null}
        {sucesso ? <Notice kind="success">{sucesso}</Notice> : null}
        
        <div className={styles.toolbar}>
          <span />{" "}
          <button
            type="button"
            className={styles.primary}
            onClick={abrirCadastro}
          >
            + Nova Turma
          </button>
        </div>

        {loading ? (
          <p className={styles.loading}>Carregando turmas...</p>
        ) : turmas.length ? (
          <section className={styles.grid}>
            {turmas.map((turma, index) => {
              const id = getId(turma);
              
              return (
                <article className={styles.card} key={id || index}>
                  <div className={styles.cardTop}>
                    <div className={`${styles.mascotBox} ${styles[`tone${index % 4}`]}`} aria-hidden="true">
                      <span>♧</span>
                    </div>
                  </div>
                  <h2>{turma.nome}</h2>
                  <p className={styles.period}>
                    {turma.escola?.nome ? `${turma.escola.nome} · ` : ""}
                    Ano letivo {turma.anoEscolar || "—"}
                  </p>
                  <div className={styles.cardActions}>
                    <Link className={styles.students} href={`/turmas/${id}/alunos`}>
                      Consultar alunos
                    </Link>
                    <button type="button" onClick={() => abrirEdicao(turma)}>
                      Editar
                    </button>
                    <button type="button" onClick={() => arquivar(turma)}>
                      Arquivar
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          // AQUI ESTÁ O EMPTY STATE (Tela vazia bonita)
          <section className={styles.empty}>
            <Image
              src="/img/sarue-vetor.png"
              alt="Mascote Saruê"
              width={160}
              height={160}
            />
            <h2>Nenhuma turma encontrada</h2>
            <p>
              Cadastre sua primeira turma para acompanhar seus alunos e
              atividades.
            </p>
            <button
              type="button"
              className={styles.primary}
              onClick={abrirCadastro}
            >
              + Nova Turma
            </button>
          </section>
        )}

        {mostrarFormulario ? (
          <div
            className={styles.modalBackdrop}
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget)
                setMostrarFormulario(false);
            }}
          >
            <section
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="class-modal-title"
            >
              <h2 id="class-modal-title">
                {turmaEmEdicao ? "Editar Turma" : "Cadastrar Nova Turma"}
              </h2>
              <p className={styles.modalIntro}>
                Informe os dados utilizados pela escola para identificar a turma.
              </p>
              <form onSubmit={cadastrar}>
                <label>
                  Nome da Turma
                  <input
                    value={form.nome}
                    onChange={(event) =>
                      setForm({ ...form, nome: event.target.value })
                    }
                    placeholder="Ex.: Turma 1º Ano A"
                    required
                  />
                </label>
                <div className={styles.formRow}>
                  <label>
                    Ano letivo
                    <input
                      type="number"
                      min="2000"
                      max="2100"
                      value={form.anoEscolar}
                      onChange={(event) =>
                        setForm({ ...form, anoEscolar: event.target.value })
                      }
                      required
                    />
                  </label>
                </div>
                {!turmaEmEdicao ? (
                  <label>
                    ID da escola
                    <input
                      value={form.escolaId}
                      onChange={(event) =>
                        setForm({ ...form, escolaId: event.target.value })
                      }
                      placeholder="ID fornecido pela administração"
                      required
                    />
                  </label>
                ) : null}
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.cancel}
                    onClick={fecharFormulario}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={styles.primary}
                    disabled={salvando}
                  >
                    {salvando
                      ? "Salvando..."
                      : turmaEmEdicao
                        ? "Salvar alterações"
                        : "Criar turma"}
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
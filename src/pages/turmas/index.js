import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import TeacherLayout from "../../components/TeacherLayout";
import Notice from "../../components/Notice";
import { apiRequest } from "../../services/api";
import { demoEnabled } from "../../services/demo";
import { getId } from "../../services/session";
import styles from "./turmas.module.css";

const mascotes = [
  { id: "papagaio", nome: "Papagaio", src: "/img/papagaio-botao.png" },
  { id: "lagarto", nome: "Lagarto", src: "/img/lagarto-botao.png" },
  { id: "cobra", nome: "Cobra", src: "/img/cobra-botao.png" },
  { id: "sarue", nome: "Saruê", src: "/img/sarue-botao.png" },
];

export default function Turmas() {
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    escolaId: "",
    anoEscolar: String(new Date().getFullYear()),
    periodo: "Manhã",
  });
  const [mascote, setMascote] = useState("papagaio");
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
        escolaId: form.escolaId.trim(),
        anoEscolar: Number(form.anoEscolar),
      };
      const resposta = await apiRequest("/api/turmas", {
        method: "POST",
        body: demoEnabled()
          ? { ...dados, periodo: form.periodo, mascote }
          : dados,
      });
      setSucesso(resposta?.mensagem || "Turma cadastrada com sucesso.");
      setForm({
        nome: "",
        escolaId: "",
        anoEscolar: String(new Date().getFullYear()),
        periodo: "Manhã",
      });
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
    if (!id) return;
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
            onClick={() => setMostrarFormulario(true)}
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
              const mascot =
                mascotes.find((item) => item.id === turma.mascote) ||
                mascotes[index % mascotes.length];
              const totalAlunos =
                turma.totalAlunos ?? turma.alunos?.length ?? 3;
              
              return (
                <article className={styles.card} key={id || index}>
                  <div className={styles.cardTop}>
                    <div className={`${styles.mascotBox} ${styles[`tone${index % 4}`]}`}>
                      <Image
                        src={mascot.src}
                        alt={mascot.nome}
                        width={52}
                        height={52}
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                    <button
                      type="button"
                      className={styles.more}
                      aria-label={`Mais opções para ${turma.nome}`}
                      onClick={() => arquivar(turma)}
                    >
                      ⋮
                    </button>
                  </div>
                  <span
                    className={`${styles.kicker} ${styles[`tag${index % 4}`]}`}
                  >
                    MASCOTE: {mascot.nome.toUpperCase()}
                  </span>
                  <h2>{turma.nome}</h2>
                  <p className={styles.period}>
                    Período: {turma.periodo || (index % 2 ? "Tarde" : "Manhã")}
                  </p>
                  <Link
                    className={styles.students}
                    href={`/turmas/${id}/alunos`}
                  >
                    <span aria-hidden="true">♧</span>
                    {totalAlunos} Alunos
                  </Link>
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
              onClick={() => setMostrarFormulario(true)}
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
              <h2 id="class-modal-title">Cadastrar Nova Turma</h2>
              <p className={styles.modalIntro}>
                Preencha os dados abaixo para iniciar sua jornada com novos
                alunos.
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
                    Período
                    <select
                      value={form.periodo}
                      onChange={(event) =>
                        setForm({ ...form, periodo: event.target.value })
                      }
                    >
                      <option>Manhã</option>
                      <option>Tarde</option>
                      <option>Integral</option>
                    </select>
                  </label>
                  <label>
                    Ano escolar
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
                <label>
                  ID da escola
                  <input
                    value={form.escolaId}
                    onChange={(event) =>
                      setForm({ ...form, escolaId: event.target.value })
                    }
                    placeholder={
                      demoEnabled()
                        ? "Preenchimento demonstrativo"
                        : "ID fornecido pela administração"
                    }
                    required={!demoEnabled()}
                  />
                </label>
                <fieldset>
                  <legend>Escolha um Mascote</legend>
                  <div className={styles.mascotPicker}>
                    {mascotes.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        aria-label={item.nome}
                        aria-pressed={mascote === item.id}
                        className={
                          mascote === item.id ? styles.selectedMascot : ""
                        }
                        onClick={() => setMascote(item.id)}
                      >
                        <Image
                          src={item.src}
                          alt=""
                          width={64}
                          height={64}
                        />
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.cancel}
                    onClick={() => setMostrarFormulario(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={styles.primary}
                    disabled={salvando}
                  >
                    {salvando ? "Cadastrando..." : "✓ Criar Turma"}
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
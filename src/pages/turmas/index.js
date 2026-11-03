import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Archive,
  EllipsisVertical,
  Eye,
  KeyRound,
  Pencil,
  UsersRound,
  UserPlus,
} from "lucide-react";
import TeacherLayout from "../../components/TeacherLayout";
import { mascotes } from "../../components/Mascotes";
import Notice from "../../components/Notice";
import { apiRequest } from "../../services/api";
import { getId } from "../../utils/formatacao";
import styles from "./turmas.module.css";

function formularioVazio(escolaId = "") {
  return {
    nome: "",
    escolaId,
    anoEscolar: String(new Date().getFullYear()),
    periodo: "",
    mascote: "",
  };
}

// A API já usou nomes diferentes para o código da turma.
function codigoDaTurma(turma) {
  return turma.codigoPermanente || turma.codigo || turma.codigo_turma;
}

// O mascote pode vir como id ("sarue"), nome ou caminho de imagem antigo.
function mascoteDaTurma(turma) {
  const mascoteId = String(turma.mascote || "")
    .toLowerCase()
    .split("/")
    .pop()
    .replace(/-vetor\.png$|-botao\.png$/, "");
  return mascotes.find(
    (item) => item.id === mascoteId || item.nome.toLowerCase() === mascoteId,
  );
}

const mascotePadrao = mascotes.find((item) => item.id === "sarue");

export default function Turmas() {
  const router = useRouter();
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [turmaEmEdicao, setTurmaEmEdicao] = useState(null);
  const [form, setForm] = useState(formularioVazio);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [codigoCopiado, setCodigoCopiado] = useState("");
  const [escolas, setEscolas] = useState([]);
  const [turmaSenha, setTurmaSenha] = useState(null);
  const [senhaAcesso, setSenhaAcesso] = useState("");

  async function salvarSenhaAcesso(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");
    setSalvando(true);
    try {
      const resposta = await apiRequest(
        `/api/turmas/${getId(turmaSenha)}/senha-acesso`,
        { method: "PATCH", body: { senha: senhaAcesso } },
      );
      setSucesso(resposta?.mensagem || "Senha de acesso configurada.");
      setTurmaSenha(null);
      setSenhaAcesso("");
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function copiarCodigo(event, turma) {
    event.stopPropagation();
    const codigo = codigoDaTurma(turma);
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(codigo);
      setCodigoCopiado(getId(turma));
      window.setTimeout(() => setCodigoCopiado(""), 1800);
    } catch {
      setErro("Não foi possível copiar o código neste navegador.");
    }
  }

  const carregar = useCallback(async () => {
    setErro("");
    try {
      const [resposta, perfil] = await Promise.all([
        apiRequest("/api/turmas"),
        apiRequest("/api/professores/me"),
      ]);
      setEscolas(perfil?.professor?.escolas || []);
      const lista = resposta?.turmas || [];
      const contagens = await Promise.all(
        lista.map(async (turma) => {
          if (Number.isFinite(turma.totalAlunos)) {
            return { total: turma.totalAlunos, erro: null };
          }
          if (Array.isArray(turma.alunos)) {
            return { total: turma.alunos.length, erro: null };
          }
          const id = getId(turma);
          if (!id) {
            return {
              total: null,
              erro: "Uma turma retornada pela API não possui identificador.",
            };
          }
          try {
            const alunos = await apiRequest(`/api/alunos/turma/${id}`);
            return {
              total: Array.isArray(alunos?.alunos)
                ? alunos.alunos.length
                : null,
              erro: Array.isArray(alunos?.alunos)
                ? null
                : `A API não retornou os alunos da turma "${turma.nome || id}".`,
            };
          } catch (error) {
            return { total: null, erro: error.message };
          }
        }),
      );
      setTurmas(
        lista.map((turma, index) => ({
          ...turma,
          alunosCountExibicao: contagens[index].total,
        })),
      );
      const errosContagem = contagens.map((item) => item.erro).filter(Boolean);
      if (errosContagem.length) {
        setErro(
          `Não foi possível obter todas as quantidades de alunos: ${errosContagem[0]}`,
        );
      }
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
    if (!form.periodo || !form.mascote) {
      setErro("Selecione o período e o mascote da turma.");
      return;
    }
    setSalvando(true);
    try {
      const dados = {
        nome: form.nome.trim(),
        anoEscolar: Number(form.anoEscolar),
        periodo: form.periodo,
        mascote: form.mascote,
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
      setForm(formularioVazio());
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
    setErro("");
    setTurmaEmEdicao(null);
    setForm(formularioVazio(escolas.length === 1 ? getId(escolas[0]) : ""));
    setMostrarFormulario(true);
  }

  function abrirEdicao(turma) {
    setErro("");
    setTurmaEmEdicao(turma);
    setForm({
      nome: turma.nome || "",
      escolaId: "",
      anoEscolar: String(turma.anoEscolar || new Date().getFullYear()),
      periodo: turma.periodo || "",
      mascote: turma.mascote || "",
    });
    setMostrarFormulario(true);
  }

  function fecharFormulario() {
    setErro("");
    setMostrarFormulario(false);
    setTurmaEmEdicao(null);
  }

  function fecharSenha() {
    setErro("");
    setTurmaSenha(null);
    setSenhaAcesso("");
  }

  function abrirAlunos(id) {
    if (id) router.push(`/turmas/${encodeURIComponent(id)}/alunos`);
  }

  const modalAberto = mostrarFormulario || Boolean(turmaSenha);

  return (
    <>
      <Head>
        <title>Turmas | Zooly</title>
      </Head>
      <TeacherLayout
        title="Turmas"
        subtitle="Gerencie suas turmas e mascotes. Acompanhe o progresso de cada grupo de forma intuitiva."
      >
        {erro && !modalAberto ? <Notice kind="error">{erro}</Notice> : null}
        {sucesso ? <Notice kind="success">{sucesso}</Notice> : null}

        <div className={styles.toolbar}>
          <span />{" "}
          <button
            type="button"
            className={styles.primary}
            onClick={abrirCadastro}
          >
            <UserPlus size={18} aria-hidden="true" />
            Nova Turma
          </button>
        </div>

        {loading ? (
          <p className={styles.loading}>Carregando turmas...</p>
        ) : turmas.length ? (
          <section className={styles.grid}>
            {turmas.map((turma, index) => {
              const id = getId(turma);
              const mascote = mascoteDaTurma(turma);
              const imagemMascote = mascote || mascotePadrao;
              const codigo = codigoDaTurma(turma);
              return (
                <article
                  className={styles.card}
                  key={id || index}
                  role="link"
                  tabIndex={0}
                  aria-label={`Abrir alunos da turma ${turma.nome || ""}`}
                  onClick={(event) => {
                    if (event.target.closest("a, button, summary, details"))
                      return;
                    abrirAlunos(id);
                  }}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if ((event.key === "Enter" || event.key === " ") && id) {
                      event.preventDefault();
                      abrirAlunos(id);
                    }
                  }}
                >
                  <div className={styles.cardTop}>
                    <div
                      className={`${styles.mascotBox} ${styles[`tone${index % 4}`]}`}
                    >
                      <Image
                        src={imagemMascote.srcVetor}
                        alt={
                          mascote
                            ? `Mascote ${mascote.nome}`
                            : "Ilustração de mascote"
                        }
                        width={56}
                        height={56}
                      />
                    </div>
                    <details className={styles.actionsMenu}>
                      <summary
                        aria-label={`Ações da turma ${turma.nome || ""}`}
                      >
                        <EllipsisVertical size={19} aria-hidden="true" />
                      </summary>
                      <div className={styles.actionsDropdown}>
                        <Link href={`/turmas/${id}/alunos`}>
                          <Eye size={16} aria-hidden="true" />
                          Consultar turma
                        </Link>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.currentTarget.closest("details").open = false;
                            abrirEdicao(turma);
                          }}
                        >
                          <Pencil size={16} aria-hidden="true" />
                          Editar turma
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.currentTarget.closest("details").open = false;
                            setErro("");
                            setSucesso("");
                            setSenhaAcesso("");
                            setTurmaSenha(turma);
                          }}
                        >
                          <KeyRound size={16} aria-hidden="true" />
                          Senha de acesso dos alunos
                        </button>
                        <button
                          type="button"
                          className={styles.archiveAction}
                          onClick={(event) => {
                            event.currentTarget.closest("details").open = false;
                            arquivar(turma);
                          }}
                        >
                          <Archive size={16} aria-hidden="true" />
                          Arquivar turma
                        </button>
                      </div>
                    </details>
                  </div>
                  <span
                    className={`${styles.kicker} ${styles[`tag${index % 4}`]}`}
                  >
                    {mascote
                      ? `Mascote: ${mascote.nome}`
                      : "Mascote não informado"}
                  </span>
                  <h2>{turma.nome}</h2>
                  {codigo ? (
                    <button
                      type="button"
                      className={styles.classCode}
                      onClick={(event) => copiarCodigo(event, turma)}
                      aria-label={`Copiar código da turma ${codigo}`}
                    >
                      <span>CÓDIGO DA TURMA</span>
                      <strong>{codigo}</strong>
                      <small>
                        {codigoCopiado === id ? "Copiado" : "Copiar"}
                      </small>
                    </button>
                  ) : null}
                  <p className={styles.period}>
                    Período: {turma.periodo || "Não informado"}
                  </p>
                  <div className={styles.students}>
                    <UsersRound size={14} aria-hidden="true" />
                    {turma.alunosCountExibicao == null
                      ? "Quantidade de alunos indisponível"
                      : `${turma.alunosCountExibicao} ${turma.alunosCountExibicao === 1 ? "aluno" : "alunos"}`}
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
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
              <UserPlus size={18} aria-hidden="true" />
              Nova Turma
            </button>
          </section>
        )}

        {mostrarFormulario ? (
          <div
            className={styles.modalBackdrop}
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) fecharFormulario();
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
                Informe os dados utilizados pela escola para identificar a
                turma.
              </p>
              {erro ? <Notice kind="error">{erro}</Notice> : null}
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
                <label>
                  Período
                  <select
                    value={form.periodo}
                    onChange={(event) =>
                      setForm({ ...form, periodo: event.target.value })
                    }
                    required
                  >
                    <option value="">Selecione o período</option>
                    <option value="Manhã">Manhã</option>
                    <option value="Tarde">Tarde</option>
                  </select>
                </label>
                <fieldset>
                  <legend>Escolha um mascote</legend>
                  <div
                    className={styles.mascotPicker}
                    role="group"
                    aria-label="Mascote da turma"
                  >
                    {mascotes.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        aria-label={`Selecionar mascote ${item.nome}`}
                        aria-pressed={form.mascote === item.id}
                        onClick={() => setForm({ ...form, mascote: item.id })}
                      >
                        <Image
                          src={item.srcBotao}
                          alt=""
                          width={item.widthBotao}
                          height={item.heightBotao}
                        />
                      </button>
                    ))}
                  </div>
                </fieldset>
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
                    Escola
                    <select
                      value={form.escolaId}
                      onChange={(event) =>
                        setForm({ ...form, escolaId: event.target.value })
                      }
                      required
                    >
                      <option value="">Selecione a escola</option>
                      {escolas.map((escola) => (
                        <option key={getId(escola)} value={getId(escola)}>
                          {escola.nome}
                        </option>
                      ))}
                    </select>
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

        {turmaSenha ? (
          <div
            className={styles.modalBackdrop}
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) fecharSenha();
            }}
          >
            <section
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="class-password-title"
            >
              <h2 id="class-password-title">Senha de acesso dos alunos</h2>
              <p className={styles.modalIntro}>
                Os alunos de {turmaSenha.nome} usam esta senha para entrar no
                jogo. Definir uma nova senha substitui a anterior.
              </p>
              {erro ? <Notice kind="error">{erro}</Notice> : null}
              <form onSubmit={salvarSenhaAcesso}>
                <label>
                  Nova senha de acesso
                  <input
                    value={senhaAcesso}
                    onChange={(event) => setSenhaAcesso(event.target.value)}
                    autoComplete="off"
                    minLength={4}
                    maxLength={20}
                    placeholder="De 4 a 20 caracteres"
                    required
                  />
                </label>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.cancel}
                    onClick={fecharSenha}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={styles.primary}
                    disabled={salvando}
                  >
                    {salvando ? "Salvando..." : "Salvar senha"}
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

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import TeacherLayout from "../../components/TeacherLayout";
import Notice from "../../components/Notice";
import { apiRequest, makeObjectId } from "../../services/api";
import { getId } from "../../services/session";
import styles from "./atividades.module.css";

function novaQuestao() {
  const alternativaA = makeObjectId();
  const alternativaB = makeObjectId();
  return {
    key: makeObjectId(),
    enunciado: "",
    alternativas: [
      { _id: alternativaA, texto: "" },
      { _id: alternativaB, texto: "" },
    ],
    respostaCorreta: alternativaA,
  };
}

const HABILIDADES_DISPONIVEIS = [
  "EF01LP05", "EF02LP26", "EF35LP01", 
  "EF12LP01", "EF15LP03", "EF01LP17"
];

// Lista inicial de missões
const MISSOES_INICIAIS = [
  { id: "ler", label: "Ler um texto", selecionado: true },
  { id: "completar", label: "Completar palavras", selecionado: true },
  { id: "escutar", label: "Escutar e escrever", selecionado: false },
  { id: "sons", label: "Identificar sons", selecionado: true },
  { id: "perguntas", label: "Responder perguntas", selecionado: true },
];

export default function NovaAtividade() {
  const router = useRouter();
  const [turmas, setTurmas] = useState([]);
  const [historias, setHistorias] = useState([]);
  const [form, setForm] = useState({
    turma: "",
    titulo: "",
    historiaTipo: "propria",
    historiaId: "",
    textoHistoria: "",
    recompensaMoedas: "10",
    prazo: "",
  });
  const [questoes, setQuestoes] = useState([novaQuestao()]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [rascunho, setRascunho] = useState(null);
  const [publicando, setPublicando] = useState(false);

  // Estados para as Habilidades BNCC
  const [habilidadesBNCC, setHabilidadesBNCC] = useState([
    "EF01LP05", "EF02LP26", "EF35LP01"
  ]);
  const [mostrarListaBNCC, setMostrarListaBNCC] = useState(false);

  // NOVO: Estados para as Missões do Aluno
  const [missoes, setMissoes] = useState(MISSOES_INICIAIS);
  const [missaoCustomizada, setMissaoCustomizada] = useState("");

  useEffect(() => {
    let ativo = true;
    Promise.all([apiRequest("/api/turmas"), apiRequest("/api/historias")])
      .then(([turmasResponse, historiasResponse]) => {
        if (!ativo) return;
        const listaTurmas = turmasResponse?.turmas || [];
        setTurmas(listaTurmas);
        setHistorias(historiasResponse?.historias || []);
        if (listaTurmas[0])
          setForm((atual) => ({ ...atual, turma: getId(listaTurmas[0]) }));
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

  function toggleMissao(id) {
    setMissoes((current) =>
      current.map((m) => (m.id === id ? { ...m, selecionado: !m.selecionado } : m))
    );
  }

  function updateQuestion(index, changes) {
    setQuestoes((current) =>
      current.map((question, i) =>
        i === index ? { ...question, ...changes } : question,
      ),
    );
  }
  function updateAlternative(questionIndex, altId, texto) {
    setQuestoes((current) =>
      current.map((question, i) =>
        i !== questionIndex
          ? question
          : {
              ...question,
              alternativas: question.alternativas.map((alt) =>
                alt._id === altId ? { ...alt, texto } : alt,
              ),
            },
      ),
    );
  }
  function addAlternative(index) {
    setQuestoes((current) =>
      current.map((q, i) =>
        i === index
          ? {
              ...q,
              alternativas: [
                ...q.alternativas,
                { _id: makeObjectId(), texto: "" },
              ],
            }
          : q,
      ),
    );
  }
  function removeAlternative(index, altId) {
    setQuestoes((current) =>
      current.map((q, i) => {
        if (i !== index || q.alternativas.length <= 2) return q;
        const alternativas = q.alternativas.filter((a) => a._id !== altId);
        return {
          ...q,
          alternativas,
          respostaCorreta:
            q.respostaCorreta === altId
              ? alternativas[0]._id
              : q.respostaCorreta,
        };
      }),
    );
  }

  function adicionarHabilidade(hab) {
    if (!habilidadesBNCC.includes(hab)) {
      setHabilidadesBNCC([...habilidadesBNCC, hab]);
    }
    setMostrarListaBNCC(false);
  }

  async function criar(event) {
    event.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      const historia =
        form.historiaTipo === "oficial"
          ? { tipo: "oficial", historiaId: form.historiaId }
          : { tipo: "propria", texto: form.textoHistoria.trim() };
      const body = {
        turma: form.turma,
        titulo: form.titulo.trim(),
        recompensaMoedas: Number(form.recompensaMoedas),
        historia,
        questoes: questoes.map((q) => ({
          enunciado: q.enunciado.trim(),
          alternativas: q.alternativas.map((a) => ({
            _id: a._id,
            texto: a.texto.trim(),
          })),
          respostasCorretas: [q.respostaCorreta],
        })),
        prazo: form.prazo
          ? new Date(`${form.prazo}T23:59:00`).toISOString()
          : null,
        habilidadesBNCC, // Enviando as habilidades (se o backend aceitar)
        missoes: missoes.filter(m => m.selecionado).map(m => m.label), // Enviando as missões selecionadas
        missaoCustomizada, // Enviando o texto manual
      };
      const resposta = await apiRequest("/api/atividades", {
        method: "POST",
        body,
      });
      setRascunho(resposta?.atividade || null);
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function publicar() {
    const id = getId(rascunho);
    if (!id) return;
    setErro("");
    setPublicando(true);
    try {
      await apiRequest(`/api/atividades/${id}/publicar`, { method: "PATCH" });
      await router.push("/atividades");
    } catch (error) {
      setErro(error.message);
    } finally {
      setPublicando(false);
    }
  }

  return (
    <>
      <Head>
        <title>Nova atividade | Zooly</title>
      </Head>
      <TeacherLayout
        title="Nova atividade"
        subtitle="Crie uma missão educativa para uma de suas turmas."
      >
        <div className={styles.back}>
          <Link href="/atividades">← Voltar para atividades</Link>
        </div>
        {erro ? <Notice kind="error">{erro}</Notice> : null}
        {rascunho ? (
          <section className={styles.draftSuccess}>
            <div className={styles.draftIcon}>✓</div>
            <h2>Rascunho criado!</h2>
            <p>
              A atividade foi salva com sucesso. Ela ainda não aparece para os
              alunos até ser publicada.
            </p>
            <div>
              <button
                className={styles.primary}
                type="button"
                onClick={publicar}
                disabled={publicando}
              >
                {publicando ? "Publicando..." : "Publicar atividade"}
              </button>
              <Link className={styles.secondary} href="/atividades">
                Voltar à lista
              </Link>
            </div>
          </section>
        ) : loading ? (
          <p className={styles.loading}>Carregando turmas e histórias...</p>
        ) : !turmas.length ? (
          <Notice kind="info">
            Você precisa ter uma turma ativa vinculada à sua conta antes de
            criar uma atividade. Verifique a área de turmas e o vínculo com a
            escola.
          </Notice>
        ) : (
          <form className={styles.activityForm} onSubmit={criar}>
            <section className={styles.formPanel}>
              <h2>Informações da missão</h2>
              <div className={styles.formGrid}>
                <label>
                  Turma
                  <select
                    required
                    value={form.turma}
                    onChange={(e) =>
                      setForm({ ...form, turma: e.target.value })
                    }
                  >
                    {turmas.map((t) => (
                      <option key={getId(t)} value={getId(t)}>
                        {t.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Título da atividade
                  <input
                    required
                    value={form.titulo}
                    onChange={(e) =>
                      setForm({ ...form, titulo: e.target.value })
                    }
                    placeholder="Ex.: Descobrindo os sons"
                  />
                </label>
                <label>
                  Recompensa em moedas
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={form.recompensaMoedas}
                    onChange={(e) =>
                      setForm({ ...form, recompensaMoedas: e.target.value })
                    }
                  />
                </label>
                <label>
                  Prazo (opcional)
                  <input
                    type="date"
                    value={form.prazo}
                    onChange={(e) =>
                      setForm({ ...form, prazo: e.target.value })
                    }
                  />
                </label>
              </div>
            </section>
            <section className={styles.formPanel}>
              <h2>História da atividade</h2>
              <div className={styles.segment}>
                <label>
                  <input
                    type="radio"
                    name="historiaTipo"
                    checked={form.historiaTipo === "propria"}
                    onChange={() =>
                      setForm({ ...form, historiaTipo: "propria" })
                    }
                  />{" "}
                  Escrever uma história
                </label>
                <label>
                  <input
                    type="radio"
                    name="historiaTipo"
                    checked={form.historiaTipo === "oficial"}
                    onChange={() =>
                      setForm({ ...form, historiaTipo: "oficial" })
                    }
                  />{" "}
                  Usar história disponível
                </label>
              </div>
              {form.historiaTipo === "propria" ? (
                <label className={styles.fullField}>
                  Texto da história
                  <textarea
                    rows={5}
                    required
                    value={form.textoHistoria}
                    onChange={(e) =>
                      setForm({ ...form, textoHistoria: e.target.value })
                    }
                    placeholder="Escreva aqui a história que será usada na atividade."
                  />
                </label>
              ) : (
                <label className={styles.fullField}>
                  História
                  <select
                    required
                    value={form.historiaId}
                    onChange={(e) =>
                      setForm({ ...form, historiaId: e.target.value })
                    }
                  >
                    <option value="">Selecione uma história</option>
                    {historias.map((h) => (
                      <option value={getId(h)} key={getId(h)}>
                        {h.titulo}
                      </option>
                    ))}
                  </select>
                  {!historias.length ? (
                    <small>
                      Nenhuma história oficial foi retornada pela API. Escolha
                      “Escrever uma história”.
                    </small>
                  ) : null}
                </label>
              )}
            </section>
            <section className={styles.formPanel}>
              <div className={styles.questionHeader}>
                <div>
                  <h2>Questões</h2>
                  <p>
                    Adicione pelo menos duas alternativas e marque a correta.
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() =>
                    setQuestoes((current) => [...current, novaQuestao()])
                  }
                >
                  + Adicionar questão
                </button>
              </div>
              {questoes.map((q, index) => (
                <article className={styles.questionCard} key={q.key}>
                  <div className={styles.questionTitle}>
                    <strong>Questão {index + 1}</strong>
                    {questoes.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setQuestoes((current) =>
                            current.filter((_, i) => i !== index),
                          )
                        }
                      >
                        Remover
                      </button>
                    ) : null}
                  </div>
                  <label className={styles.fullField}>
                    Enunciado
                    <input
                      required
                      value={q.enunciado}
                      onChange={(e) =>
                        updateQuestion(index, { enunciado: e.target.value })
                      }
                      placeholder="Digite a pergunta"
                    />
                  </label>
                  <div className={styles.alternatives}>
                    {q.alternativas.map((alt, altIndex) => (
                      <div className={styles.alternative} key={alt._id}>
                        <label>
                          <input
                            type="radio"
                            name={`correct-${q.key}`}
                            checked={q.respostaCorreta === alt._id}
                            onChange={() =>
                              updateQuestion(index, {
                                respostaCorreta: alt._id,
                              })
                            }
                            aria-label={`Marcar alternativa ${altIndex + 1} como correta`}
                          />
                          <span>{String.fromCharCode(65 + altIndex)}</span>
                        </label>
                        <input
                          required
                          value={alt.texto}
                          onChange={(e) =>
                            updateAlternative(index, alt._id, e.target.value)
                          }
                          placeholder={`Alternativa ${String.fromCharCode(65 + altIndex)}`}
                        />
                        {q.alternativas.length > 2 ? (
                          <button
                            type="button"
                            onClick={() => removeAlternative(index, alt._id)}
                            aria-label="Remover alternativa"
                          >
                            ×
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={styles.addAlternative}
                    onClick={() => addAlternative(index)}
                  >
                    + Adicionar alternativa
                  </button>
                </article>
              ))}
            </section>
            <aside className={styles.editorAside}>
              <section>
                <h2>◎ Missão do Aluno</h2>
                <p className={styles.asideHint}>O aluno irá:</p>
                
                {/* NOVO: Botões de missão interativos */}
                <div className={styles.missionTags}>
                  {missoes.map((missao) => (
                    <button
                      key={missao.id}
                      type="button"
                      onClick={() => toggleMissao(missao.id)}
                      style={{
                        cursor: "pointer",
                        background: missao.selecionado ? "#f4f9f4" : "transparent",
                        border: missao.selecionado ? "1px solid #dcebdc" : "1px solid #e4e9eb",
                        color: missao.selecionado ? "#3c6746" : "#747d80",
                        fontWeight: missao.selecionado ? "650" : "500",
                      }}
                    >
                      {missao.selecionado ? "✓" : "◯"} {missao.label}
                    </button>
                  ))}
                </div>

                <label className={styles.fullField}>
                  Ou descreva manualmente
                  <textarea
                    rows={5}
                    maxLength={300}
                    value={missaoCustomizada}
                    onChange={(e) => setMissaoCustomizada(e.target.value)}
                    placeholder="O aluno irá ler, compreender e responder perguntas sobre a história."
                  />
                </label>
              </section>
              <section>
                <h2>▤ BNCC</h2>
                <p className={styles.asideHint}>Habilidades selecionadas</p>
                
                <div className={`${styles.missionTags} ${styles.bnccTags}`}>
                  {habilidadesBNCC.map((hab) => (
                    <span key={hab}>{hab}</span>
                  ))}
                </div>

                <button 
                  type="button" 
                  className={styles.addAlternative}
                  onClick={() => setMostrarListaBNCC(!mostrarListaBNCC)}
                >
                  ＋ Adicionar habilidade
                </button>

                {mostrarListaBNCC && (
                  <div style={{ marginTop: "12px", background: "#fff", border: "1px solid #e4e9eb", borderRadius: "12px", padding: "8px" }}>
                    {HABILIDADES_DISPONIVEIS.filter(h => !habilidadesBNCC.includes(h)).map((hab) => (
                      <button
                        key={hab}
                        type="button"
                        style={{ display: "block", width: "100%", textAlign: "left", padding: "10px", background: "transparent", border: "none", cursor: "pointer", fontSize: "13px", color: "#30383a", borderRadius: "8px" }}
                        onClick={() => adicionarHabilidade(hab)}
                        onMouseEnter={(e) => e.target.style.background = "#f0f3f4"}
                        onMouseLeave={(e) => e.target.style.background = "transparent"}
                      >
                        {hab}
                      </button>
                    ))}
                    {HABILIDADES_DISPONIVEIS.filter(h => !habilidadesBNCC.includes(h)).length === 0 && (
                      <p style={{ fontSize: "12px", color: "#747d80", padding: "10px", margin: 0 }}>Todas as habilidades foram adicionadas.</p>
                    )}
                  </div>
                )}
              </section>
              <div className={styles.editorTip}>
                Dica: use as seções ao lado para criar uma atividade completa e
                divertida.
              </div>
            </aside>
            <div className={styles.formBottom}>
              <p>
                Os dados serão salvos localmente no modo de demonstração. Você
                decide quando publicar.
              </p>
              <button
                className={styles.primary}
                disabled={salvando}
                type="submit"
              >
                {salvando ? "Salvando atividade..." : "Salvar rascunho"}
              </button>
            </div>
          </form>
        )}
      </TeacherLayout>
    </>
  );
}
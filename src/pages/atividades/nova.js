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
  const [questoes, setQuestoes] = useState(() => [novaQuestao()]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [rascunho, setRascunho] = useState(null);
  const [publicando, setPublicando] = useState(false);

  useEffect(() => {
    if (!router.isReady) return undefined;
    let ativo = true;
    const historiaInicial =
      typeof router.query.historiaId === "string"
        ? router.query.historiaId
        : "";
    Promise.all([apiRequest("/api/turmas"), apiRequest("/api/historias")])
      .then(([turmasResponse, historiasResponse]) => {
        if (!ativo) return;
        const listaTurmas = turmasResponse?.turmas || [];
        setTurmas(listaTurmas);
        setHistorias(historiasResponse?.historias || []);
        setForm((atual) => ({
          ...atual,
          turma: atual.turma || (listaTurmas[0] ? getId(listaTurmas[0]) : ""),
          ...(historiaInicial
            ? { historiaTipo: "oficial", historiaId: historiaInicial }
            : {}),
        }));
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
  }, [router.isReady, router.query.historiaId]);

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
                <h2>Resumo da atividade</h2>
                <p className={styles.asideHint}>
                  Turma: {turmas.find((turma) => getId(turma) === form.turma)?.nome || "—"}
                </p>
                <p className={styles.asideHint}>
                  História: {form.historiaTipo === "oficial" ? "Biblioteca" : "Texto próprio"}
                </p>
                <p className={styles.asideHint}>
                  Questões: {questoes.length}
                </p>
                <p className={styles.asideHint}>
                  Recompensa: {form.recompensaMoedas || "—"} moedas
                </p>
              </section>
            </aside>
            <div className={styles.formBottom}>
              <p>
                O rascunho será salvo. Você decide quando publicar.
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
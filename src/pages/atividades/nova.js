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
  Plus,
  ShieldAlert,
  Search,
  Sparkles,
  Trash2,
  Volume2,
} from "lucide-react";
import TeacherLayout from "../../components/TeacherLayout";
import Notice from "../../components/Notice";
import { apiRequest, makeObjectId } from "../../services/api";
import { getId } from "../../services/session";
import styles from "./atividades.module.css";

const etapasMissao = [
  { id: "ler_texto", label: "Ler um texto", icon: BookOpen },
  { id: "completar_palavras", label: "Completar palavras", icon: Pencil },
  { id: "escutar_escrever", label: "Escutar e escrever", icon: Volume2 },
  { id: "identificar_sons", label: "Identificar sons", icon: CheckCircle2 },
  { id: "responder_perguntas", label: "Responder perguntas", icon: FileText },
];

function novaQuestao(atividadeExistente = false) {
  const alternativaA = makeObjectId();
  const alternativaB = makeObjectId();
  return {
    key: makeObjectId(),
    tipo: "multipla_escolha",
    enunciado: "",
    pontos: 0,
    alternativas: [
      {
        key: alternativaA,
        ...(!atividadeExistente ? { _id: alternativaA } : {}),
        texto: "",
      },
      {
        key: alternativaB,
        ...(!atividadeExistente ? { _id: alternativaB } : {}),
        texto: "",
      },
    ],
    respostaCorreta: alternativaA,
  };
}

function mapearQuestao(questao) {
  const alternativas = (questao.alternativas || []).map((alternativa) => ({
    ...(alternativa._id ? { _id: String(alternativa._id) } : {}),
    key: alternativa._id ? String(alternativa._id) : makeObjectId(),
    texto: alternativa.texto || "",
  }));
  const resposta = questao.respostasCorretas?.[0];
  const respostaCorreta =
    typeof resposta === "number"
      ? alternativas[resposta]?.key
      : alternativas.find((alternativa) => alternativa.key === String(resposta))
          ?.key;
  return {
    ...(questao._id ? { _id: String(questao._id) } : {}),
    key: questao._id ? String(questao._id) : makeObjectId(),
    tipo: questao.tipo || "multipla_escolha",
    enunciado: questao.enunciado || "",
    pontos: Number.isSafeInteger(questao.pontos) ? questao.pontos : 0,
    alternativas,
    respostaCorreta: respostaCorreta || alternativas[0]?.key || "",
  };
}

function valorDataLocal(valor) {
  const data = new Date(valor);
  if (!Number.isFinite(data.getTime())) return "";
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
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
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [rascunho, setRascunho] = useState(null);
  const [publicando, setPublicando] = useState(false);
  const [temaBncc, setTemaBncc] = useState("");
  const [habilidadesBncc, setHabilidadesBncc] = useState([]);
  const [selecionadasBncc, setSelecionadasBncc] = useState([]);
  const [buscandoBncc, setBuscandoBncc] = useState(false);
  const [erroBncc, setErroBncc] = useState("");
  const [mensagemIa, setMensagemIa] = useState(false);
  const [buscaBnccAberta, setBuscaBnccAberta] = useState(false);
  const [etapasSelecionadas, setEtapasSelecionadas] = useState([]);

  useEffect(() => {
    if (!router.isReady) return undefined;
    let ativo = true;
    const atividadeId =
      typeof router.query.id === "string" ? router.query.id : "";
    const historiaInicial =
      typeof router.query.historiaId === "string"
        ? router.query.historiaId
        : "";
    Promise.all([
      apiRequest("/api/turmas"),
      apiRequest("/api/historias"),
      atividadeId
        ? apiRequest(`/api/atividades/${encodeURIComponent(atividadeId)}`)
        : Promise.resolve(null),
    ])
      .then(([turmasResponse, historiasResponse, atividadeResponse]) => {
        if (!ativo) return;
        const listaTurmas = turmasResponse?.turmas || [];
        const atividade = atividadeResponse?.atividade;
        setTurmas(listaTurmas);
        setHistorias(historiasResponse?.historias || []);
        if (atividade) {
          const historia = atividade.historia || {};
          const turmaId =
            typeof atividade.turma === "object"
              ? getId(atividade.turma)
              : atividade.turma;
          setRascunho(atividade);
          setForm({
            turma: turmaId || "",
            titulo: atividade.titulo || "",
            historiaTipo: historia.tipo || "propria",
            historiaId: historia.historiaId ? String(historia.historiaId) : "",
            textoHistoria: historia.texto || "",
            recompensaMoedas:
              atividade.recompensaMoedas == null
                ? ""
                : String(atividade.recompensaMoedas),
            prazo: atividade.prazo ? valorDataLocal(atividade.prazo) : "",
          });
          setQuestoes((atividade.questoes || []).map(mapearQuestao));
          setEtapasSelecionadas(atividade.missao?.etapas || []);
          setSelecionadasBncc(atividade.habilidadesBncc || []);
        } else {
          setForm((atual) => ({
            ...atual,
            turma: atual.turma || (listaTurmas[0] ? getId(listaTurmas[0]) : ""),
            ...(historiaInicial
              ? { historiaTipo: "oficial", historiaId: historiaInicial }
              : {}),
          }));
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
  }, [router.isReady, router.query.historiaId, router.query.id]);

  function updateQuestion(index, changes) {
    setQuestoes((current) =>
      current.map((question, i) =>
        i === index ? { ...question, ...changes } : question,
      ),
    );
  }
  function updateAlternative(questionIndex, alternativeKey, texto) {
    setQuestoes((current) =>
      current.map((question, i) =>
        i !== questionIndex
          ? question
          : {
              ...question,
              alternativas: question.alternativas.map((alt) =>
                alt.key === alternativeKey ? { ...alt, texto } : alt,
              ),
            },
      ),
    );
  }
  function addAlternative(index) {
    const key = makeObjectId();
    setQuestoes((current) =>
      current.map((q, i) =>
        i === index
          ? {
              ...q,
              alternativas: [
                ...q.alternativas,
                {
                  key,
                  ...(!rascunho ? { _id: key } : {}),
                  texto: "",
                },
              ],
            }
          : q,
      ),
    );
  }
  function removeAlternative(index, alternativeKey) {
    setQuestoes((current) =>
      current.map((q, i) => {
        if (i !== index || q.alternativas.length <= 2) return q;
        const alternativas = q.alternativas.filter(
          (a) => a.key !== alternativeKey,
        );
        return {
          ...q,
          alternativas,
          respostaCorreta:
            q.respostaCorreta === alternativeKey
              ? alternativas[0].key
              : q.respostaCorreta,
        };
      }),
    );
  }

  async function salvar(event) {
    event?.preventDefault();
    setErro("");
    setSucesso("");
    setSalvando(true);
    try {
      const atividadeId = getId(rascunho);
      const historia =
        form.historiaTipo === "oficial"
          ? { tipo: "oficial", historiaId: form.historiaId }
          : { tipo: "propria", texto: form.textoHistoria.trim() };
      const body = {
        // A turma é definida na criação; o PUT da API rejeita esse campo.
        ...(atividadeId ? {} : { turma: form.turma }),
        titulo: form.titulo.trim(),
        recompensaMoedas: Number(form.recompensaMoedas),
        historia,
        missao: { etapas: etapasSelecionadas },
        habilidadesBncc: selecionadasBncc.map(({ codigo, texto, etapa }) => ({
          codigo,
          texto,
          etapa,
        })),
        questoes: questoes.map((q) => ({
          ...(atividadeId && q._id ? { _id: q._id } : {}),
          tipo: q.tipo,
          enunciado: q.enunciado.trim(),
          pontos: Number(q.pontos),
          alternativas: q.alternativas.map((a) => ({
            ...(a._id ? { _id: a._id } : {}),
            texto: a.texto.trim(),
          })),
          respostasCorretas: atividadeId
            ? [q.alternativas.findIndex((a) => a.key === q.respostaCorreta)]
            : [q.alternativas.find((a) => a.key === q.respostaCorreta)?._id],
        })),
        prazo: form.prazo
          ? new Date(`${form.prazo}T23:59:00`).toISOString()
          : null,
      };
      const resposta = await apiRequest(
        atividadeId
          ? `/api/atividades/${encodeURIComponent(atividadeId)}`
          : "/api/atividades",
        {
          method: atividadeId ? "PUT" : "POST",
          body,
        },
      );
      const atividadeSalva = resposta?.atividade || null;
      setRascunho(atividadeSalva);
      if (atividadeSalva) {
        setQuestoes((atividadeSalva.questoes || []).map(mapearQuestao));
      }
      setSucesso(
        atividadeId
          ? "Alterações salvas."
          : "Rascunho salvo. Você pode continuar editando ou publicar.",
      );
      return atividadeSalva;
    } catch (error) {
      setErro(error.message);
      return null;
    } finally {
      setSalvando(false);
    }
  }

  async function publicar() {
    if (!getId(rascunho) || rascunho?.status !== "rascunho") return;
    // Sempre salva antes: botões (nova questão, BNCC...) também alteram o formulário.
    const atividadeAtual = await salvar();
    if (!atividadeAtual) return;
    const id = getId(atividadeAtual);
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

  async function buscarHabilidades() {
    const tema = temaBncc.trim();
    if (!tema) return;
    setBuscandoBncc(true);
    setErroBncc("");
    try {
      const params = new URLSearchParams({ tema, limite: "10" });
      const resultado = await apiRequest(`/api/bncc/busca?${params}`);
      setHabilidadesBncc(resultado?.itens || []);
    } catch (error) {
      setErroBncc(error.message);
      setHabilidadesBncc([]);
    } finally {
      setBuscandoBncc(false);
    }
  }

  function alternarHabilidade(item) {
    setSelecionadasBncc((atuais) =>
      atuais.some((selecionada) => selecionada.codigo === item.codigo)
        ? atuais.filter((selecionada) => selecionada.codigo !== item.codigo)
        : [...atuais, item],
    );
  }

  function alternarEtapa(etapa) {
    setEtapasSelecionadas((atuais) =>
      atuais.includes(etapa)
        ? atuais.filter((item) => item !== etapa)
        : [...atuais, etapa],
    );
  }

  const pontuacaoTotalCalculada = questoes.reduce(
    (total, questao) =>
      total + (Number.isSafeInteger(questao.pontos) ? questao.pontos : 0),
    0,
  );
  const pontuacaoTotal = Number.isSafeInteger(pontuacaoTotalCalculada)
    ? pontuacaoTotalCalculada
    : "—";

  return (
    <>
      <Head>
        <title>
          {rascunho ? "Editar Atividade | Zooly" : "Nova Atividade | Zooly"}
        </title>
      </Head>
      <TeacherLayout>
        <div className={styles.editorHeader}>
          <Link href="/atividades" aria-label="Voltar para atividades">
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
          <h1>{rascunho ? "Editar Atividade" : "Nova Atividade"}</h1>
        </div>
        {erro ? <Notice kind="error">{erro}</Notice> : null}
        {sucesso ? <Notice kind="success">{sucesso}</Notice> : null}
        {rascunho?.status === "publicada" ? (
          <Notice kind="info">
            Esta atividade já está publicada. Trocar ou remover questões pode
            afetar o progresso e os relatórios de alunos que já responderam.
          </Notice>
        ) : null}
        {loading ? (
          <p className={styles.loading}>Carregando turmas e histórias...</p>
        ) : !turmas.length ? (
          <Notice kind="info">
            Você precisa ter uma turma ativa vinculada à sua conta antes de
            criar uma atividade. Verifique a área de turmas e o vínculo com a
            escola.
          </Notice>
        ) : (
          <form className={styles.activityForm} onSubmit={salvar}>
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
                  <input
                    required
                    value={form.titulo}
                    onChange={(e) =>
                      setForm({ ...form, titulo: e.target.value })
                    }
                    placeholder="Digite o nome da atividade"
                  />
                </label>
                <label>
                  Ano letivo da turma
                  <input
                    value={
                      turmas.find((turma) => getId(turma) === form.turma)
                        ?.anoEscolar || ""
                    }
                    readOnly
                    placeholder="Não informado pela API"
                  />
                </label>
                <label>
                  Turma
                  <select
                    required
                    value={form.turma}
                    disabled={Boolean(rascunho)}
                    title={
                      rascunho
                        ? "A turma não pode ser alterada depois da criação."
                        : undefined
                    }
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
                  Prazo (opcional)
                  <input
                    type="date"
                    value={form.prazo}
                    onChange={(e) =>
                      setForm({ ...form, prazo: e.target.value })
                    }
                  />
                </label>
                <label>
                  <span className={styles.fieldLabel}>
                    <Clock3 size={14} aria-hidden="true" />
                    Duração estimada
                  </span>
                  <input value="Não disponível na API" readOnly disabled />
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
                  <span className={styles.characterCount}>
                    {form.textoHistoria.length} caracteres
                  </span>
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
            <section className={`${styles.formPanel} ${styles.questionsPanel}`}>
              <div className={styles.questionHeader}>
                <div>
                  <h2>Questões da Atividade</h2>
                  <p>
                    Adicione pelo menos duas alternativas e marque a correta.
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() =>
                    setQuestoes((current) => [
                      ...current,
                      novaQuestao(Boolean(rascunho)),
                    ])
                  }
                >
                  <Plus size={16} aria-hidden="true" />
                  Nova questão
                </button>
              </div>
              <button
                type="button"
                className={styles.aiButton}
                onClick={() => setMensagemIa(true)}
              >
                <Sparkles size={15} aria-hidden="true" /> Criar com IA
              </button>
              {mensagemIa ? (
                <p className={styles.integrationNote} role="status">
                  A geração por IA ainda não está disponível. Crie as questões
                  manualmente.
                </p>
              ) : null}
              {questoes.map((q, index) => (
                <article className={styles.editorQuestionCard} key={q.key}>
                  <div className={styles.questionTitle}>
                    <span className={styles.questionNumber}>{index + 1}</span>
                    <div className={styles.questionMeta}>
                      <strong>Questão {index + 1}</strong>
                      <span>Tipo: Múltipla escolha</span>
                    </div>
                    <div className={styles.questionActions}>
                      <button
                        type="button"
                        aria-label={`Editar questão ${index + 1}`}
                        title="Editar enunciado"
                        onClick={() =>
                          document.getElementById(`enunciado-${q.key}`)?.focus()
                        }
                      >
                        <Pencil size={15} aria-hidden="true" />
                      </button>
                      {questoes.length > 1 ? (
                        <button
                          type="button"
                          className={styles.deleteQuestion}
                          aria-label={`Excluir questão ${index + 1}`}
                          title="Excluir questão"
                          onClick={() =>
                            setQuestoes((current) =>
                              current.filter((_, i) => i !== index),
                            )
                          }
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <label className={styles.fullField}>
                    Enunciado
                    <input
                      id={`enunciado-${q.key}`}
                      required
                      value={q.enunciado}
                      onChange={(e) =>
                        updateQuestion(index, { enunciado: e.target.value })
                      }
                      placeholder="Digite a pergunta"
                    />
                  </label>
                  <label className={styles.pointsField}>
                    Pontos da questão
                    <input
                      type="number"
                      min="0"
                      max={Number.MAX_SAFE_INTEGER}
                      step="1"
                      required
                      value={q.pontos}
                      onChange={(event) =>
                        updateQuestion(index, {
                          pontos:
                            event.target.value === ""
                              ? ""
                              : Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <div className={styles.alternatives}>
                    {q.alternativas.map((alt, altIndex) => (
                      <div className={styles.alternative} key={alt.key}>
                        <label>
                          <input
                            type="radio"
                            name={`correct-${q.key}`}
                            checked={q.respostaCorreta === alt.key}
                            onChange={() =>
                              updateQuestion(index, {
                                respostaCorreta: alt.key,
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
                            updateAlternative(index, alt.key, e.target.value)
                          }
                          placeholder={`Alternativa ${String.fromCharCode(65 + altIndex)}`}
                        />
                        {q.alternativas.length > 2 ? (
                          <button
                            type="button"
                            onClick={() => removeAlternative(index, alt.key)}
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
                    <Plus size={14} aria-hidden="true" />
                    Adicionar alternativa
                  </button>
                </article>
              ))}
            </section>
            <aside className={styles.editorAside}>
              <section className={styles.asideCard}>
                <h2>
                  <CheckCircle2 size={17} aria-hidden="true" />
                  Missão do Aluno
                </h2>
                <p className={styles.asideDescription}>O aluno irá realizar:</p>
                <div className={styles.missionOptions}>
                  {etapasMissao.map(({ id, label, icon: Icon }) => (
                    <label
                      key={id}
                      className={
                        etapasSelecionadas.includes(id)
                          ? styles.missionSelected
                          : ""
                      }
                    >
                      <input
                        type="checkbox"
                        checked={etapasSelecionadas.includes(id)}
                        onChange={() => alternarEtapa(id)}
                      />
                      <Icon size={15} aria-hidden="true" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </section>
              <section className={styles.asideCard}>
                <h2>
                  <ShieldAlert size={17} aria-hidden="true" />
                  BNCC
                </h2>
                {selecionadasBncc.length ? (
                  <ul
                    className={styles.bnccSelected}
                    aria-label="Habilidades selecionadas"
                  >
                    {selecionadasBncc.map((item) => (
                      <li key={item.codigo} title={item.texto}>
                        <strong>{item.codigo}</strong>
                        <button
                          type="button"
                          onClick={() => alternarHabilidade(item)}
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.asideDescription}>
                    Nenhuma habilidade selecionada.
                  </p>
                )}
                <button
                  type="button"
                  className={styles.unavailableButton}
                  onClick={() => setBuscaBnccAberta((aberta) => !aberta)}
                  aria-expanded={buscaBnccAberta}
                >
                  <Plus size={14} aria-hidden="true" />
                  {buscaBnccAberta ? "Fechar busca" : "Adicionar habilidade"}
                </button>
                {buscaBnccAberta ? (
                  <>
                    <div className={styles.bnccSearch}>
                      <label className={styles.srOnly} htmlFor="bncc-tema">
                        Tema da habilidade
                      </label>
                      <input
                        id="bncc-tema"
                        value={temaBncc}
                        onChange={(event) => setTemaBncc(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            buscarHabilidades();
                          }
                        }}
                        placeholder="Pesquisar habilidades"
                        maxLength={100}
                      />
                      <button
                        type="button"
                        onClick={buscarHabilidades}
                        disabled={buscandoBncc || !temaBncc.trim()}
                      >
                        <Search size={14} aria-hidden="true" />
                        {buscandoBncc ? "Buscando" : "Buscar"}
                      </button>
                    </div>
                    {erroBncc ? (
                      <p className={styles.bnccError} role="alert">
                        {erroBncc}
                      </p>
                    ) : null}
                    {habilidadesBncc.length ? (
                      <ul
                        className={styles.bnccResults}
                        aria-label="Resultados da BNCC"
                      >
                        {habilidadesBncc.map((item) => {
                          const marcada = selecionadasBncc.some(
                            (selecionada) => selecionada.codigo === item.codigo,
                          );
                          return (
                            <li key={item.codigo}>
                              <label>
                                <input
                                  type="checkbox"
                                  checked={marcada}
                                  onChange={() => alternarHabilidade(item)}
                                />
                                <span>
                                  <strong>{item.codigo}</strong>
                                  {item.texto}
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    ) : temaBncc.trim() && !buscandoBncc && !erroBncc ? (
                      <p className={styles.asideDescription}>
                        Nenhuma habilidade encontrada para esta busca.
                      </p>
                    ) : null}
                  </>
                ) : null}
              </section>
              <section className={`${styles.asideCard} ${styles.rewardCard}`}>
                <h2>Recompensa</h2>
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
                <div className={styles.rewardTotal}>
                  <span>Pontuação total</span>
                  <strong>{pontuacaoTotal} pts</strong>
                </div>
                <p className={styles.rewardCaption}>
                  Recompensa em moedas: {form.recompensaMoedas || "—"}
                </p>
              </section>
            </aside>
            <footer className={styles.formBottom}>
              <Link href="/atividades" className={styles.cancel}>
                Cancelar
              </Link>
              {rascunho?.status === "rascunho" ? (
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={publicar}
                  disabled={publicando || salvando}
                >
                  {publicando ? "Publicando..." : "Publicar atividade"}
                </button>
              ) : null}
              <button
                className={styles.primary}
                disabled={salvando}
                type="submit"
              >
                {salvando
                  ? "Salvando..."
                  : rascunho
                    ? "Salvar alterações"
                    : "Salvar Atividade"}
              </button>
            </footer>
          </form>
        )}
      </TeacherLayout>
    </>
  );
}

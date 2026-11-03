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
  Library,
  Lightbulb,
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
import ConfirmDialog from "../../components/ConfirmDialog";
import { apiRequest } from "../../services/api";
import { historiasApi } from "../../services/historiasApi";
import {
  anexarApoio,
  montarCorpoAtividade,
  novoId,
  preservarApoio,
  questaoPreenchida,
  questoesDoModelo,
} from "../../utils/historias";
import { getId } from "../../utils/formatacao";
import styles from "./atividades.module.css";

const etapasMissao = [
  { id: "ler_texto", label: "Ler um texto", icon: BookOpen },
  { id: "completar_palavras", label: "Completar palavras", icon: Pencil },
  { id: "escutar_escrever", label: "Escutar e escrever", icon: Volume2 },
  { id: "identificar_sons", label: "Identificar sons", icon: CheckCircle2 },
  { id: "responder_perguntas", label: "Responder perguntas", icon: FileText },
];

// Numa atividade já salva, alternativas novas vão sem _id: o PUT da API só aceita ids da atividade.
function novaAlternativa(atividadeExistente) {
  const key = novoId();
  return { key, ...(!atividadeExistente ? { _id: key } : {}), texto: "" };
}

function novaQuestao(atividadeExistente = false) {
  const alternativas = [
    novaAlternativa(atividadeExistente),
    novaAlternativa(atividadeExistente),
  ];
  return {
    key: novoId(),
    tipo: "multipla_escolha",
    enunciado: "",
    pontos: 0,
    alternativas,
    respostaCorreta: alternativas[0].key,
  };
}

function mapearQuestao(questao) {
  const alternativas = (questao.alternativas || []).map((alternativa) => ({
    ...(alternativa._id ? { _id: String(alternativa._id) } : {}),
    key: alternativa._id ? String(alternativa._id) : novoId(),
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
    key: questao._id ? String(questao._id) : novoId(),
    tipo: questao.tipo || "multipla_escolha",
    enunciado: questao.enunciado || "",
    pontos: Number.isSafeInteger(questao.pontos) ? questao.pontos : 0,
    alternativas,
    respostaCorreta: respostaCorreta || alternativas[0]?.key || "",
  };
}

/**
 * Busca o conteúdo pronto de uma história do banco (GET /api/historias/:id/modelo-atividade)
 * já no formato do formulário. Numa atividade já salva, as alternativas novas vão sem _id,
 * porque o PUT da API só aceita ids que já pertencem à atividade.
 */
async function conteudoDoBanco(historiaId, atividadeExistente) {
  const resposta = await historiasApi.modeloAtividade(historiaId);
  const { modelo, apoioPedagogico } = resposta ?? {};
  let questoes = questoesDoModelo(modelo, apoioPedagogico);
  if (atividadeExistente) {
    questoes = questoes.map((questao) => ({
      ...questao,
      alternativas: questao.alternativas.map(({ key, texto }) => ({
        key,
        texto,
      })),
    }));
  }
  return {
    titulo: modelo?.titulo ?? "",
    texto: modelo?.historia?.texto ?? "",
    bancoHistoriaId: String(modelo?.historia?.bancoHistoriaId ?? historiaId),
    questoes,
    apoio: apoioPedagogico ?? null,
  };
}

// Campos do formulário preenchidos com uma história do banco (cópia editável).
function camposDoBanco(conteudo) {
  return {
    titulo: conteudo.titulo,
    historiaTipo: "propria",
    historiaId: "",
    textoHistoria: conteudo.texto,
    bancoHistoriaId: conteudo.bancoHistoriaId,
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
    bancoHistoriaId: "",
    recompensaMoedas: "10",
    prazo: "",
  });
  // "escrever": texto próprio; "banco": conteúdo copiado do Banco de Histórias.
  const [origemHistoria, setOrigemHistoria] = useState("escrever");
  const [historiaEscolhida, setHistoriaEscolhida] = useState("");
  const [apoioHistoria, setApoioHistoria] = useState(null);
  const [carregandoModelo, setCarregandoModelo] = useState(false);
  const [substituirPor, setSubstituirPor] = useState("");
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
      !atividadeId && historiaInicial
        ? conteudoDoBanco(historiaInicial, false)
        : Promise.resolve(null),
    ])
      .then(
        async ([
          turmasResponse,
          historiasResponse,
          atividadeResponse,
          conteudoInicial,
        ]) => {
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
            const origemBanco = historia.bancoHistoriaId
              ? String(historia.bancoHistoriaId)
              : historia.tipo === "oficial" && historia.historiaId
                ? String(historia.historiaId)
                : "";
            setRascunho(atividade);
            setForm({
              turma: turmaId || "",
              titulo: atividade.titulo || "",
              historiaTipo: historia.tipo || "propria",
              historiaId: historia.historiaId
                ? String(historia.historiaId)
                : "",
              textoHistoria: historia.texto || historia.textoCopia || "",
              bancoHistoriaId: historia.bancoHistoriaId
                ? String(historia.bancoHistoriaId)
                : "",
              recompensaMoedas:
                atividade.recompensaMoedas == null
                  ? ""
                  : String(atividade.recompensaMoedas),
              prazo: atividade.prazo ? valorDataLocal(atividade.prazo) : "",
            });
            const questoesAtividade = (atividade.questoes || []).map(
              mapearQuestao,
            );
            setQuestoes(questoesAtividade);
            setEtapasSelecionadas(atividade.missao?.etapas || []);
            setSelecionadasBncc(atividade.habilidadesBncc || []);
            if (origemBanco) {
              setOrigemHistoria("banco");
              setHistoriaEscolhida(origemBanco);
              // Feedback e objetivos não ficam na atividade: vêm da história de origem,
              // se ela ainda existir. Sem ela, a atividade continua igual.
              try {
                const { perguntas } = await historiasApi.perguntas(origemBanco);
                if (ativo)
                  setQuestoes((atuais) => anexarApoio(atuais, perguntas));
              } catch {
                // História excluída ou indisponível: nada a anexar.
              }
            }
          } else {
            setForm((atual) => ({
              ...atual,
              turma:
                atual.turma || (listaTurmas[0] ? getId(listaTurmas[0]) : ""),
              ...(conteudoInicial ? camposDoBanco(conteudoInicial) : {}),
            }));
            if (conteudoInicial) {
              setOrigemHistoria("banco");
              setHistoriaEscolhida(conteudoInicial.bancoHistoriaId);
              setQuestoes(conteudoInicial.questoes);
              setApoioHistoria(conteudoInicial.apoio);
            }
          }
        },
      )
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

  // Aplica `alterar` só na questão da posição `index`.
  function alterarQuestao(index, alterar) {
    setQuestoes((atuais) =>
      atuais.map((questao, i) => (i === index ? alterar(questao) : questao)),
    );
  }
  function mudarQuestao(index, mudancas) {
    alterarQuestao(index, (questao) => ({ ...questao, ...mudancas }));
  }
  function alterarAlternativa(index, chave, texto) {
    alterarQuestao(index, (questao) => ({
      ...questao,
      alternativas: questao.alternativas.map((alt) =>
        alt.key === chave ? { ...alt, texto } : alt,
      ),
    }));
  }
  function adicionarAlternativa(index) {
    const alternativa = novaAlternativa(Boolean(rascunho));
    alterarQuestao(index, (questao) => ({
      ...questao,
      alternativas: [...questao.alternativas, alternativa],
    }));
  }
  function removerAlternativa(index, chave) {
    alterarQuestao(index, (questao) => {
      if (questao.alternativas.length <= 2) return questao;
      const alternativas = questao.alternativas.filter((a) => a.key !== chave);
      return {
        ...questao,
        alternativas,
        respostaCorreta:
          questao.respostaCorreta === chave
            ? alternativas[0].key
            : questao.respostaCorreta,
      };
    });
  }

  async function carregarModelo(historiaId) {
    setSubstituirPor("");
    setErro("");
    setSucesso("");
    setCarregandoModelo(true);
    try {
      const conteudo = await conteudoDoBanco(historiaId, Boolean(rascunho));
      setForm((atual) => ({ ...atual, ...camposDoBanco(conteudo) }));
      setQuestoes(conteudo.questoes);
      setApoioHistoria(conteudo.apoio);
      setOrigemHistoria("banco");
      setSucesso(
        "História e perguntas carregadas. Tudo pode ser editado antes de salvar: a atividade guarda uma cópia própria.",
      );
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregandoModelo(false);
    }
  }

  // Confirma antes de trocar um conteúdo que o professor já digitou.
  function pedirModelo(historiaId) {
    if (!historiaId) return;
    const temConteudo =
      form.titulo.trim() ||
      form.textoHistoria.trim() ||
      questoes.some(questaoPreenchida);
    if (temConteudo) setSubstituirPor(historiaId);
    else carregarModelo(historiaId);
  }

  function escolherOrigem(origem) {
    setOrigemHistoria(origem);
    if (origem === "escrever") {
      // Texto próprio: mantém o que já foi digitado, mas deixa de apontar para o banco.
      setForm((atual) => ({
        ...atual,
        historiaTipo: "propria",
        historiaId: "",
        bancoHistoriaId: "",
      }));
      setApoioHistoria(null);
    }
  }

  // Atividade antiga que usa a história por referência: passa a ter o texto editável.
  function editarTextoDaReferencia() {
    setForm((atual) => ({
      ...atual,
      historiaTipo: "propria",
      bancoHistoriaId: atual.historiaId,
      historiaId: "",
    }));
  }

  async function salvar(event) {
    event?.preventDefault();
    setErro("");
    setSucesso("");
    if (
      origemHistoria === "banco" &&
      form.historiaTipo !== "oficial" &&
      !form.bancoHistoriaId
    ) {
      setErro(
        "Escolha uma história do banco e clique em “Carregar história e perguntas”, ou escreva uma história própria.",
      );
      return null;
    }
    setSalvando(true);
    try {
      const atividadeId = getId(rascunho);
      const body = montarCorpoAtividade({
        form,
        questoes,
        etapas: etapasSelecionadas,
        habilidades: selecionadasBncc,
        atividadeId,
      });
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
        // O apoio pedagógico (feedback e objetivo) não é salvo na atividade: só na tela.
        setQuestoes((anteriores) =>
          preservarApoio(
            anteriores,
            (atividadeSalva.questoes || []).map(mapearQuestao),
          ),
        );
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
                    name="origemHistoria"
                    checked={origemHistoria === "escrever"}
                    onChange={() => escolherOrigem("escrever")}
                  />{" "}
                  Escrever uma história
                </label>
                <label>
                  <input
                    type="radio"
                    name="origemHistoria"
                    checked={origemHistoria === "banco"}
                    onChange={() => escolherOrigem("banco")}
                  />{" "}
                  Usar o Banco de Histórias
                </label>
              </div>
              {origemHistoria === "banco" &&
              form.historiaTipo !== "oficial" ? (
                <div className={styles.bankPicker}>
                  <label className={styles.fullField}>
                    História do banco
                    <select
                      value={historiaEscolhida}
                      onChange={(e) => setHistoriaEscolhida(e.target.value)}
                    >
                      <option value="">Selecione uma história</option>
                      {historias.map((h) => (
                        <option value={getId(h)} key={getId(h)}>
                          {h.titulo}
                          {h.origem === "professor" ? " (minha)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => pedirModelo(historiaEscolhida)}
                    disabled={!historiaEscolhida || carregandoModelo}
                  >
                    <Library size={15} aria-hidden="true" />
                    {carregandoModelo
                      ? "Carregando..."
                      : "Carregar história e perguntas"}
                  </button>
                  <small>
                    O texto e as perguntas são copiados para esta atividade e
                    podem ser editados. Mudanças futuras na história não alteram
                    a atividade.{" "}
                    <Link href="/historias">Abrir o Banco de Histórias</Link>
                  </small>
                </div>
              ) : null}
              {form.historiaTipo === "oficial" ? (
                <div className={styles.fullField}>
                  <Notice kind="info">
                    Esta atividade usa uma história do banco por referência. O
                    texto abaixo é a cópia salva na atividade, que é o que os
                    alunos leem.
                  </Notice>
                  <p className={styles.referenceText}>
                    {form.textoHistoria ||
                      "A cópia será criada pela API ao salvar a atividade."}
                  </p>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={editarTextoDaReferencia}
                  >
                    <Pencil size={14} aria-hidden="true" />
                    Editar o texto nesta atividade
                  </button>
                </div>
              ) : origemHistoria === "escrever" || form.bancoHistoriaId ? (
                <label className={styles.fullField}>
                  Texto da história
                  <textarea
                    rows={origemHistoria === "banco" ? 12 : 5}
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
              ) : null}
              {origemHistoria === "banco" && apoioHistoria ? (
                <aside
                  className={styles.pedagogicSupport}
                  aria-label="Apoio pedagógico da história"
                >
                  <strong>
                    <Lightbulb size={15} aria-hidden="true" />
                    Apoio pedagógico · {apoioHistoria.tituloHistoria}
                  </strong>
                  {apoioHistoria.objetivosPedagogicos?.length ? (
                    <ul>
                      {apoioHistoria.objetivosPedagogicos.map((objetivo) => (
                        <li key={objetivo}>{objetivo}</li>
                      ))}
                    </ul>
                  ) : null}
                  {apoioHistoria.nota ? <p>{apoioHistoria.nota}</p> : null}
                </aside>
              ) : null}
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
                        mudarQuestao(index, { enunciado: e.target.value })
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
                        mudarQuestao(index, {
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
                              mudarQuestao(index, {
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
                            alterarAlternativa(index, alt.key, e.target.value)
                          }
                          placeholder={`Alternativa ${String.fromCharCode(65 + altIndex)}`}
                        />
                        {q.alternativas.length > 2 ? (
                          <button
                            type="button"
                            onClick={() => removerAlternativa(index, alt.key)}
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
                    onClick={() => adicionarAlternativa(index)}
                  >
                    <Plus size={14} aria-hidden="true" />
                    Adicionar alternativa
                  </button>
                  {q.apoio?.feedback || q.apoio?.objetivoPedagogico ? (
                    <aside
                      className={styles.pedagogicSupport}
                      aria-label={`Apoio pedagógico da questão ${index + 1}`}
                    >
                      <strong>
                        <Lightbulb size={15} aria-hidden="true" />
                        Apoio pedagógico (só para você, não vai para o aluno)
                      </strong>
                      {q.apoio.objetivoPedagogico ? (
                        <p>
                          <b>Objetivo:</b> {q.apoio.objetivoPedagogico}
                        </p>
                      ) : null}
                      {q.apoio.feedback ? (
                        <p>
                          <b>Feedback:</b> {q.apoio.feedback}
                        </p>
                      ) : null}
                    </aside>
                  ) : null}
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
        <ConfirmDialog
          aberto={Boolean(substituirPor)}
          titulo="Substituir o conteúdo?"
          mensagem="O título, o texto e as questões que você já preencheu serão trocados pelos da história escolhida."
          confirmar="Substituir"
          onCancelar={() => setSubstituirPor("")}
          onConfirmar={() => carregarModelo(substituirPor)}
        />
      </TeacherLayout>
    </>
  );
}

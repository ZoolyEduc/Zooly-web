import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import TeacherLayout from "../../components/TeacherLayout";
import Notice from "../../components/Notice";
import HistoriaPreview from "../../components/HistoriaPreview";
import { historiasApi } from "../../services/historiasApi";
import {
  LIMITES,
  errosDaPergunta,
  errosPorCampo,
  formularioParaCorpo,
  formularioVazio,
  historiaParaFormulario,
  novaAlternativaForm,
  novaPerguntaForm,
} from "../../utils/historias";
import { getId } from "../../utils/formatacao";
import styles from "./historias.module.css";

const idades = Array.from(
  { length: LIMITES.idadeMax - LIMITES.idadeMin + 1 },
  (_, i) => LIMITES.idadeMin + i,
);

function ErroCampo({ mensagens }) {
  if (!mensagens?.length) return null;
  return (
    <p className={styles.fieldError} role="alert">
      {mensagens.join(" ")}
    </p>
  );
}

export default function FormularioHistoria() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const [form, setForm] = useState(formularioVazio);
  const [carregando, setCarregando] = useState(true);
  const [bloqueada, setBloqueada] = useState(false);
  const [erro, setErro] = useState("");
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [previa, setPrevia] = useState(false);

  useEffect(() => {
    if (!router.isReady) return undefined;
    let ativo = true;
    if (!id) {
      Promise.resolve().then(() => {
        if (ativo) setCarregando(false);
      });
      return () => {
        ativo = false;
      };
    }
    historiasApi
      .obter(id)
      .then((resposta) => {
        if (!ativo) return;
        const historia = resposta?.historia;
        if (!historia?.editavel) {
          // A API também recusaria; a tela só evita um formulário inútil.
          setBloqueada(true);
          return;
        }
        setForm(historiaParaFormulario(historia));
      })
      .catch((error) => {
        if (ativo) setErro(error.message);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [router.isReady, id]);

  const corpo = useMemo(() => formularioParaCorpo(form), [form]);

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }
  function alterarPergunta(indice, mudancas) {
    setForm((atual) => ({
      ...atual,
      perguntas: atual.perguntas.map((pergunta, i) =>
        i === indice ? { ...pergunta, ...mudancas } : pergunta,
      ),
    }));
  }
  function alterarAlternativa(indice, key, texto) {
    setForm((atual) => ({
      ...atual,
      perguntas: atual.perguntas.map((pergunta, i) =>
        i !== indice
          ? pergunta
          : {
              ...pergunta,
              alternativas: pergunta.alternativas.map((alternativa) =>
                alternativa.key === key
                  ? { ...alternativa, texto }
                  : alternativa,
              ),
            },
      ),
    }));
  }
  function adicionarAlternativa(indice) {
    setForm((atual) => ({
      ...atual,
      perguntas: atual.perguntas.map((pergunta, i) =>
        i === indice && pergunta.alternativas.length < LIMITES.alternativasMax
          ? {
              ...pergunta,
              alternativas: [...pergunta.alternativas, novaAlternativaForm()],
            }
          : pergunta,
      ),
    }));
  }
  function removerAlternativa(indice, key) {
    setForm((atual) => ({
      ...atual,
      perguntas: atual.perguntas.map((pergunta, i) => {
        if (
          i !== indice ||
          pergunta.alternativas.length <= LIMITES.alternativasMin
        )
          return pergunta;
        const alternativas = pergunta.alternativas.filter((a) => a.key !== key);
        return {
          ...pergunta,
          alternativas,
          correta:
            pergunta.correta === key ? alternativas[0].key : pergunta.correta,
        };
      }),
    }));
  }

  async function salvar(event) {
    event.preventDefault();
    setErro("");
    setErros({});
    setSalvando(true);
    try {
      // A API valida tudo de novo ao salvar; a validação prévia só melhora as mensagens.
      const validacao = await historiasApi.validar(corpo);
      if (!validacao?.valida) {
        setErros(errosPorCampo(validacao?.erros));
        setErro("Revise os campos destacados antes de salvar.");
        return;
      }
      const resposta = id
        ? await historiasApi.atualizar(id, corpo)
        : await historiasApi.criar(corpo);
      await router.push(
        `/historias/${encodeURIComponent(getId(resposta.historia))}?salva=1`,
      );
    } catch (error) {
      setErros(errosPorCampo(error.dados?.erros));
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  const titulo = id ? "Editar história" : "Nova história";

  return (
    <>
      <Head>
        <title>{`${titulo} | Zooly`}</title>
      </Head>
      <TeacherLayout>
        <Link
          href={id ? `/historias/${encodeURIComponent(id)}` : "/historias"}
          className={styles.back}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {id ? "Voltar para a história" : "Banco de Histórias"}
        </Link>
        <div className={styles.detailHeader}>
          <div>
            <h1>{titulo}</h1>
            <p className={styles.description}>
              Só você vê e usa as histórias que cadastrar. Os alunos recebem o
              texto e as perguntas apenas pelas atividades.
            </p>
          </div>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => setPrevia((aberta) => !aberta)}
            aria-expanded={previa}
            disabled={carregando || bloqueada}
          >
            {previa ? (
              <EyeOff size={15} aria-hidden="true" />
            ) : (
              <Eye size={15} aria-hidden="true" />
            )}
            {previa ? "Fechar pré-visualização" : "Pré-visualizar"}
          </button>
        </div>
        {erro ? <Notice kind="error">{erro}</Notice> : null}
        {carregando ? (
          <p className={styles.loading} role="status">
            Carregando história...
          </p>
        ) : bloqueada ? (
          <Notice kind="info">
            Esta história é do Zooly (ou de outra conta) e não pode ser editada.{" "}
            <Link href="/historias">Voltar ao Banco de Histórias</Link>
          </Notice>
        ) : (
          <form className={styles.form} onSubmit={salvar}>
            {previa ? (
              <section
                className={`${styles.panel} ${styles.preview}`}
                aria-label="Pré-visualização"
              >
                <h2>{corpo.titulo || "História sem título"}</h2>
                {corpo.descricao ? (
                  <p className={styles.description}>{corpo.descricao}</p>
                ) : null}
                <HistoriaPreview historia={corpo} />
              </section>
            ) : null}

            <section className={styles.panel}>
              <h2>Dados da história</h2>
              <div className={styles.formGrid}>
                <label className={`${styles.field} ${styles.full}`}>
                  Título
                  <input
                    required
                    maxLength={LIMITES.titulo}
                    value={form.titulo}
                    onChange={(e) => alterar("titulo", e.target.value)}
                  />
                  <ErroCampo mensagens={erros.titulo} />
                </label>
                <label className={`${styles.field} ${styles.full}`}>
                  Descrição
                  <input
                    maxLength={LIMITES.descricao}
                    value={form.descricao}
                    onChange={(e) => alterar("descricao", e.target.value)}
                    placeholder="Um resumo curto para encontrar a história depois"
                  />
                  <ErroCampo mensagens={erros.descricao} />
                </label>
                <label className={styles.field}>
                  Tema ou categoria
                  <input
                    maxLength={LIMITES.tema}
                    value={form.tema}
                    onChange={(e) => alterar("tema", e.target.value)}
                    placeholder="Ex.: Animais do mar"
                  />
                  <ErroCampo mensagens={erros.tema} />
                </label>
                <div className={styles.field}>
                  Faixa etária
                  <div className={styles.inline}>
                    <select
                      aria-label="Idade mínima"
                      value={form.faixaMinima}
                      onChange={(e) =>
                        alterar("faixaMinima", Number(e.target.value))
                      }
                    >
                      {idades.map((idade) => (
                        <option key={idade} value={idade}>
                          {idade} anos
                        </option>
                      ))}
                    </select>
                    <span>a</span>
                    <select
                      aria-label="Idade máxima"
                      value={form.faixaMaxima}
                      onChange={(e) =>
                        alterar("faixaMaxima", Number(e.target.value))
                      }
                    >
                      {idades.map((idade) => (
                        <option key={idade} value={idade}>
                          {idade} anos
                        </option>
                      ))}
                    </select>
                  </div>
                  <ErroCampo mensagens={erros.faixaEtaria} />
                </div>
                <label className={`${styles.field} ${styles.full}`}>
                  Texto da história
                  <textarea
                    required
                    rows={10}
                    maxLength={LIMITES.conteudo}
                    value={form.conteudo}
                    onChange={(e) => alterar("conteudo", e.target.value)}
                  />
                  <span className={styles.hint}>
                    {form.conteudo.length}/{LIMITES.conteudo} caracteres
                  </span>
                  <ErroCampo mensagens={erros.conteudo} />
                </label>
                <div className={`${styles.field} ${styles.full}`}>
                  Objetivos pedagógicos
                  {form.objetivos.map((objetivo, indice) => (
                    <div className={styles.inline} key={indice}>
                      <input
                        aria-label={`Objetivo ${indice + 1}`}
                        value={objetivo}
                        onChange={(e) =>
                          alterar(
                            "objetivos",
                            form.objetivos.map((item, i) =>
                              i === indice ? e.target.value : item,
                            ),
                          )
                        }
                      />
                      {form.objetivos.length > 1 ? (
                        <button
                          type="button"
                          className={styles.iconButton}
                          aria-label={`Remover objetivo ${indice + 1}`}
                          onClick={() =>
                            alterar(
                              "objetivos",
                              form.objetivos.filter((_, i) => i !== indice),
                            )
                          }
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                  {form.objetivos.length < LIMITES.objetivos ? (
                    <button
                      type="button"
                      className={styles.secondary}
                      onClick={() =>
                        alterar("objetivos", [...form.objetivos, ""])
                      }
                    >
                      <Plus size={14} aria-hidden="true" />
                      Adicionar objetivo
                    </button>
                  ) : null}
                  <ErroCampo
                    mensagens={Object.entries(erros)
                      .filter(([campo]) =>
                        campo.startsWith("objetivosPedagogicos"),
                      )
                      .flatMap(([, mensagens]) => mensagens)}
                  />
                </div>
                <label className={`${styles.field} ${styles.full}`}>
                  Nota ou créditos (opcional)
                  <input
                    maxLength={LIMITES.nota}
                    value={form.nota}
                    onChange={(e) => alterar("nota", e.target.value)}
                    placeholder="Ex.: Adaptação de uma lenda contada na região"
                  />
                </label>
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.questionEditorTop}>
                <h2>Perguntas ({form.perguntas.length})</h2>
                {form.perguntas.length < LIMITES.perguntas ? (
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() =>
                      alterar("perguntas", [
                        ...form.perguntas,
                        novaPerguntaForm(),
                      ])
                    }
                  >
                    <Plus size={14} aria-hidden="true" />
                    Nova pergunta
                  </button>
                ) : null}
              </div>
              <p className={styles.hint}>
                Marque a alternativa correta de cada pergunta. O feedback é a
                explicação para depois da resposta.
              </p>
              <ErroCampo mensagens={erros.perguntas} />
              {form.perguntas.map((pergunta, indice) => (
                <fieldset
                  className={styles.questionEditor}
                  key={pergunta.key}
                  aria-label={`Pergunta ${indice + 1}`}
                >
                  <div className={styles.questionEditorTop}>
                    <strong>Pergunta {indice + 1}</strong>
                    <button
                      type="button"
                      className={styles.danger}
                      onClick={() =>
                        alterar(
                          "perguntas",
                          form.perguntas.filter((_, i) => i !== indice),
                        )
                      }
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      Remover pergunta
                    </button>
                  </div>
                  <label className={styles.field}>
                    Enunciado
                    <input
                      required
                      value={pergunta.enunciado}
                      onChange={(e) =>
                        alterarPergunta(indice, { enunciado: e.target.value })
                      }
                    />
                  </label>
                  <div className={styles.field}>
                    Alternativas
                    {pergunta.alternativas.map((alternativa, i) => (
                      <div
                        className={styles.alternativeRow}
                        key={alternativa.key}
                      >
                        <label>
                          <input
                            type="radio"
                            name={`correta-${pergunta.key}`}
                            checked={pergunta.correta === alternativa.key}
                            onChange={() =>
                              alterarPergunta(indice, {
                                correta: alternativa.key,
                              })
                            }
                            aria-label={`Alternativa ${String.fromCharCode(65 + i)} é a correta`}
                          />
                          {String.fromCharCode(65 + i)}
                        </label>
                        <input
                          type="text"
                          required
                          aria-label={`Texto da alternativa ${String.fromCharCode(65 + i)} da pergunta ${indice + 1}`}
                          value={alternativa.texto}
                          onChange={(e) =>
                            alterarAlternativa(
                              indice,
                              alternativa.key,
                              e.target.value,
                            )
                          }
                        />
                        {pergunta.alternativas.length >
                        LIMITES.alternativasMin ? (
                          <button
                            type="button"
                            className={styles.iconButton}
                            aria-label={`Remover alternativa ${String.fromCharCode(65 + i)}`}
                            onClick={() =>
                              removerAlternativa(indice, alternativa.key)
                            }
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                    ))}
                    {pergunta.alternativas.length < LIMITES.alternativasMax ? (
                      <button
                        type="button"
                        className={styles.secondary}
                        onClick={() => adicionarAlternativa(indice)}
                      >
                        <Plus size={14} aria-hidden="true" />
                        Adicionar alternativa
                      </button>
                    ) : null}
                  </div>
                  <label className={styles.field}>
                    Feedback pedagógico
                    <textarea
                      rows={2}
                      value={pergunta.feedback}
                      onChange={(e) =>
                        alterarPergunta(indice, { feedback: e.target.value })
                      }
                    />
                  </label>
                  <label className={styles.field}>
                    Objetivo da pergunta
                    <input
                      value={pergunta.objetivoPedagogico}
                      onChange={(e) =>
                        alterarPergunta(indice, {
                          objetivoPedagogico: e.target.value,
                        })
                      }
                    />
                  </label>
                  <ErroCampo mensagens={errosDaPergunta(erros, indice)} />
                </fieldset>
              ))}
            </section>

            <div className={styles.formFooter}>
              <Link href="/historias" className={styles.secondary}>
                Cancelar
              </Link>
              <button
                type="submit"
                className={styles.primary}
                disabled={salvando}
              >
                {salvando
                  ? "Salvando..."
                  : id
                    ? "Salvar alterações"
                    : "Salvar história"}
              </button>
            </div>
          </form>
        )}
      </TeacherLayout>
    </>
  );
}

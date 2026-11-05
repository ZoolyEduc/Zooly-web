import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  BookMarked,
  BookOpen,
  Eye,
  FileQuestion,
  Pencil,
  Plus,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import TeacherLayout from "../../components/TeacherLayout";
import Notice from "../../components/Notice";
import ConfirmDialog from "../../components/ConfirmDialog";
import { historiasApi } from "../../services/historiasApi";
import {
  LIMITES,
  filtrarHistorias,
  rotuloFaixa,
  rotuloOrigem,
  temasDe,
} from "../../utils/historias";
import { getId } from "../../utils/formatacao";
import styles from "./historias.module.css";

const filtrosIniciais = {
  busca: "",
  tema: "",
  idade: "",
  origem: "",
  status: "ativa",
};
const idades = Array.from(
  { length: LIMITES.idadeMax - LIMITES.idadeMin + 1 },
  (_, i) => LIMITES.idadeMin + i,
);

export default function BancoDeHistorias() {
  const [historias, setHistorias] = useState([]);
  const [filtros, setFiltros] = useState(filtrosIniciais);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [ocupado, setOcupado] = useState("");
  const [paraExcluir, setParaExcluir] = useState(null);

  const carregar = useCallback(() => {
    setCarregando(true);
    setErro("");
    return historiasApi
      .listar()
      .then((resposta) => setHistorias(resposta?.historias || []))
      .catch((error) => {
        // Sem dados substitutos: a lista fica vazia e a mensagem explica o problema.
        setHistorias([]);
        setErro(error.message);
      })
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    let ativo = true;
    Promise.resolve().then(() => {
      if (ativo) carregar();
    });
    return () => {
      ativo = false;
    };
  }, [carregar]);

  const temas = useMemo(() => temasDe(historias), [historias]);
  const visiveis = useMemo(
    () => filtrarHistorias(historias, filtros),
    [historias, filtros],
  );
  const filtrando = Object.entries(filtros).some(
    ([campo, valor]) => valor !== filtrosIniciais[campo],
  );

  function atualizarFiltro(campo, valor) {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
  }

  async function alternarArquivo(historia) {
    const id = getId(historia);
    const arquivar = historia.status !== "arquivada";
    setOcupado(id);
    setErro("");
    setSucesso("");
    try {
      const resposta = arquivar
        ? await historiasApi.arquivar(id)
        : await historiasApi.reativar(id);
      setHistorias((atuais) =>
        atuais.map((item) =>
          getId(item) === id ? { ...item, ...resposta.historia } : item,
        ),
      );
      setSucesso(
        arquivar
          ? `"${historia.titulo}" foi arquivada. Use o filtro "Arquivadas" para encontrá-la.`
          : `"${historia.titulo}" foi reativada.`,
      );
    } catch (error) {
      setErro(error.message);
    } finally {
      setOcupado("");
    }
  }

  async function excluir() {
    const historia = paraExcluir;
    const id = getId(historia);
    setOcupado(id);
    setErro("");
    setSucesso("");
    try {
      await historiasApi.excluir(id);
      setHistorias((atuais) => atuais.filter((item) => getId(item) !== id));
      setSucesso(`"${historia.titulo}" foi excluída.`);
      setParaExcluir(null);
    } catch (error) {
      setErro(error.message);
      setParaExcluir(null);
    } finally {
      setOcupado("");
    }
  }

  return (
    <>
      <Head>
        <title>Banco de Histórias | Zooly</title>
      </Head>
      <TeacherLayout
        title="Banco de Histórias"
        subtitle="Histórias do Zooly e as suas, prontas para virar atividades."
        actions={
          <Link href="/historias/nova" className={styles.primary}>
            <Plus size={16} aria-hidden="true" />
            Nova história
          </Link>
        }
      >
        <div className={styles.toolbar}>
          <div
            className={styles.filters}
            role="search"
            aria-label="Filtrar histórias"
          >
            <label>
              Buscar
              <input
                type="search"
                value={filtros.busca}
                onChange={(e) => atualizarFiltro("busca", e.target.value)}
                placeholder="Título, tema ou objetivo"
              />
            </label>
            <label>
              Tema
              <select
                value={filtros.tema}
                onChange={(e) => atualizarFiltro("tema", e.target.value)}
              >
                <option value="">Todos os temas</option>
                {temas.map((tema) => (
                  <option key={tema} value={tema}>
                    {tema}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Idade
              <select
                value={filtros.idade}
                onChange={(e) => atualizarFiltro("idade", e.target.value)}
              >
                <option value="">Qualquer idade</option>
                {idades.map((idade) => (
                  <option key={idade} value={idade}>
                    {idade} anos
                  </option>
                ))}
              </select>
            </label>
            <label>
              Origem
              <select
                value={filtros.origem}
                onChange={(e) => atualizarFiltro("origem", e.target.value)}
              >
                <option value="">Todas</option>
                <option value="zooly">Zooly</option>
                <option value="professor">Minhas histórias</option>
              </select>
            </label>
            <label>
              Situação
              <select
                value={filtros.status}
                onChange={(e) => atualizarFiltro("status", e.target.value)}
              >
                <option value="ativa">Ativas</option>
                <option value="arquivada">Arquivadas</option>
                <option value="todas">Todas</option>
              </select>
            </label>
          </div>
        </div>

        {erro ? (
          <Notice kind="error">
            {erro}{" "}
            <button
              type="button"
              className={styles.linkButton}
              onClick={carregar}
            >
              Tentar novamente
            </button>
          </Notice>
        ) : null}
        {sucesso ? <Notice kind="success">{sucesso}</Notice> : null}

        {carregando ? (
          <p className={styles.loading} role="status">
            Carregando o Banco de Histórias...
          </p>
        ) : erro && !historias.length ? null : (
          <>
            <p className={styles.summary} role="status">
              {visiveis.length === 1
                ? "1 história encontrada"
                : `${visiveis.length} histórias encontradas`}
              {filtrando ? (
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => setFiltros(filtrosIniciais)}
                >
                  Limpar filtros
                </button>
              ) : null}
            </p>
            {visiveis.length ? (
              <div className={styles.grid}>
                {visiveis.map((historia) => (
                  <CartaoHistoria
                    key={getId(historia)}
                    historia={historia}
                    ocupado={ocupado === getId(historia)}
                    onArquivar={() => alternarArquivo(historia)}
                    onExcluir={() => setParaExcluir(historia)}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <h2>Nenhuma história encontrada</h2>
                <p>
                  {filtrando
                    ? "Nenhuma história combina com os filtros escolhidos."
                    : "Ainda não há histórias disponíveis. Cadastre a primeira."}
                </p>
              </div>
            )}
          </>
        )}

        <ConfirmDialog
          aberto={Boolean(paraExcluir)}
          perigo
          titulo="Excluir história?"
          mensagem={`"${paraExcluir?.titulo ?? ""}" será removida do Banco de Histórias. As atividades já criadas com ela continuam iguais, porque guardam uma cópia.`}
          confirmar="Excluir"
          ocupado={Boolean(ocupado)}
          onCancelar={() => setParaExcluir(null)}
          onConfirmar={excluir}
        />
      </TeacherLayout>
    </>
  );
}

function CartaoHistoria({ historia, ocupado, onArquivar, onExcluir }) {
  const id = getId(historia);
  const propria = historia.editavel;
  const arquivada = historia.status === "arquivada";
  return (
    <article
      className={`${styles.card} ${arquivada ? styles.cardArchived : ""}`}
      aria-label={historia.titulo}
    >
      <div className={styles.cardTop}>
        <span
          className={`${styles.cover} ${propria ? styles.coverOwn : ""}`}
          aria-hidden="true"
        >
          {propria ? <BookMarked size={22} /> : <BookOpen size={22} />}
        </span>
        <div className={styles.badges}>
          <span
            className={`${styles.badge} ${propria ? styles.badgeOwn : styles.badgeZooly}`}
          >
            {rotuloOrigem(historia)}
          </span>
          {arquivada ? (
            <span className={`${styles.badge} ${styles.badgeArchived}`}>
              Arquivada
            </span>
          ) : null}
        </div>
      </div>
      <h2>{historia.titulo}</h2>
      {historia.descricao ? (
        <p className={styles.description}>{historia.descricao}</p>
      ) : null}
      <ul className={styles.meta}>
        {historia.tema ? (
          <li>
            <Target size={13} aria-hidden="true" />
            {historia.tema}
          </li>
        ) : null}
        <li>
          <Users size={13} aria-hidden="true" />
          {rotuloFaixa(historia.faixaEtaria)}
        </li>
        <li>
          <FileQuestion size={13} aria-hidden="true" />
          {historia.totalPerguntas === 1
            ? "1 pergunta"
            : `${historia.totalPerguntas ?? 0} perguntas`}
        </li>
      </ul>
      {historia.objetivosPedagogicos?.length ? (
        <ul className={styles.objectives} aria-label="Objetivos pedagógicos">
          {historia.objetivosPedagogicos.slice(0, 2).map((objetivo) => (
            <li key={objetivo}>{objetivo}</li>
          ))}
          {historia.objetivosPedagogicos.length > 2 ? (
            <li>+{historia.objetivosPedagogicos.length - 2} objetivo(s)</li>
          ) : null}
        </ul>
      ) : null}
      <div className={styles.cardActions}>
        <Link
          href={`/historias/${encodeURIComponent(id)}`}
          className={styles.secondary}
        >
          <Eye size={14} aria-hidden="true" />
          Ver
        </Link>
        {!arquivada ? (
          <Link
            href={`/atividades/nova?historiaId=${encodeURIComponent(id)}`}
            className={styles.primary}
          >
            Usar em atividade
          </Link>
        ) : null}
        {propria ? (
          <>
            <Link
              href={`/historias/nova?id=${encodeURIComponent(id)}`}
              className={styles.secondary}
              aria-label={`Editar ${historia.titulo}`}
            >
              <Pencil size={14} aria-hidden="true" />
              Editar
            </Link>
            <button
              type="button"
              className={styles.secondary}
              onClick={onArquivar}
              disabled={ocupado}
            >
              {arquivada ? (
                <ArchiveRestore size={14} aria-hidden="true" />
              ) : (
                <Archive size={14} aria-hidden="true" />
              )}
              {arquivada ? "Reativar" : "Arquivar"}
            </button>
            <button
              type="button"
              className={styles.danger}
              onClick={onExcluir}
              disabled={ocupado}
              aria-label={`Excluir ${historia.titulo}`}
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}

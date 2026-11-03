import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  BookOpen,
  FileQuestion,
  Pencil,
  Target,
  Trash2,
} from "lucide-react";
import TeacherLayout from "../../components/TeacherLayout";
import Notice from "../../components/Notice";
import ConfirmDialog from "../../components/ConfirmDialog";
import HistoriaPreview from "../../components/HistoriaPreview";
import { historiasApi } from "../../services/historiasApi";
import { rotuloFaixa, rotuloOrigem } from "../../utils/historias";
import { formatDate, getId } from "../../utils/formatacao";
import styles from "./historias.module.css";

export default function DetalheHistoria() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const [historia, setHistoria] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const recemSalva = router.query.salva === "1";
  const [ocupado, setOcupado] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  useEffect(() => {
    if (!router.isReady || !id) return undefined;
    let ativo = true;
    historiasApi
      .obter(id)
      .then((resposta) => {
        if (!ativo) return;
        setHistoria(resposta?.historia ?? null);
        if (recemSalva) setSucesso("História salva no Banco de Histórias.");
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
  }, [router.isReady, id, recemSalva]);

  async function alternarArquivo() {
    const arquivar = historia.status !== "arquivada";
    setOcupado(true);
    setErro("");
    setSucesso("");
    try {
      const resposta = arquivar
        ? await historiasApi.arquivar(id)
        : await historiasApi.reativar(id);
      setHistoria((atual) => ({ ...atual, ...resposta.historia }));
      setSucesso(arquivar ? "História arquivada." : "História reativada.");
    } catch (error) {
      setErro(error.message);
    } finally {
      setOcupado(false);
    }
  }

  async function excluir() {
    setOcupado(true);
    setErro("");
    try {
      await historiasApi.excluir(id);
      await router.push("/historias");
    } catch (error) {
      setErro(error.message);
      setConfirmarExclusao(false);
      setOcupado(false);
    }
  }

  const propria = Boolean(historia?.editavel);
  const arquivada = historia?.status === "arquivada";

  return (
    <>
      <Head>
        <title>
          {historia?.titulo ? `${historia.titulo} | Zooly` : "História | Zooly"}
        </title>
      </Head>
      <TeacherLayout>
        <Link href="/historias" className={styles.back}>
          <ArrowLeft size={16} aria-hidden="true" />
          Banco de Histórias
        </Link>
        {erro ? <Notice kind="error">{erro}</Notice> : null}
        {sucesso ? <Notice kind="success">{sucesso}</Notice> : null}
        {carregando ? (
          <p className={styles.loading} role="status">
            Carregando história...
          </p>
        ) : historia ? (
          <>
            <div className={styles.detailHeader}>
              <div>
                <div className={`${styles.badges} ${styles.badgesStart}`}>
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
                <h1>{historia.titulo}</h1>
                {historia.descricao ? (
                  <p className={styles.description}>{historia.descricao}</p>
                ) : null}
              </div>
              <div className={styles.headerActions}>
                {!arquivada ? (
                  <Link
                    href={`/atividades/nova?historiaId=${encodeURIComponent(getId(historia))}`}
                    className={styles.primary}
                  >
                    Usar em atividade
                  </Link>
                ) : null}
                {propria ? (
                  <>
                    <Link
                      href={`/historias/nova?id=${encodeURIComponent(getId(historia))}`}
                      className={styles.secondary}
                    >
                      <Pencil size={14} aria-hidden="true" />
                      Editar
                    </Link>
                    <button
                      type="button"
                      className={styles.secondary}
                      onClick={alternarArquivo}
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
                      onClick={() => setConfirmarExclusao(true)}
                      disabled={ocupado}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      Excluir
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            {!propria ? (
              <Notice kind="info">
                Esta é uma história do Zooly: você pode consultá-la e usá-la em
                atividades, mas não alterá-la. Ao usar em uma atividade, o texto
                e as perguntas são copiados e podem ser editados lá.
              </Notice>
            ) : null}
            <div className={styles.detailGrid}>
              <div>
                <section className={styles.panel}>
                  <h2>
                    <BookOpen size={17} aria-hidden="true" />
                    História
                  </h2>
                  <HistoriaPreview
                    historia={historia}
                    mostrarPerguntas={false}
                  />
                </section>
                <section className={styles.panel}>
                  <h2>
                    <FileQuestion size={17} aria-hidden="true" />
                    Perguntas ({historia.perguntas?.length ?? 0})
                  </h2>
                  <HistoriaPreview historia={historia} mostrarTexto={false} />
                </section>
              </div>
              <aside className={styles.panel}>
                <h2>
                  <Target size={17} aria-hidden="true" />
                  Dados pedagógicos
                </h2>
                <dl className={styles.facts}>
                  <div>
                    <dt>Tema</dt>
                    <dd>{historia.tema || "Não informado"}</dd>
                  </div>
                  <div>
                    <dt>Faixa etária</dt>
                    <dd>{rotuloFaixa(historia.faixaEtaria)}</dd>
                  </div>
                  <div>
                    <dt>Objetivos pedagógicos</dt>
                    <dd>
                      {historia.objetivosPedagogicos?.length ? (
                        <ul className={styles.objectives}>
                          {historia.objetivosPedagogicos.map((objetivo) => (
                            <li key={objetivo}>{objetivo}</li>
                          ))}
                        </ul>
                      ) : (
                        "Não informados"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Situação</dt>
                    <dd>{arquivada ? "Arquivada" : "Ativa"}</dd>
                  </div>
                  <div>
                    <dt>Atualizada em</dt>
                    <dd>{formatDate(historia.updatedAt)}</dd>
                  </div>
                </dl>
              </aside>
            </div>
          </>
        ) : !erro ? (
          <div className={styles.empty}>
            <h2>História não encontrada</h2>
          </div>
        ) : null}
        <ConfirmDialog
          aberto={confirmarExclusao}
          perigo
          titulo="Excluir história?"
          mensagem="Ela será removida do Banco de Histórias. As atividades já criadas com ela continuam iguais, porque guardam uma cópia."
          confirmar="Excluir"
          ocupado={ocupado}
          onCancelar={() => setConfirmarExclusao(false)}
          onConfirmar={excluir}
        />
      </TeacherLayout>
    </>
  );
}

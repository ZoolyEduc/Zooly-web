import { useEffect, useState } from "react";
import Head from "next/head";
import TeacherLayout from "../components/TeacherLayout";
import Notice from "../components/Notice";
import { apiRequest } from "../services/api";
import { getSession } from "../services/session";
import styles from "./configuracoes.module.css";
import {
  Bell,
  Camera,
  CircleUserRound,
  LockKeyhole,
  School,
  UserRound,
} from "lucide-react";

const CHAVE_NOTIFICACOES = "zooly_notification_preferences";
const notificacoesIniciais = { conclusao: false, prazo: false };

function lerPreferencias() {
  try {
    const preferencias = JSON.parse(
      window.localStorage.getItem(CHAVE_NOTIFICACOES) || "null",
    );
    if (preferencias && typeof preferencias === "object") {
      return {
        conclusao: Boolean(preferencias.conclusao),
        prazo: Boolean(preferencias.prazo),
      };
    }
  } catch {
    return notificacoesIniciais;
  }
  return notificacoesIniciais;
}

export default function Configuracoes() {
  const [usuario, setUsuario] = useState(null);
  const [escolas, setEscolas] = useState([]);
  const [notificacoes, setNotificacoes] = useState(notificacoesIniciais);
  const [notificacoesSalvas, setNotificacoesSalvas] =
    useState(notificacoesIniciais);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    let ativo = true;
    Promise.resolve().then(() => {
      if (!ativo) return;
      setUsuario(getSession().usuario);
      const preferencias = lerPreferencias();
      setNotificacoes(preferencias);
      setNotificacoesSalvas(preferencias);
    });

    apiRequest("/api/turmas")
      .then((resposta) => {
        if (!ativo) return;
        const escolasUnicas = [
          ...new Map(
            (resposta?.turmas || [])
              .map((turma) => turma.escola)
              .filter((escola) => escola && typeof escola === "object")
              .map((escola) => [
                escola._id || escola.codigoPermanente || escola.nome,
                escola,
              ]),
          ).values(),
        ];
        setEscolas(escolasUnicas);
      })
      .catch((error) => {
        if (ativo) setErro(error.message);
      });

    return () => {
      ativo = false;
    };
  }, []);

  function atualizarNotificacao(nome, valor) {
    setMensagem("");
    setNotificacoes((current) => ({ ...current, [nome]: valor }));
  }

  function descartarAlteracoes() {
    setNotificacoes(notificacoesSalvas);
    setMensagem("");
  }

  function salvarConfiguracoes() {
    try {
      window.localStorage.setItem(
        CHAVE_NOTIFICACOES,
        JSON.stringify(notificacoes),
      );
      setNotificacoesSalvas(notificacoes);
      setMensagem("Preferências salvas neste navegador.");
    } catch (error) {
      setErro(`Não foi possível salvar as preferências neste navegador: ${error.message}`);
    }
  }

  const nomeEscola = escolas[0]?.nome || "";
  const codigoEscola = escolas[0]?.codigo_escola || "";
  const iniciais = (usuario?.nome || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");

  return (
    <>
      <Head>
        <title>Configurações | Zooly</title>
      </Head>
      <TeacherLayout title="Configurações">
        {erro ? <Notice kind="error">{erro}</Notice> : null}
        {mensagem ? <Notice kind="success">{mensagem}</Notice> : null}
        <div className={styles.settings}>
          <div className={styles.leftColumn}>
            <section className={styles.card}>
              <h2>
                <UserRound size={18} aria-hidden="true" />
                Dados do Professor
              </h2>
              <div className={styles.twoFields}>
                <label htmlFor="nome-professor">
                  Nome Completo
                  <input
                    id="nome-professor"
                    value={usuario?.nome || ""}
                    readOnly
                    placeholder="Não informado pela API"
                  />
                </label>
                <label htmlFor="email-professor">
                  E-mail
                  <input
                    id="email-professor"
                    type="email"
                    value={usuario?.email || ""}
                    readOnly
                    placeholder="Não informado pela API"
                  />
                </label>
              </div>
              <button
                type="button"
                className={styles.softButton}
                disabled
                title="A API integrada não oferece alteração de senha."
              >
                <LockKeyhole size={15} aria-hidden="true" />
                Solicitar alteração de senha
              </button>
              <p className={styles.unavailable}>
                Alteração de dados e senha ainda não disponível na API integrada.
              </p>
            </section>

            <section className={styles.card}>
              <h2>
                <School size={18} aria-hidden="true" />
                Dados da Escola
              </h2>
              <div className={styles.schoolFields}>
                <label className={styles.fullField} htmlFor="nome-escola">
                  Nome da Escola
                  <input
                    id="nome-escola"
                    value={nomeEscola}
                    readOnly
                    placeholder="Não informado pela API"
                  />
                </label>
                <div className={styles.twoFields}>
                  <label htmlFor="codigo-escola">
                    Código da Escola
                    <input
                      id="codigo-escola"
                      value={codigoEscola}
                      readOnly
                      placeholder="Não informado pela API"
                    />
                  </label>
                  <label htmlFor="telefone-escola">
                    Telefone
                    <input
                      id="telefone-escola"
                      value=""
                      readOnly
                      placeholder="Não disponível na API"
                    />
                  </label>
                  <label className={styles.fullField} htmlFor="endereco-escola">
                    Endereço
                    <input
                      id="endereco-escola"
                      value=""
                      readOnly
                      placeholder="Não disponível na API"
                    />
                  </label>
                  <label className={styles.fullField} htmlFor="email-escola">
                    E-mail Institucional
                    <input
                      id="email-escola"
                      type="email"
                      value=""
                      readOnly
                      placeholder="Não disponível na API"
                    />
                  </label>
                </div>
                {!escolas.length ? (
                  <p className={styles.unavailable}>
                    Nenhuma escola foi retornada pelas turmas desta conta.
                  </p>
                ) : null}
              </div>
            </section>
          </div>

          <div className={styles.rightColumn}>
            <section className={`${styles.card} ${styles.photoCard}`}>
              <div className={styles.photo} aria-label="Foto do perfil">
                {iniciais || <CircleUserRound size={42} aria-hidden="true" />}
              </div>
              <h3>Foto de perfil</h3>
              <p>JPG ou PNG. A API integrada ainda não oferece envio de imagem.</p>
              <button
                type="button"
                className={styles.upload}
                disabled
                title="A API integrada ainda não oferece envio de imagem."
              >
                <Camera size={15} aria-hidden="true" />
                Carregar nova foto
              </button>
            </section>

            <section className={`${styles.card} ${styles.notifications}`}>
              <h2>
                <Bell size={18} aria-hidden="true" />
                Notificações
              </h2>
              <label className={styles.toggleRow}>
                <span>
                  <strong>Aluno concluiu atividade</strong>
                  <small>Preferência salva somente neste navegador.</small>
                </span>
                <input
                  type="checkbox"
                  checked={notificacoes.conclusao}
                  onChange={(event) =>
                    atualizarNotificacao("conclusao", event.target.checked)
                  }
                />
                <i aria-hidden="true" />
              </label>
              <label className={styles.toggleRow}>
                <span>
                  <strong>Atividades próximas do prazo</strong>
                  <small>Preferência salva somente neste navegador.</small>
                </span>
                <input
                  type="checkbox"
                  checked={notificacoes.prazo}
                  onChange={(event) =>
                    atualizarNotificacao("prazo", event.target.checked)
                  }
                />
                <i aria-hidden="true" />
              </label>
            </section>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.discard}
                onClick={descartarAlteracoes}
              >
                Descartar alterações
              </button>
              <button
                type="button"
                className={styles.save}
                onClick={salvarConfiguracoes}
              >
                Salvar configurações
              </button>
            </div>
          </div>
        </div>
      </TeacherLayout>
    </>
  );
}

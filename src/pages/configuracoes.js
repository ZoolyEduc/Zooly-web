import { useEffect, useState } from "react";
import Head from "next/head";
import TeacherLayout from "../components/TeacherLayout";
import Notice from "../components/Notice";
import { apiRequest } from "../services/api";
import { getSession } from "../services/session";
import styles from "./configuracoes.module.css";

const CHAVE_NOTIFICACOES = "zooly_notification_preferences";
const notificacoesIniciais = { conclusao: false, prazo: false };

export default function Configuracoes() {
  const [usuario, setUsuario] = useState(null);
  const [turmas, setTurmas] = useState([]);
  const [notificacoes, setNotificacoes] = useState(notificacoesIniciais);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    Promise.resolve().then(() => {
      if (!ativo) return;
      setUsuario(getSession().usuario);
      try {
        const preferencias = JSON.parse(
          window.localStorage.getItem(CHAVE_NOTIFICACOES) || "null",
        );
        if (preferencias && typeof preferencias === "object") {
          setNotificacoes({
            conclusao: Boolean(preferencias.conclusao),
            prazo: Boolean(preferencias.prazo),
          });
        }
      } catch {
        setNotificacoes(notificacoesIniciais);
      }
    });

    apiRequest("/api/turmas")
      .then((resposta) => {
        if (ativo) setTurmas(resposta?.turmas || []);
      })
      .catch((error) => {
        if (ativo) setErro(error.message);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const escolas = [
    ...new Map(
      turmas
        .map((turma) => turma.escola)
        .filter((escola) => escola && typeof escola === "object")
        .map((escola) => [escola._id || escola.codigoPermanente || escola.nome, escola]),
    ).values(),
  ];

  function atualizarNotificacao(nome, valor) {
    setNotificacoes((current) => {
      const atualizadas = { ...current, [nome]: valor };
      window.localStorage.setItem(
        CHAVE_NOTIFICACOES,
        JSON.stringify(atualizadas),
      );
      return atualizadas;
    });
  }

  function restaurarNotificacoes() {
    setNotificacoes(notificacoesIniciais);
    window.localStorage.setItem(
      CHAVE_NOTIFICACOES,
      JSON.stringify(notificacoesIniciais),
    );
  }

  return (
    <>
      <Head>
        <title>Configurações | Zooly</title>
      </Head>
      <TeacherLayout
        title="Configurações"
        subtitle="Gerencie seus dados e preferências do Zooly."
      >
        <Notice kind="info">
          A API atual não oferece edição de perfil, senha ou foto. Os dados da conta são somente leitura.
        </Notice>
        {erro ? <Notice kind="error">{erro}</Notice> : null}
        <div className={styles.settings}>
          <div className={styles.leftColumn}>
            <section className={styles.card}>
              <h2>
                <span>♙</span> Dados do Professor
              </h2>
              <div className={styles.twoFields}>
                <label htmlFor="nome-professor">
                  Nome Completo
                  <input
                    id="nome-professor"
                    value={usuario?.nome || "Não informado"}
                    readOnly
                  />
                </label>
                <label htmlFor="email-professor">
                  E-mail
                  <input
                    id="email-professor"
                    type="email"
                    value={usuario?.email || "Não informado"}
                    readOnly
                  />
                </label>
              </div>
            </section>
            <section className={styles.card}>
              <h2>
                <span>♧</span> Dados da Escola
              </h2>
              {escolas.length ? (
                <ul className={styles.schoolList}>
                  {escolas.map((escola) => (
                    <li key={escola._id || escola.codigoPermanente || escola.nome}>
                      <strong>{escola.nome || "Escola vinculada"}</strong>
                      <span>{escola.codigoPermanente || "Código não retornado"}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.muted}>
                  Nenhuma escola vinculada foi retornada pelas turmas da conta.
                </p>
              )}
            </section>
          </div>
          <div className={styles.rightColumn}>
            <section className={`${styles.card} ${styles.accountCard}`}>
              <span className={styles.avatar}>
                {(usuario?.nome || "P").trim().charAt(0).toUpperCase()}
              </span>
              <strong>{usuario?.tipo || "Professor"}</strong>
              <span>{usuario?.id || "Identificador não retornado"}</span>
            </section>
            <section className={`${styles.card} ${styles.notifications}`}>
              <h2>
                <span>♧</span> Preferências locais
              </h2>
              <label className={styles.toggleRow}>
                <span>
                  <strong>Aluno concluiu atividade</strong>
                  <small>Preferência salva neste navegador.</small>
                </span>
                <input
                  type="checkbox"
                  checked={notificacoes.conclusao}
                  onChange={(event) =>
                    atualizarNotificacao("conclusao", event.target.checked)
                  }
                />
                <i />
              </label>
              <label className={styles.toggleRow}>
                <span>
                  <strong>Atividades próximas do prazo</strong>
                  <small>Preferência salva neste navegador.</small>
                </span>
                <input
                  type="checkbox"
                  checked={notificacoes.prazo}
                  onChange={(event) =>
                    atualizarNotificacao("prazo", event.target.checked)
                  }
                />
                <i />
              </label>
            </section>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.discard}
                onClick={restaurarNotificacoes}
              >
                Restaurar preferências
              </button>
            </div>
          </div>
        </div>
      </TeacherLayout>
    </>
  );
}

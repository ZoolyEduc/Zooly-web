import { useState } from "react";
import Head from "next/head";
import TeacherLayout from "../components/TeacherLayout";
import Notice from "../components/Notice";
import { getSession } from "../services/session";
import styles from "./configuracoes.module.css";
import Image from "next/image";

const valoresIniciais = {
  nome: "Helena Ferreira",
  email: "helena.ferreira@zooly.edu.br",
  escola: "Colégio Luminous Primário",
  codigo: "EDU-99238",
  telefone: "+55 (11) 98877-6655",
  endereco: "Av. das Flores, 1234 - Jardim Botânico, São Paulo - SP",
  emailEscola: "contato@colegioluminous.com.br",
};

export default function Configuracoes() {
  const [usuario] = useState(() => getSession().usuario);
  const [dados, setDados] = useState(() => ({
    ...valoresIniciais,
    nome: usuario?.nome || valoresIniciais.nome,
    email: usuario?.email || valoresIniciais.email,
  }));
  const [notificacoes, setNotificacoes] = useState({
    conclusao: false,
    prazo: false,
  });
  const [mensagem, setMensagem] = useState("");
  const [foto, setFoto] = useState("");

  function atualizar(event) {
    setDados((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }
  function descartar() {
    setDados({
      ...valoresIniciais,
      nome: usuario?.nome || valoresIniciais.nome,
      email: usuario?.email || valoresIniciais.email,
    });
    setNotificacoes({ conclusao: false, prazo: false });
    setMensagem("Alterações descartadas.");
  }
  function salvar(event) {
    event.preventDefault();
    setMensagem("Configurações salvas nesta demonstração.");
  }
  function carregarFoto(event) {
    const file = event.target.files?.[0];
    if (file) setFoto(URL.createObjectURL(file));
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
        {mensagem ? <Notice kind="success">{mensagem}</Notice> : null}
        <form className={styles.settings} onSubmit={salvar}>
          <div className={styles.leftColumn}>
            <section className={styles.card}>
              <h2>
                <span>♙</span> Dados do Professor
              </h2>
              <div className={styles.twoFields}>
                <label htmlFor="nome">
                  Nome Completo
                  <input
                    id="nome"
                    name="nome"
                    value={dados.nome}
                    onChange={atualizar}
                  />
                </label>
                <label htmlFor="email">
                  E-mail
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={dados.email}
                    onChange={atualizar}
                  />
                </label>
              </div>
              <button
                className={styles.softButton}
                type="button"
                onClick={() =>
                  setMensagem(
                    "A solicitação de alteração de senha está disponível na demonstração.",
                  )
                }
              >
                Solicitar para Alterar a senha
              </button>
            </section>
            <section className={styles.card}>
              <h2>
                <span>♧</span> Dados da Escola
              </h2>
              <label htmlFor="escola">
                Nome da Escola
                <input
                  id="escola"
                  name="escola"
                  value={dados.escola}
                  onChange={atualizar}
                />
              </label>
              <div className={styles.twoFields}>
                <label htmlFor="codigo">
                  Código da Escola
                  <input
                    id="codigo"
                    name="codigo"
                    value={dados.codigo}
                    onChange={atualizar}
                  />
                </label>
                <label htmlFor="telefone">
                  Telefone
                  <input
                    id="telefone"
                    name="telefone"
                    value={dados.telefone}
                    onChange={atualizar}
                  />
                </label>
              </div>
              <label htmlFor="endereco">
                Endereço
                <input
                  id="endereco"
                  name="endereco"
                  value={dados.endereco}
                  onChange={atualizar}
                />
              </label>
              <label htmlFor="emailEscola">
                E-mail Institucional
                <input
                  id="emailEscola"
                  name="emailEscola"
                  type="email"
                  value={dados.emailEscola}
                  onChange={atualizar}
                />
              </label>
            </section>
          </div>
          <div className={styles.rightColumn}>
            <section className={`${styles.card} ${styles.photoCard}`}>
              <div className={styles.photo}>
                {foto ? (
                  <Image
                    src={foto}
                    alt="Foto de perfil"
                    fill
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <span>{(dados.nome || "H").slice(0, 1)}</span>
                )}
              </div>
              <h3>Foto de perfil</h3>
              <p>JPG ou PNG. Tamanho máximo de 2MB.</p>
              <label className={styles.upload}>
                Carregar nova foto
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={carregarFoto}
                />
              </label>
            </section>
            <section className={`${styles.card} ${styles.notifications}`}>
              <h2>
                <span>♧</span> Notificações
              </h2>
              <label className={styles.toggleRow}>
                <span>
                  <strong>Aluno concluiu atividade</strong>
                  <small>Receba um aviso imediato.</small>
                </span>
                <input
                  type="checkbox"
                  checked={notificacoes.conclusao}
                  onChange={(event) =>
                    setNotificacoes({
                      ...notificacoes,
                      conclusao: event.target.checked,
                    })
                  }
                />
                <i />
              </label>
              <label className={styles.toggleRow}>
                <span>
                  <strong>Atividades próximas do prazo</strong>
                  <small>Lembretes de prazos finais.</small>
                </span>
                <input
                  type="checkbox"
                  checked={notificacoes.prazo}
                  onChange={(event) =>
                    setNotificacoes({
                      ...notificacoes,
                      prazo: event.target.checked,
                    })
                  }
                />
                <i />
              </label>
            </section>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.discard}
                onClick={descartar}
              >
                Descartar Alterações
              </button>
              <button type="submit" className={styles.save}>
                Salvar Configurações
              </button>
            </div>
          </div>
        </form>
      </TeacherLayout>
    </>
  );
}

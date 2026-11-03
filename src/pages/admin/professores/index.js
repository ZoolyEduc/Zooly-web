import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  CircleAlert,
  Eye,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/AdminLayout";
import Notice from "../../../components/Notice";
import { apiRequest } from "../../../services/api";
import styles from "./professores.module.css";

export default function AdminProfessores() {
  const router = useRouter();
  const [professores, setProfessores] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [erroLista, setErroLista] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [detalhe, setDetalhe] = useState(null);
  const [detalheLoading, setDetalheLoading] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroLista(false);
    try {
      const data = await apiRequest("/api/admin/professores");
      setProfessores(Array.isArray(data?.professores) ? data.professores : []);
    } catch (error) {
      setErro(error.message);
      setErroLista(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => carregar(), 0);
    return () => window.clearTimeout(timer);
  }, [carregar]);

  const filtrados = useMemo(() => {
    const term = busca.trim().toLocaleLowerCase("pt-BR");
    if (!term) return professores;
    return professores.filter((professor) => {
      const escola = (professor.escolas || [])
        .map((item) => item.nome || "")
        .join(" ");
      return `${professor.nome} ${professor.email} ${escola}`
        .toLocaleLowerCase("pt-BR")
        .includes(term);
    });
  }, [busca, professores]);
  const feedback =
    sucesso ||
    (router.query.sucesso === "criado"
      ? "Professor cadastrado com sucesso."
      : router.query.sucesso === "atualizado"
        ? "Professor atualizado com sucesso."
        : "");

  async function visualizar(professor) {
    setDetalheLoading(true);
    setDetalhe({});
    try {
      const data = await apiRequest(
        `/api/admin/professores/${encodeURIComponent(professor.id)}`,
      );
      setDetalhe(data?.professor || professor);
    } catch (error) {
      setDetalhe({ ...professor, erro: error.message });
    } finally {
      setDetalheLoading(false);
    }
  }

  async function excluir(professor) {
    if (
      !window.confirm(
        `Excluir a conta de ${professor.nome}? Professores vinculados a turmas ou atividades não podem ser excluídos.`,
      )
    )
      return;
    setErro("");
    setSucesso("");
    try {
      const data = await apiRequest(
        `/api/admin/professores/${encodeURIComponent(professor.id)}`,
        { method: "DELETE" },
      );
      setSucesso(data?.mensagem || "Professor excluído com sucesso.");
      await carregar();
    } catch (error) {
      setErro(error.message);
    }
  }

  return (
    <>
      <Head>
        <title>Professores | Administração Zooly</title>
      </Head>
      <AdminLayout
        title="Professores"
        subtitle="Consulte e gerencie as contas de acesso dos professores."
      >
        {erro ? (
          <div className={styles.error} role="alert">
            <CircleAlert size={18} />
            {erro}
          </div>
        ) : null}
        {feedback && !erro ? <Notice kind="success">{feedback}</Notice> : null}
        <section className={styles.toolbar}>
          <label className={styles.search}>
            <Search size={18} />
            <input
              type="search"
              placeholder="Buscar por nome, e-mail ou escola"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </label>
          <Link className={styles.primary} href="/admin/professores/novo">
            <Plus size={18} /> Cadastrar professor
          </Link>
        </section>
        <section
          className={styles.tableCard}
          aria-label="Professores cadastrados"
        >
          <div className={styles.tableHeader}>
            <h2>Contas de professores</h2>
            <span>
              {loading
                ? "Carregando..."
                : `${filtrados.length} ${filtrados.length === 1 ? "professor" : "professores"}`}
            </span>
          </div>
          {loading ? (
            <div className={styles.state}>Carregando professores...</div>
          ) : erroLista ? (
            <div className={styles.state}>
              Não foi possível carregar a lista.
              <button
                type="button"
                onClick={() => {
                  setErro("");
                  carregar();
                }}
              >
                Tentar novamente
              </button>
            </div>
          ) : filtrados.length === 0 ? (
            <div className={styles.empty}>
              <span>
                <GraduationCap size={25} />
              </span>
              <h3>
                {busca ? "Nenhum resultado" : "Nenhum professor cadastrado"}
              </h3>
              <p>
                {busca
                  ? "Tente buscar por outro nome, e-mail ou escola."
                  : "Cadastre uma conta para dar acesso ao painel do professor."}
              </p>
              {!busca ? (
                <Link className={styles.primary} href="/admin/professores/novo">
                  <Plus size={18} /> Cadastrar professor
                </Link>
              ) : null}
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Professor</th>
                    <th>Escola vinculada</th>
                    <th>Situação</th>
                    <th className={styles.actionsHead}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((professor) => (
                    <tr key={professor.id}>
                      <td>
                        <strong>{professor.nome}</strong>
                        <small>{professor.email}</small>
                      </td>
                      <td>
                        {(professor.escolas || [])
                          .map((escola) => escola.nome)
                          .filter(Boolean)
                          .join(", ") || "Escola não informada"}
                      </td>
                      <td>
                        <span className={styles.status}>Cadastrada</span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            aria-label={`Visualizar ${professor.nome}`}
                            onClick={() => visualizar(professor)}
                          >
                            <Eye size={16} />
                          </button>
                          <Link
                            href={`/admin/professores/${encodeURIComponent(professor.id)}`}
                            aria-label={`Editar ${professor.nome}`}
                          >
                            <Pencil size={16} />
                          </Link>
                          <button
                            type="button"
                            aria-label={`Excluir ${professor.nome}`}
                            onClick={() => excluir(professor)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <p className={styles.footnote}>
          A API não mantém um estado ativo/suspenso. “Cadastrada” indica que a
          conta existe; professores com turmas ou atividades vinculadas não
          podem ser excluídos.
        </p>
        {detalhe ? (
          <div
            className={styles.backdrop}
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setDetalhe(null);
            }}
          >
            <section
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="teacher-detail-title"
            >
              <header>
                <div>
                  <span>
                    <GraduationCap size={21} />
                  </span>
                  <div>
                    <h2 id="teacher-detail-title">Dados do professor</h2>
                    <p>Informações da conta cadastrada</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetalhe(null)}
                  aria-label="Fechar"
                >
                  <X size={20} />
                </button>
              </header>
              {detalheLoading ? (
                <div className={styles.state}>Carregando dados...</div>
              ) : detalhe.erro ? (
                <div className={styles.error} role="alert">
                  {detalhe.erro}
                </div>
              ) : (
                <dl>
                  <div>
                    <dt>Nome</dt>
                    <dd>{detalhe.nome}</dd>
                  </div>
                  <div>
                    <dt>E-mail</dt>
                    <dd>{detalhe.email}</dd>
                  </div>
                  <div>
                    <dt>Escola vinculada</dt>
                    <dd>
                      {(detalhe.escolas || [])
                        .map((escola) => escola.nome || escola.codigoPermanente)
                        .filter(Boolean)
                        .join(", ") || "Escola não informada"}
                    </dd>
                  </div>
                  <div>
                    <dt>Situação</dt>
                    <dd>
                      <span className={styles.status}>Cadastrada</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Criada em</dt>
                    <dd>
                      {detalhe.criadoEm
                        ? new Date(detalhe.criadoEm).toLocaleDateString(
                            "pt-BR",
                            { timeZone: "America/Sao_Paulo" },
                          )
                        : "Data indisponível"}
                    </dd>
                  </div>
                </dl>
              )}
              <footer>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => setDetalhe(null)}
                >
                  Fechar
                </button>
                {!detalheLoading && !detalhe.erro ? (
                  <Link
                    className={styles.primary}
                    href={`/admin/professores/${encodeURIComponent(detalhe.id)}`}
                  >
                    <Pencil size={16} /> Editar professor
                  </Link>
                ) : null}
              </footer>
            </section>
          </div>
        ) : null}
      </AdminLayout>
    </>
  );
}

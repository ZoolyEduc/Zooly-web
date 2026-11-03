import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import {
  Building2,
  CircleAlert,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import Notice from "../../components/Notice";
import { apiRequest } from "../../services/api";
import { getId } from "../../utils/formatacao";
import styles from "./escolas.module.css";

const vazio = {
  nome: "",
  codigoPermanente: "",
  cnpj: "",
  municipio: "",
  endereco: "",
  email: "",
  contato: "",
};
const fields = [
  ["nome", "Nome da escola", "text"],
  ["codigoPermanente", "Código permanente", "text"],
  ["cnpj", "CNPJ (opcional)", "text"],
  ["municipio", "Município", "text"],
  ["endereco", "Endereço", "text"],
  ["email", "E-mail", "email"],
  ["contato", "Contato", "text"],
];

export default function AdminSchools() {
  const [escolas, setEscolas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [erroLista, setErroLista] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(vazio);
  const [saving, setSaving] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroLista(false);
    try {
      const data = await apiRequest("/api/escolas");
      setEscolas(Array.isArray(data?.escolas) ? data.escolas : []);
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

  const filtradas = useMemo(() => {
    const term = busca.trim().toLocaleLowerCase("pt-BR");
    if (!term) return escolas;
    return escolas.filter((school) =>
      [
        school.nome,
        school.codigoPermanente,
        school.municipio,
        school.email,
      ].some((value) =>
        String(value || "")
          .toLocaleLowerCase("pt-BR")
          .includes(term),
      ),
    );
  }, [escolas, busca]);

  function abrir(escola = null) {
    setEditing(escola);
    setForm(
      escola
        ? Object.fromEntries(
            Object.keys(vazio).map((key) => [key, escola[key] || ""]),
          )
        : vazio,
    );
    setErro("");
    setSucesso("");
    setModal(true);
  }

  async function salvar(event) {
    event.preventDefault();
    setSaving(true);
    setErro("");
    setSucesso("");
    const payload = { ...form, cnpj: form.cnpj.trim() || null };
    try {
      const id = getId(editing);
      const data = await apiRequest(
        id ? `/api/escolas/${encodeURIComponent(id)}` : "/api/escolas",
        {
          method: id ? "PUT" : "POST",
          body: payload,
        },
      );
      setModal(false);
      setSucesso(
        data?.mensagem ||
          (id
            ? "Escola atualizada com sucesso."
            : "Escola cadastrada com sucesso."),
      );
      await carregar();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function excluir(escola) {
    const id = getId(escola);
    if (
      !id ||
      !window.confirm(
        `Excluir a escola “${escola.nome}”? Essa ação não pode ser desfeita.`,
      )
    )
      return;
    setErro("");
    setSucesso("");
    try {
      const data = await apiRequest(`/api/escolas/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setSucesso(data?.mensagem || "Escola excluída.");
      await carregar();
    } catch (error) {
      setErro(error.message);
    }
  }

  return (
    <>
      <Head>
        <title>Escolas | Administração Zooly</title>
      </Head>
      <AdminLayout
        title="Escolas"
        subtitle="Gerencie os cadastros das escolas vinculadas à plataforma."
      >
        {erro && !modal ? (
          <div className={styles.error} role="alert">
            <CircleAlert size={18} />
            {erro}
          </div>
        ) : null}
        {sucesso ? <Notice kind="success">{sucesso}</Notice> : null}
        <section className={styles.toolbar}>
          <label className={styles.search}>
            <Search size={18} />
            <input
              type="search"
              placeholder="Buscar por escola, código ou município"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </label>
          <button
            className={styles.primary}
            type="button"
            onClick={() => abrir()}
          >
            <Plus size={18} /> Cadastrar escola
          </button>
        </section>
        <section className={styles.tableCard} aria-label="Escolas cadastradas">
          <div className={styles.tableHeader}>
            <div>
              <h2>Escolas cadastradas</h2>
              <span>
                {loading
                  ? "Carregando..."
                  : `${filtradas.length} ${filtradas.length === 1 ? "registro" : "registros"}`}
              </span>
            </div>
          </div>
          {loading ? (
            <div className={styles.state}>Carregando escolas da API...</div>
          ) : erroLista ? (
            <div className={styles.state}>
              Não foi possível carregar a lista. Verifique sua sessão e tente
              novamente.{" "}
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
          ) : filtradas.length === 0 ? (
            <div className={styles.empty}>
              <span>
                <Building2 size={24} />
              </span>
              <h3>
                {busca ? "Nenhum resultado" : "Nenhuma escola cadastrada"}
              </h3>
              <p>
                {busca
                  ? "Ajuste a busca e tente novamente."
                  : "Cadastre uma escola para começar a organizar a plataforma."}
              </p>
              {!busca ? (
                <button
                  className={styles.primary}
                  type="button"
                  onClick={() => abrir()}
                >
                  <Plus size={18} /> Cadastrar escola
                </button>
              ) : null}
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Escola</th>
                    <th>Código</th>
                    <th>Município</th>
                    <th>Contato</th>
                    <th className={styles.actionsHead}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((escola, index) => (
                    <tr key={getId(escola) || `${escola.nome}-${index}`}>
                      <td>
                        <strong>{escola.nome}</strong>
                        <small>{escola.email || "E-mail não informado"}</small>
                      </td>
                      <td>{escola.codigoPermanente || "—"}</td>
                      <td>{escola.municipio || "—"}</td>
                      <td>{escola.contato || "—"}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            aria-label={`Editar ${escola.nome}`}
                            onClick={() => abrir(escola)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Excluir ${escola.nome}`}
                            onClick={() => excluir(escola)}
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
          Escolas vinculadas a turmas ou professores não podem ser excluídas
          pela API.
        </p>
        {modal ? (
          <div
            className={styles.backdrop}
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setErro("");
                setModal(false);
              }
            }}
          >
            <section
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="school-title"
            >
              <div className={styles.modalHeader}>
                <div>
                  <span className={styles.modalIcon}>
                    <Building2 size={20} />
                  </span>
                  <h2 id="school-title">
                    {editing ? "Editar escola" : "Cadastrar escola"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setErro("");
                    setModal(false);
                  }}
                  aria-label="Fechar"
                >
                  <X size={20} />
                </button>
              </div>
              {erro ? (
                <div className={styles.error} role="alert">
                  {erro}
                </div>
              ) : null}
              <form onSubmit={salvar}>
                <div className={styles.formGrid}>
                  {fields.map(([key, label, type]) => (
                    <label
                      key={key}
                      className={key === "endereco" ? styles.full : ""}
                    >
                      {label}
                      <input
                        type={type}
                        value={form[key]}
                        onChange={(event) =>
                          setForm({ ...form, [key]: event.target.value })
                        }
                        required={key !== "cnpj"}
                      />
                    </label>
                  ))}
                </div>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => {
                      setErro("");
                      setModal(false);
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={styles.primary}
                    disabled={saving}
                  >
                    {saving
                      ? "Salvando..."
                      : editing
                        ? "Salvar alterações"
                        : "Cadastrar escola"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : null}
      </AdminLayout>
    </>
  );
}

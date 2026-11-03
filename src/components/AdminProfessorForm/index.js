import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import Notice from "../Notice";
import AdminLayout from "../AdminLayout";
import { apiRequest } from "../../services/api";
import styles from "./AdminProfessorForm.module.css";

export default function AdminProfessorForm({ professorId }) {
  const router = useRouter();
  const editing = Boolean(professorId);
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    codigoPermanente: "",
    senha: "",
    confirmarSenha: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const [schoolData, teacherData] = await Promise.all([
          apiRequest("/api/escolas"),
          editing
            ? apiRequest(
                `/api/admin/professores/${encodeURIComponent(professorId)}`,
              )
            : Promise.resolve(null),
        ]);
        if (!active) return;
        setSchools(
          Array.isArray(schoolData?.escolas) ? schoolData.escolas : [],
        );
        const teacher = teacherData?.professor;
        if (teacher)
          setForm({
            nome: teacher.nome || "",
            email: teacher.email || "",
            codigoPermanente: teacher.escolas?.[0]?.codigoPermanente || "",
            senha: "",
            confirmarSenha: "",
          });
      } catch (error) {
        if (active) setErro(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [editing, professorId]);

  async function salvar(event) {
    event.preventDefault();
    setErro("");
    if (form.senha !== form.confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (!editing && form.senha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (editing && form.senha && form.senha.length < 8) {
      setErro("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setSaving(true);
    const body = {
      nome: form.nome.trim(),
      email: form.email.trim(),
      codigoPermanente: form.codigoPermanente,
      ...(form.senha ? { senha: form.senha } : {}),
    };
    try {
      const path = editing
        ? `/api/admin/professores/${encodeURIComponent(professorId)}`
        : "/api/admin/professores";
      await apiRequest(path, { method: editing ? "PUT" : "POST", body });
      await router.replace({
        pathname: "/admin/professores",
        query: { sucesso: editing ? "atualizado" : "criado" },
      });
    } catch (error) {
      setErro(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout
      title={editing ? "Editar professor" : "Cadastrar professor"}
      subtitle={
        editing
          ? "Atualize os dados e o vínculo escolar do professor."
          : "Crie o acesso do professor ao painel Zooly."
      }
    >
      <div className={styles.backRow}>
        <Link href="/admin/professores">
          <ArrowLeft size={17} /> Voltar para professores
        </Link>
      </div>
      {erro ? <Notice kind="error">{erro}</Notice> : null}
      {loading ? (
        <div className={styles.loading}>Carregando dados do formulário...</div>
      ) : (
        <form className={styles.formCard} onSubmit={salvar}>
          <div className={styles.sectionTitle}>
            <h2>Dados da conta</h2>
            <p>
              O professor usará este e-mail e senha na tela de login normal.
            </p>
          </div>
          <div className={styles.fields}>
            <label>
              Nome completo
              <input
                autoComplete="name"
                value={form.nome}
                onChange={(event) =>
                  setForm({ ...form, nome: event.target.value })
                }
                required
              />
            </label>
            <label>
              E-mail
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                required
              />
            </label>
            <label className={styles.full}>
              Escola vinculada
              <select
                value={form.codigoPermanente}
                onChange={(event) =>
                  setForm({ ...form, codigoPermanente: event.target.value })
                }
                required
              >
                <option value="">Selecione uma escola</option>
                {schools.map((school) => (
                  <option
                    key={school._id || school.id}
                    value={school.codigoPermanente}
                  >
                    {school.nome} · {school.codigoPermanente}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Senha
              {editing ? (
                <small>Deixe em branco para manter a senha atual.</small>
              ) : null}
              <input
                type="password"
                autoComplete={editing ? "new-password" : "new-password"}
                value={form.senha}
                onChange={(event) =>
                  setForm({ ...form, senha: event.target.value })
                }
                required={!editing}
                minLength={editing && !form.senha ? undefined : 8}
              />
            </label>
            <label>
              Confirmar senha
              <input
                type="password"
                autoComplete="new-password"
                value={form.confirmarSenha}
                onChange={(event) =>
                  setForm({ ...form, confirmarSenha: event.target.value })
                }
                required={!editing || Boolean(form.senha)}
              />
            </label>
          </div>
          {schools.length === 0 ? (
            <p className={styles.hint}>
              Cadastre uma escola antes de criar ou vincular um professor.
            </p>
          ) : null}
          <div className={styles.actions}>
            <Link className={styles.cancel} href="/admin/professores">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving || loading || schools.length === 0}
            >
              <Save size={17} />
              {saving
                ? "Salvando..."
                : editing
                  ? "Salvar alterações"
                  : "Cadastrar professor"}
            </button>
          </div>
        </form>
      )}
    </AdminLayout>
  );
}

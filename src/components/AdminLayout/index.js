import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  Building2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { clearSession, getSession } from "../../services/session";
import styles from "./AdminLayout.module.css";
import Logo from "../Logo";

const links = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/escolas", label: "Escolas", icon: Building2 },
  { href: "/admin/professores", label: "Professores", icon: GraduationCap },
];

export default function AdminLayout({ title, subtitle, children }) {
  const router = useRouter();
  const [state, setState] = useState({ ready: false, usuario: null });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      const session = getSession();
      if (!session.token || session.usuario?.tipo !== "administrador") {
        router.replace("/admin/login");
        return;
      }
      if (active) setState({ ready: true, usuario: session.usuario });
    });
    return () => {
      active = false;
    };
  }, [router]);

  function sair() {
    clearSession();
    router.replace("/admin/login");
  }

  if (!state.ready)
    return (
      <main className={styles.checking}>
        Verificando acesso administrativo...
      </main>
    );

  return (
    <div className={styles.shell}>
      <aside
        className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}
      >
        <Logo size="lg" href="/admin" className={styles.brand} />
        <p className={styles.caption}>ADMINISTRAÇÃO GERAL</p>
        <nav aria-label="Menu administrativo" className={styles.nav}>
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`${styles.navLink} ${router.pathname === href || (href !== "/admin" && router.pathname.startsWith(`${href}/`)) ? styles.active : ""}`}
            >
              <Icon size={18} aria-hidden="true" /> {label}
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <button type="button" className={styles.logout} onClick={sair}>
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>
      {menuOpen ? (
        <button
          type="button"
          className={styles.scrim}
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <button
            className={styles.menuButton}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className={styles.topbarTitle}>Painel Zooly</div>
          <div className={styles.identity}>
            <span className={styles.avatar}>
              {(state.usuario?.nome || "A").charAt(0).toUpperCase()}
            </span>
            <span>
              <strong>{state.usuario?.nome || "Administrador"}</strong>
              <small>ADMINISTRADOR GERAL</small>
            </span>
          </div>
        </header>
        <main className={styles.content}>
          <div className={styles.heading}>
            <div>
              <h1>{title}</h1>
              {subtitle ? <p>{subtitle}</p> : null}
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

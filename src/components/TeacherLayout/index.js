import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { clearSession, getSession } from "../../services/session";
import { demoEnabled } from "../../services/demo";
import styles from "./TeacherLayout.module.css";
import Logo from "../Logo";

const navigation = [
  { href: "/painel", label: "Visão geral", symbol: "⌂" },
  { href: "/turmas", label: "Turmas e alunos", symbol: "♧" },
  { href: "/atividades", label: "Atividades", symbol: "▤" },
  { href: "/desempenho", label: "Desempenho", symbol: "↗" },
];

export default function TeacherLayout({ title, subtitle, children }) {
  const router = useRouter();
  const [mostrarSaida, setMostrarSaida] = useState(false);
  const [menuMobile, setMenuMobile] = useState(false);
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  
  // NOVO: Estado para o menu do perfil
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);

  const [sessionState, setSessionState] = useState({
    ready: false,
    usuario: null,
  });
  const { ready, usuario } = sessionState;

  // --- Estado para a barra de pesquisa ---
  const [termoBusca, setTermoBusca] = useState("");

  function executarBusca(event) {
    event.preventDefault();
    if (!termoBusca.trim()) return;
    alert(`Buscando por: ${termoBusca}`);
  }

  useEffect(() => {
    let ativo = true;
    Promise.resolve().then(() => {
      if (!ativo) return;
      const session = getSession();
      if (!demoEnabled() && !session.token) {
        router.replace("/login");
        return;
      }
      setSessionState({ ready: true, usuario: session.usuario });
    });
    return () => {
      ativo = false;
    };
  }, [router]);

  // NOVO: Fechar o menu do perfil ao clicar fora dele
  useEffect(() => {
    function fecharMenu(event) {
      if (menuPerfilAberto && !event.target.closest(`.${styles.profileMenuWrap}`)) {
        setMenuPerfilAberto(false);
      }
    }
    document.addEventListener("mousedown", fecharMenu);
    return () => document.removeEventListener("mousedown", fecharMenu);
  }, [menuPerfilAberto]);

  function sair() {
    clearSession();
    router.replace("/login");
  }

  if (!ready) {
    return (
      <main className={styles.checking}>
        Verificando sua sessão do Zooly...
      </main>
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Logo size="lg" href="/painel" className={styles.brand} />
        <div className={styles.sideCaption}>ESPAÇO DO PROFESSOR</div>
        <button
          type="button"
          className={styles.mobileMenuButton}
          onClick={() => setMenuMobile((open) => !open)}
          aria-expanded={menuMobile}
        >
          ☰ <span>Menu</span>
        </button>
        <nav
          className={`${styles.nav} ${menuMobile ? styles.navOpen : ""}`}
          aria-label="Menu do professor"
        >
          {navigation
            .filter(
              (item) =>
                !["/login", "/cadastro", "/configuracoes"].includes(item.href)
            )
            .map((item) => {
              const active =
                router.pathname === item.href ||
                (item.href !== "/painel" &&
                  router.pathname.startsWith(item.href));
              return (
                <Link
                  href={item.href}
                  key={item.href}
                  className={`${styles.navItem} ${active ? styles.active : ""}`}
                >
                  <span className={styles.navSymbol} aria-hidden="true">
                    {item.symbol}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
        </nav>
        <div className={styles.sidebarBottom}>
          <Link
            href="/configuracoes"
            className={`${styles.navItem} ${
              router.pathname === "/configuracoes" ? styles.active : ""
            }`}
          >
            <span className={styles.navSymbol} aria-hidden="true">
              ⚙
            </span>
            <span>Configurações</span>
          </Link>
          <button
            type="button"
            className={styles.logout}
            onClick={() => setMostrarSaida(true)}
          >
            <span aria-hidden="true">↪</span> Sair
          </button>
        </div>
      </aside>

      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <form className={styles.search} onSubmit={executarBusca}>
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="search"
              placeholder="Pesquisar..."
              aria-label="Pesquisar"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
          </form>
          
          <div className={styles.profile}>
            <div className={styles.notificationWrap}>
              <button
                type="button"
                className={styles.notificationButton}
                aria-label="Notificações"
                aria-expanded={notificacoesAbertas}
                onClick={() => setNotificacoesAbertas((open) => !open)}
              >
                <i />
              </button>
              {notificacoesAbertas ? (
                <div className={styles.notificationPanel}>
                  <strong>Notificações</strong>
                  <p>Você está em dia! Nenhuma notificação nova.</p>
                </div>
              ) : null}
            </div>
            
            <span className={styles.profileDivider} />
            
            {/* NOVO: Menu do Perfil */}
            <div className={styles.profileMenuWrap}>
              <button 
                type="button" 
                className={styles.profileButton}
                onClick={() => setMenuPerfilAberto(!menuPerfilAberto)}
                aria-expanded={menuPerfilAberto}
              >
                <div className={styles.avatar}>
                  {(usuario?.nome || "P").trim().charAt(0).toUpperCase()}
                </div>
                <div className={styles.profileInfo}>
                  <strong>{usuario?.nome || "Professor(a)"}</strong>
                  <span>PROFESSOR(A)</span>
                </div>
              </button>

              {menuPerfilAberto ? (
                <div className={styles.profileDropdown}>
                  <Link 
                    href="/configuracoes" 
                    className={styles.dropdownItem}
                    onClick={() => setMenuPerfilAberto(false)}
                  >
                    ⚙ Minhas Configurações
                  </Link>
                  <button 
                    type="button" 
                    className={styles.dropdownItem} 
                    onClick={() => {
                      setMenuPerfilAberto(false);
                      setMostrarSaida(true);
                    }}
                  >
                    ↪ Sair da conta
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        
        <main className={styles.content}>
          <div className={styles.pageHeading}>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {children}
        </main>
      </div>

      {mostrarSaida ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMostrarSaida(false);
          }}
        >
          <section
            className={styles.exitModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-title"
          >
            <div className={styles.exitIcon}>↪</div>
            <h2 id="exit-title">Deseja sair?</h2>
            <p>Você será desconectado da sua conta Zooly.</p>
            <div>
              <button type="button" onClick={() => setMostrarSaida(false)}>
                Cancelar
              </button>
              <button type="button" onClick={sair}>
                Sair
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
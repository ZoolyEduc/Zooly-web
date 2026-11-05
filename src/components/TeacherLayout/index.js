import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  House,
  LogOut,
  Menu,
  Search,
  Settings,
  UsersRound,
  X,
} from "lucide-react";
import { clearSession, getSession } from "../../services/session";
import styles from "./TeacherLayout.module.css";
import Logo from "../Logo";

const navigation = [
  { href: "/painel", label: "Home", icon: House },
  { href: "/turmas", label: "Turmas", icon: UsersRound },
  { href: "/atividades", label: "Atividades", icon: ClipboardList },
  { href: "/historias", label: "Histórias", icon: BookOpen },
  {
    href: "/desempenho",
    label: "Desempenho",
    icon: ChartNoAxesColumnIncreasing,
  },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

// Min\u00fasculas e sem acentos, para a busca de telas.
function semAcento(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export default function TeacherLayout({ title, subtitle, actions, children }) {
  const router = useRouter();
  const [mostrarSaida, setMostrarSaida] = useState(false);
  const [menuMobile, setMenuMobile] = useState(false);
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);

  const [sessionState, setSessionState] = useState({
    ready: false,
    usuario: null,
  });
  const { ready, usuario } = sessionState;

  // Barra de pesquisa: leva \u00e0 tela do menu cujo nome combina com o termo.
  const [termoBusca, setTermoBusca] = useState("");
  const [mensagemBusca, setMensagemBusca] = useState("");

  function executarBusca(event) {
    event.preventDefault();
    const termo = semAcento(termoBusca.trim());
    if (!termo) return;

    const pagina = navigation.find((item) => {
      const rotulo = semAcento(item.label);
      return rotulo.includes(termo) || termo.includes(rotulo);
    });

    if (pagina) {
      setMensagemBusca("");
      setMenuMobile(false);
      router.push(pagina.href);
    } else {
      setMensagemBusca("Nenhuma tela encontrada para essa busca.");
    }
  }

  useEffect(() => {
    let ativo = true;
    Promise.resolve().then(() => {
      if (!ativo) return;
      const session = getSession();
      if (!session.token || session.usuario?.tipo !== "professor") {
        router.replace("/login");
        return;
      }
      setSessionState({ ready: true, usuario: session.usuario });
    });
    return () => {
      ativo = false;
    };
  }, [router]);

  // Fecha o menu do perfil ao clicar fora dele.
  useEffect(() => {
    function fecharMenu(event) {
      if (
        menuPerfilAberto &&
        !event.target.closest(`.${styles.profileMenuWrap}`)
      ) {
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
          {menuMobile ? <X size={18} /> : <Menu size={18} />}
          <span>Menu</span>
        </button>
        <nav
          className={`${styles.nav} ${menuMobile ? styles.navOpen : ""}`}
          aria-label="Menu do professor"
        >
          {navigation
            .filter((item) => item.href !== "/configuracoes")
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
                  <item.icon
                    className={styles.navSymbol}
                    size={18}
                    aria-hidden="true"
                  />
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
            <Settings
              className={styles.navSymbol}
              size={18}
              aria-hidden="true"
            />
            <span>Configurações</span>
          </Link>
          <button
            type="button"
            className={styles.logout}
            onClick={() => setMostrarSaida(true)}
          >
            <LogOut size={18} aria-hidden="true" /> Sair
          </button>
        </div>
      </aside>

      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <form className={styles.search} onSubmit={executarBusca}>
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar telas..."
              aria-label="Pesquisar"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
            {mensagemBusca ? (
              <span className={styles.searchMessage} role="status">
                {mensagemBusca}
              </span>
            ) : null}
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
                <Bell size={19} aria-hidden="true" />
              </button>
              {notificacoesAbertas ? (
                <div className={styles.notificationPanel}>
                  <strong>Notificações</strong>
                  <p>A API atual ainda não disponibiliza notificações.</p>
                </div>
              ) : null}
            </div>

            <span className={styles.profileDivider} />

            <div className={styles.profileMenuWrap}>
              <button
                type="button"
                className={styles.profileButton}
                onClick={() => setMenuPerfilAberto((aberto) => !aberto)}
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
                    <Settings size={16} aria-hidden="true" />
                    Minhas Configurações
                  </Link>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      setMenuPerfilAberto(false);
                      setMostrarSaida(true);
                    }}
                  >
                    <LogOut size={16} aria-hidden="true" />
                    Sair da conta
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className={styles.content}>
          {title || subtitle || actions ? (
            <div className={styles.pageHeading}>
              <div className={styles.pageHeadingText}>
                {title ? <h1>{title}</h1> : null}
                {subtitle ? <p>{subtitle}</p> : null}
              </div>
              {actions ? (
                <div className={styles.pageActions}>{actions}</div>
              ) : null}
            </div>
          ) : null}
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
            <div className={styles.exitIcon}>
              <LogOut size={30} aria-hidden="true" />
            </div>
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

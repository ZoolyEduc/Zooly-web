import { useState } from "react";
import Link from "next/link";
import { Menu as MenuIcon, X } from "lucide-react";
import styles from "./Menu.module.css";
import Logo from "@/components/Logo";

export default function Menu() {
  const [aberto, setAberto] = useState(false);
  const fechar = () => setAberto(false);

  return (
    <header className={styles.menu}>
      <Logo size="md" href="/" priority className={styles.brand} />

      <button
        type="button"
        className={styles.toggle}
        onClick={() => setAberto((valor) => !valor)}
        aria-expanded={aberto}
        aria-controls="menu-principal"
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
      >
        {aberto ? <X size={22} /> : <MenuIcon size={22} />}
      </button>

      <nav
        id="menu-principal"
        className={`${styles.navigation} ${aberto ? styles.open : ""}`}
        aria-label="Navegação principal"
      >
        <a href="#sobre" onClick={fechar}>
          O Zooly
        </a>
        <a href="#como-funciona" onClick={fechar}>
          Como funciona
        </a>
        <Link href="/login" className={styles.login} onClick={fechar}>
          Entrar
        </Link>
      </nav>
    </header>
  );
}

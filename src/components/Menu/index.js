import Link from "next/link";
import styles from "./Menu.module.css";
import Logo from "@/components/Logo";

export default function Menu() {
  return (
    <header className={styles.menu}>
      <Logo size="md" href="/" priority className={styles.brand} />
      
      <nav className={styles.navigation} aria-label="Navegação principal">
        <a href="#sobre">O Zooly</a>
        <a href="#como-funciona">Como funciona</a>
        <Link href="/painel">Área do professor</Link>
        <Link href="/login" className={styles.login}>
          Entrar
        </Link>
      </nav>
    </header>
  );
}
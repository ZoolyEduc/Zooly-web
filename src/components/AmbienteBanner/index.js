import styles from "./AmbienteBanner.module.css";

export default function AmbienteBanner() {
  if (process.env.NEXT_PUBLIC_AMBIENTE !== "demonstracao") return null;
  return (
    <>
      {/* Elementos fixos, como a barra lateral do admin, descontam a altura da faixa. */}
      <style>{":root{--altura-faixa:32px}"}</style>
      <div className={styles.banner} role="status">
        Ambiente de demonstração · dados fictícios
      </div>
    </>
  );
}

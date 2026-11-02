import styles from "./StatCard.module.css";

export default function StatCard({ label, value, helper, symbol = "•" }) {
  return (
    <article className={styles.card}>
      <div className={styles.icon} aria-hidden="true">
        {symbol}
      </div>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      {helper ? <p className={styles.helper}>{helper}</p> : null}
    </article>
  );
}

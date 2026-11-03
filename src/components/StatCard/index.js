import { CircleHelp } from "lucide-react";
import styles from "./StatCard.module.css";

export default function StatCard({
  label,
  value,
  helper,
  icon: Icon = CircleHelp,
}) {
  return (
    <article className={styles.card}>
      <div className={styles.icon} aria-hidden="true">
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      {helper ? <p className={styles.helper}>{helper}</p> : null}
    </article>
  );
}

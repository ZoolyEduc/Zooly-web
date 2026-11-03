import styles from "./Notice.module.css";

export default function Notice({ kind = "info", children }) {
  if (!children) return null;
  return (
    <div
      className={`${styles.notice} ${styles[kind] || styles.info}`}
      role={kind === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}

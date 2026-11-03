import { useEffect, useRef } from "react";
import { TriangleAlert } from "lucide-react";
import styles from "./ConfirmDialog.module.css";

/**
 * Confirmação em janela modal (mesmo visual do "Deseja sair?" do painel).
 * Esc ou clique fora cancelam. `perigo` destaca ações destrutivas.
 */
export default function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  confirmar = "Confirmar",
  cancelar = "Cancelar",
  perigo = false,
  ocupado = false,
  onConfirmar,
  onCancelar,
}) {
  const botaoCancelar = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;
    botaoCancelar.current?.focus();
    function aoTeclar(event) {
      if (event.key === "Escape" && !ocupado) onCancelar?.();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto, ocupado, onCancelar]);

  if (!aberto) return null;
  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !ocupado) onCancelar?.();
      }}
    >
      <section
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <div className={`${styles.icon} ${perigo ? styles.danger : ""}`}>
          <TriangleAlert size={28} aria-hidden="true" />
        </div>
        <h2 id="confirm-dialog-title">{titulo}</h2>
        <p id="confirm-dialog-message">{mensagem}</p>
        <div className={styles.actions}>
          <button
            type="button"
            ref={botaoCancelar}
            onClick={onCancelar}
            disabled={ocupado}
          >
            {cancelar}
          </button>
          <button
            type="button"
            className={perigo ? styles.dangerButton : ""}
            onClick={onConfirmar}
            disabled={ocupado}
          >
            {ocupado ? "Aguarde..." : confirmar}
          </button>
        </div>
      </section>
    </div>
  );
}

import { CheckCircle2 } from "lucide-react";
import styles from "./HistoriaPreview.module.css";

/**
 * Texto e perguntas de uma história do banco, como o professor vê (com a resposta correta,
 * o feedback e o objetivo). Usado no detalhe e na pré-visualização do formulário.
 * É uma tela exclusiva do professor: o aluno nunca recebe esses dados.
 */
export default function HistoriaPreview({
  historia,
  mostrarTexto = true,
  mostrarPerguntas = true,
}) {
  const perguntas = historia?.perguntas ?? [];
  return (
    <>
      {mostrarTexto ? (
        <>
          <p className={styles.storyText}>
            {historia?.conteudo?.trim() || "Sem texto."}
          </p>
          {historia?.nota ? (
            <p className={styles.note}>{historia.nota}</p>
          ) : null}
        </>
      ) : null}
      {!mostrarPerguntas ? null : perguntas.length ? (
        perguntas.map((pergunta, indice) => (
          <section
            className={styles.question}
            key={pergunta._id ?? pergunta.key ?? indice}
            aria-label={`Pergunta ${indice + 1}`}
          >
            <h3>
              {indice + 1}. {pergunta.enunciado || "Pergunta sem enunciado"}
            </h3>
            <ol className={styles.options}>
              {pergunta.alternativas.map((alternativa, i) => {
                const correta = i === pergunta.alternativaCorreta;
                return (
                  <li
                    key={alternativa._id ?? alternativa.key ?? i}
                    className={correta ? styles.correct : ""}
                  >
                    <span className={styles.letter} aria-hidden="true">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{alternativa.texto || "—"}</span>
                    {correta ? (
                      <>
                        <CheckCircle2 size={15} aria-hidden="true" />
                        <span className={styles.srOnly}>
                          (resposta correta)
                        </span>
                      </>
                    ) : null}
                  </li>
                );
              })}
            </ol>
            {pergunta.feedback || pergunta.objetivoPedagogico ? (
              <div className={styles.support}>
                {pergunta.objetivoPedagogico ? (
                  <p>
                    <strong>Objetivo:</strong> {pergunta.objetivoPedagogico}
                  </p>
                ) : null}
                {pergunta.feedback ? (
                  <p>
                    <strong>Feedback:</strong> {pergunta.feedback}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        ))
      ) : (
        <p className={styles.note}>Esta história ainda não tem perguntas.</p>
      )}
    </>
  );
}

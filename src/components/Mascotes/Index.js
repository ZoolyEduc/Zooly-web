import Image from "next/image";
import styles from "./Mascote.module.css";

export const mascotes = [
  {
    id: "papagaio",
    nome: "Papagaio",
    srcBotao: "/img/papagaio-botao.png",
    srcVetor: "/img/papagaio-vetor.png",
  },
  {
    id: "lagarto",
    nome: "Lagarto",
    srcBotao: "/img/lagarto-botao.png",
    srcVetor: "/img/lagarto-vetor.png",
  },
  {
    id: "cobra",
    nome: "Cobra",
    srcBotao: "/img/cobra-botao.png",
    srcVetor: "/img/cobra-vetor.png",
  },
  {
    id: "sarue",
    nome: "Saruê",
    srcBotao: "/img/sarue-botao.png",
    srcVetor: "/img/sarue-vetor.png",
  },
];

export default function Mascote({
  id,
  nome,
  src, // (Opcional) Força uma imagem específica
  srcBotao, // (Opcional) Se não passar "src"
  srcVetor, // (Opcional) Se não passar "src"
  size = "md",
  variant, // "botao" | "vetor" (Opcional) Força a variante
  isSelected = false,
  onClick,
}) {
  // 1. Decide se é botão ou não
  const isButton = typeof onClick === "function";

  // 2. Escolhe a imagem baseada na variante ou no contexto
  let imagemFinal = src; // Se passou src direto, usa
  if (!imagemFinal) {
    const usarBotao = variant === "botao" || (isButton && variant !== "vetor");
    imagemFinal = usarBotao ? srcBotao : srcVetor;
  }

  const content = (
    <>
      <div className={styles.imageWrapper}>
        <Image
          src={imagemFinal}
          alt={`Mascote ${nome}`}
          width={120}
          height={120}
          className={styles.image}
        />
      </div>
      {nome && <span className={styles.name}>{nome}</span>}
    </>
  );

  // 3. Se for botão (tem onClick), renderiza um <button>
  if (isButton) {
    return (
      <button
        type="button"
        className={`${styles.card} ${styles[size]} ${
          isSelected ? styles.selected : ""
        }`}
        onClick={() => onClick(id)}
        aria-pressed={isSelected}
      >
        {content}
      </button>
    );
  }

  // 4. Se não for botão, renderiza uma <div> estática
  return <div className={`${styles.card} ${styles[size]}`}>{content}</div>;
}

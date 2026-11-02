import Image from "next/image";
import Link from "next/link";
import styles from "./Logo.module.css";

export default function Logo({
  size = "md",
  href = "/",
  priority = true,
  className = "",
}) {
  const baseClass = `${styles.logo} ${styles[size]} ${className}`.trim();

  const content = (
    <Image
      src="/img/Logo.png"
      alt="Zooly Education"
      width={180}
      height={60}
      priority={priority}
      className={styles.img}
    />
  );

  if (!href) {
    return <div className={baseClass}>{content}</div>;
  }

  return (
    <Link href={href} className={baseClass} aria-label="Zooly, página inicial">
      {content}
    </Link>
  );
}
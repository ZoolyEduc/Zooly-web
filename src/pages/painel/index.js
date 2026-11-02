import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import TeacherLayout from "../../components/TeacherLayout";
import StatCard from "../../components/StatCard";
import styles from "./painel.module.css";

const historico = [
  {
    nome: "Lucas Silva",
    fonema: "/b/",
    palavras: "Bola, Bala, Bule",
    score: 80,
    data: "18 Mar, 2026",
    mascote: "/img/cobra-botao.png",
  },
  {
    nome: "Ana Clara",
    fonema: "/v/",
    palavras: "Vaca, Vela, Vento",
    score: 93,
    data: "19 Mar, 2026",
    mascote: "/img/lagarto-botao.png",
  },
  {
    nome: "Felipe Santos",
    fonema: "/r/",
    palavras: "Rato, Roda, Rua",
    score: 60,
    data: "20 Mar, 2026",
    mascote: "/img/papagaio-botao.png",
  },
];

export default function Painel() {
  return (
    <>
      <Head>
        <title>Home | Zooly</title>
      </Head>
      <TeacherLayout
        title="Olá, Helena Ferreira!"
        subtitle="Aqui está um resumo das suas turmas e atividades."
      >
        <section className={styles.stats} aria-label="Indicadores gerais">
          <StatCard label="TOTAL DE TURMAS" value="2" symbol="♧" />
          <StatCard label="ALUNOS ATIVOS" value="4" symbol="♙" />
          <StatCard label="MISSÕES EM OK" value="0" symbol="✿" />
          <StatCard label="ÚLTIMA MISSÃO" value="20/03/2026" symbol="▣" />
        </section>
        <section className={styles.history}>
          <div className={styles.historyHead}>
            <div>
              <h2>Histórico de Desempenho</h2>
              <p>Acompanhamento individual de progresso fonético</p>
            </div>
            <Link href="/desempenho">Ver Relatório Completo</Link>
          </div>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Estudante</th>
                  <th>Fonema</th>
                  <th>Palavras</th>
                  <th>Score</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((item) => (
                  <tr key={item.nome}>
                    <td>
                      <div className={styles.student}>
                        <Image src={item.mascote} alt="" width={40} height={40} />
                        <strong>{item.nome}</strong>
                      </div>
                    </td>
                    <td>
                      <span className={styles.phoneme}>{item.fonema}</span>
                    </td>
                    <td>{item.palavras}</td>
                    <td>
                      <div className={styles.score}>
                        <span>
                          <i style={{ width: `${item.score}%` }} />
                        </span>
                        <strong className={item.score < 70 ? styles.low : ""}>
                          {item.score}%
                        </strong>
                      </div>
                    </td>
                    <td>{item.data}</td>
                    <td>
                      <Link
                        className={styles.more}
                        href="/desempenho"
                        aria-label={`Ver desempenho de ${item.nome}`}
                      >
                        ⋮
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </TeacherLayout>
    </>
  );
}

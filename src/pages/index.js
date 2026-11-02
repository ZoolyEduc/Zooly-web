import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import Menu from "../components/Menu";
import styles from "./landing.module.css";

export default function Home() {
  return (
    <div className={styles.site}>
      <Head>
        <title>Zooly Education | Aprender a ler é uma aventura</title>
        <meta
          name="description"
          content="O Zooly transforma atividades de leitura em missões divertidas com histórias, personagens e acompanhamento para quem ensina."
        />
      </Head>

      <Menu />

      <main>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>EDUCAÇÃO • JOGO • DESCOBERTA</span>
            <h1>
              Aprender a ler pode <br />
              virar uma grande <em>aventura.</em>
            </h1>
            <p>
              O Zooly transforma atividades de leitura em missões divertidas,
              com histórias, personagens e acompanhamento para quem ensina.
            </p>
            <div className={styles.actions}>
              <Link href="/cadastro" className={styles.primary}>
                Começar como professor <span>→</span>
              </Link>
              <Link href="/login" className={styles.secondary}>
                Já tenho uma conta
              </Link>
            </div>
            <div className={styles.microcopy}>
              <span className={styles.dot} /> Um espaço de aprendizagem pensado
              para crianças
            </div>
          </div>

          <div className={styles.heroVisual}>
            {/* Container que gira a roda gigante */}
            <div className={styles.containerCirculo}>
              {/* Anel colorido de fundo */}
              <div className={styles.visualCircle}></div>

              {/* Mascote 1 (Topo) */}
              <div className={`${styles.mascotPonto} ${styles.mascote1}`}>
                <div className={styles.mascotConteudo}>
                  <Image
                    src="/img/cobra-vetor.png"
                    alt="Cobra"
                    width={112}
                    height={112}
                    style={{ objectFit: "contain" }}
                  />
                  <span>Cobra</span>
                </div>
              </div>

              {/* Mascote 2 (Direita) */}
              <div className={`${styles.mascotPonto} ${styles.mascote2}`}>
                <div className={styles.mascotConteudo}>
                  <Image
                    src="/img/lagarto-vetor.png"
                    alt="Lagarto"
                    width={112}
                    height={112}
                    style={{ objectFit: "contain" }}
                  />
                  <span>Lagarto</span>
                </div>
              </div>

              {/* Mascote 3 (Base) */}
              <div className={`${styles.mascotPonto} ${styles.mascote3}`}>
                <div className={styles.mascotConteudo}>
                  <Image
                    src="/img/papagaio-vetor.png"
                    alt="Papagaio"
                    width={112}
                    height={112}
                    style={{ objectFit: "contain" }}
                  />
                  <span>Papagaio</span>
                </div>
              </div>

              {/* Mascote 4 (Esquerda) */}
              <div className={`${styles.mascotPonto} ${styles.mascote4}`}>
                <div className={styles.mascotConteudo}>
                  <Image
                    src="/img/sarue-vetor.png"
                    alt="Saruê"
                    width={112}
                    height={112}
                    style={{ objectFit: "contain" }}
                  />
                  <span>Saruê</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.about}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>CONHEÇA O ZOOLY</span>
            <h2>Uma jornada educativa que respeita o ritmo de cada criança</h2>
            <p>
              Combinamos metodologias de alfabetização com elementos de jogos
              para manter os alunos engajados e os professores no controle.
            </p>
          </div>
          <div className={styles.featureGrid}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📚</div>
              <h3>Leitura guiada</h3>
              <p>
                Histórias interativas que se adaptam ao nível de leitura do
                aluno.
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🏆</div>
              <h3>Missões e recompensas</h3>
              <p>
                Desafios e conquistas que transformam o progresso em diversão.
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📊</div>
              <h3>Dados para o professor</h3>
              <p>
                Relatórios claros sobre o avanço de cada aluno e da turma.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.how}>
          <div>
            <span className={styles.eyebrow}>COMO FUNCIONA</span>
            <h2>Pronto para começar a aventura?</h2>
            <p>
              Em poucos passos você cria sua conta, organiza suas turmas e
              convida seus alunos para o mundo do Zooly.
            </p>
          </div>
          <div className={styles.steps}>
            <div>
              <span>1</span>
              <strong>Crie sua conta</strong>
              <p>
                Cadastre-se gratuitamente como professor e configure seu perfil.
              </p>
            </div>
            <div>
              <span>2</span>
              <strong>Monte suas turmas</strong>
              <p>
                Adicione seus alunos e escolha os mascotes de cada grupo.
              </p>
            </div>
            <div>
              <span>3</span>
              <strong>Acompanhe o progresso</strong>
              <p>
                Acesse relatórios detalhados e veja a evolução em tempo real.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <div>
            <h2>Pronto para transformar a leitura em uma aventura?</h2>
            <p>Junte-se a centenas de professores que já usam o Zooly.</p>
          </div>
          <Link href="/cadastro" className={styles.primary}>
            Criar conta gratuita
          </Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} Zooly Education. Todos os direitos reservados.</span>
        <span>Feito com carinho para educadores e crianças.</span>
      </footer>
    </div>
  );
}
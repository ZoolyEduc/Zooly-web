// Dados efêmeros do navegador para navegar pelo front-end sem o Zooly-api.
const agora = "2026-10-27T12:00:00.000Z";

export const turmasDemo = [
  {
    _id: "demo-turma-1",
    nome: "1º Ano A",
    escola: { nome: "Escola do Vale" },
    escolaId: "demo-escola",
    anoEscolar: 2026,
    codigoPermanente: "VALE-1A",
    periodo: "Manhã",
    mascote: "sarue",
  },
  {
    _id: "demo-turma-2",
    nome: "2º Ano B",
    escola: { nome: "Escola do Vale" },
    escolaId: "demo-escola",
    anoEscolar: 2026,
    codigoPermanente: "VALE-2B",
    periodo: "Tarde",
    mascote: "papagaio",
  },
];

export const alunosDemo = [
  {
    _id: "demo-aluno-1",
    nomeCompleto: "Lucas Machado",
    email: "lucas.machado@zooly.com",
    turma: "demo-turma-1",
    sexo: "masculino",
    cadastroInicialConcluido: true,
    progresso: 85,
    createdAt: agora,
  },
  {
    _id: "demo-aluno-2",
    nomeCompleto: "Matheus Rodrigues",
    email: "matheus.r@zooly.com",
    turma: "demo-turma-1",
    sexo: "masculino",
    cadastroInicialConcluido: true,
    progresso: 40,
    createdAt: agora,
  },
  {
    _id: "demo-aluno-3",
    nomeCompleto: "Helena Ferreira",
    email: "helena.f@zooly.com",
    turma: "demo-turma-2",
    sexo: "feminino",
    cadastroInicialConcluido: true,
    progresso: 92,
    createdAt: agora,
  },
  {
    _id: "demo-aluno-4",
    nomeCompleto: "Beatriz Souza",
    email: "b.souza@zooly.com",
    turma: "demo-turma-2",
    sexo: "feminino",
    cadastroInicialConcluido: false,
    progresso: 15,
    createdAt: agora,
  },
];

export const atividadesDemo = [
  {
    _id: "demo-atividade-1",
    turma: "demo-turma-1",
    titulo: "Aventura na Caverna",
    publicadoEm: agora,
    recompensaMoedas: 10,
    ordem: 1,
    historia: { tipo: "propria", texto: "Uma aventura entre as pedras e os sons da caverna." },
    questoes: [{
      enunciado: "Qual palavra começa com o som indicado?",
      alternativas: [{ texto: "Bola" }, { texto: "Vela" }],
    }],
    status: "publicada",
  },
  {
    _id: "demo-atividade-2",
    turma: "demo-turma-2",
    titulo: "Caça às Patas",
    publicadoEm: agora,
    recompensaMoedas: 15,
    ordem: 2,
    historia: { tipo: "propria", texto: "Uma caça divertida pelas patas dos animais." },
    questoes: [{
      enunciado: "Qual palavra começa com o som indicado?",
      alternativas: [{ texto: "Pato" }, { texto: "Bola" }],
    }],
    status: "publicada",
  },
  {
    _id: "demo-atividade-3",
    turma: "demo-turma-1",
    titulo: "Leitura Guiada",
    publicadoEm: agora,
    recompensaMoedas: 20,
    ordem: 3,
    historia: { tipo: "propria", texto: "Uma leitura guiada para descobrir novas palavras." },
    questoes: [{
      enunciado: "Qual palavra começa com o som indicado?",
      alternativas: [{ texto: "Vento" }, { texto: "Rato" }],
    }],
    status: "publicada",
  },
  {
    _id: "demo-atividade-4",
    turma: "demo-turma-2",
    titulo: "Eco das Vogais",
    publicadoEm: agora,
    recompensaMoedas: 10,
    ordem: 4,
    historia: { tipo: "propria", texto: "Um passeio pelas vogais e seus sons." },
    questoes: [{
      enunciado: "Qual destas é uma vogal?",
      alternativas: [{ texto: "A" }, { texto: "B" }],
    }],
    status: "publicada",
  },
];

export const historiasDemo = [
  { _id: "demo-historia-1", titulo: "O passeio da capivara", conteudo: "A capivara passeou pela margem do rio e encontrou novos amigos." },
  { _id: "demo-historia-2", titulo: "O papagaio curioso", conteudo: "Um papagaio curioso aprendeu a reconhecer palavras na floresta." },
];

export function demoEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_MODO_DEMO === "true"
  );
}

export function demoResponse(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const url = new URL(path, "http://zooly.local");
  const route = url.pathname;

  if (route === "/api/auth/login" && method === "POST") {
    return {
      token: "demo-token-local",
      usuario: {
        id: "demo-professor",
        nome: "Helena Ferreira",
        email: options.body?.email || "helena.ferreira@zooly.edu.br",
        tipo: "professor",
      },
    };
  }
  if (route === "/api/professores" && method === "POST")
    return { mensagem: "Cadastro de demonstração concluído." };
  if (route === "/api/turmas" && method === "GET")
    return { turmas: turmasDemo.filter((item) => !item.arquivada) };
  if (route === "/api/turmas" && method === "POST") {
    const turma = {
      _id: `demo-turma-${Date.now()}`,
      ...options.body,
      escola: { nome: "Escola do Vale" },
      codigoPermanente: "VALE-NOVA",
    };
    turmasDemo.unshift(turma);
    return { mensagem: "Turma criada na demonstração.", turma };
  }
  const turma = route.match(/^\/api\/turmas\/([^/]+)$/);
  if (turma && method === "GET")
    return {
      turma: turmasDemo.find((item) => item._id === turma[1]) || turmasDemo[0],
    };
  if (turma && method === "PUT") {
    const registro = turmasDemo.find((item) => item._id === turma[1]);
    if (registro) Object.assign(registro, options.body);
    return { mensagem: "Turma atualizada na demonstração.", turma: registro };
  }
  const turmaArquivar = route.match(/^\/api\/turmas\/([^/]+)\/arquivar$/);
  if (turmaArquivar && method === "PATCH") {
    const registro = turmasDemo.find((item) => item._id === turmaArquivar[1]);
    if (registro) registro.arquivada = true;
    return { mensagem: "Turma arquivada na demonstração." };
  }
  const alunosDaTurma = route.match(/^\/api\/alunos\/turma\/([^/]+)$/);
  if (alunosDaTurma && method === "GET")
    return {
      alunos: alunosDemo.filter(
        (aluno) => !aluno.turma || aluno.turma === alunosDaTurma[1],
      ),
    };
  if (route === "/api/alunos" && method === "POST") {
    alunosDemo.push({
      _id: `demo-aluno-${Date.now()}`,
      turma: options.body?.turmaId,
      nomeCompleto: null,
      ra: options.body?.ra || "",
      sexo: "nao_informado",
      cadastroInicialConcluido: false,
      progresso: 0,
      createdAt: agora,
    });
    return { mensagem: "Aluno adicionado à demonstração." };
  }
  const aluno = route.match(/^\/api\/alunos\/([^/]+)$/);
  if (aluno && method === "PUT") {
    const registro = alunosDemo.find((item) => item._id === aluno[1]);
    if (registro) {
      if (options.body?.ra) registro.ra = options.body.ra;
      if (options.body?.turmaId) registro.turma = options.body.turmaId;
    }
    return { mensagem: "Aluno atualizado na demonstração." };
  }
  if (route === "/api/atividades" && method === "GET")
    return { atividades: atividadesDemo };
  if (route === "/api/atividades/publicadas" && method === "GET")
    return {
      atividades: atividadesDemo.filter((item) => item.status === "publicada"),
    };
  if (route === "/api/historias" && method === "GET")
    return { historias: historiasDemo };
  const historia = route.match(/^\/api\/historias\/([^/]+)$/);
  if (historia && method === "GET")
    return {
      historia: historiasDemo.find((item) => item._id === historia[1]) || null,
    };
  if (route === "/api/atividades" && method === "POST") {
    const id = `demo-atividade-${Date.now()}`;
    const atividade = {
      _id: id,
      ...options.body,
      titulo: options.body?.titulo || "Nova atividade",
      questoes: (options.body?.questoes || []).map((questao, index) => ({
        ...questao,
        _id: questao._id || `${id}-questao-${index + 1}`,
      })),
      pontuacaoTotal: (options.body?.questoes || []).reduce(
        (total, questao) => total + (Number(questao.pontos) || 0),
        0,
      ),
      status: "rascunho",
      publicadoEm: null,
    };
    atividadesDemo.unshift(atividade);
    return { atividade };
  }
  const atividade = route.match(/^\/api\/atividades\/([^/]+)$/);
  if (atividade && method === "GET") {
    const registro = atividadesDemo.find((item) => item._id === atividade[1]);
    if (!registro) throw new Error("Atividade não encontrada na demonstração.");
    return { atividade: registro };
  }
  if (atividade && method === "PUT") {
    const registro = atividadesDemo.find((item) => item._id === atividade[1]);
    if (!registro) throw new Error("Atividade não encontrada na demonstração.");
    Object.assign(registro, options.body);
    registro.pontuacaoTotal = (registro.questoes || []).reduce(
      (total, questao) => total + (Number(questao.pontos) || 0),
      0,
    );
    return { atividade: registro };
  }
  const publicar = route.match(/^\/api\/atividades\/([^/]+)\/publicar$/);
  if (publicar && method === "PATCH") {
    const atividade = atividadesDemo.find((item) => item._id === publicar[1]);
    if (atividade) {
      atividade.status = "publicada";
      atividade.publicadoEm = agora;
    }
    return { mensagem: "Atividade publicada na demonstração." };
  }
  const excluirAtividade = route.match(/^\/api\/atividades\/([^/]+)$/);
  if (excluirAtividade && method === "DELETE") {
    const index = atividadesDemo.findIndex(
      (item) => item._id === excluirAtividade[1],
    );
    if (index >= 0) atividadesDemo.splice(index, 1);
    return { mensagem: "Atividade excluída na demonstração." };
  }
  if (/^\/api\/desempenho\/turmas\/[^/]+\/semanal$/.test(route)) {
    const turmaId = route.split("/")[4];
    const turmaAtual = turmasDemo.find(
      (item) => item._id === turmaId && !item.arquivada,
    );
    const alunosDaTurmaAtual = alunosDemo.filter(
      (aluno) => aluno.turma === turmaId,
    );
    const alunos = alunosDaTurmaAtual.map((aluno, index) => {
      const percentualAcerto = [95, 68, 32, 75][Number(aluno._id.slice(-1)) - 1] ?? null;
      const atividadesIniciadas = aluno.progresso > 0 ? 3 : 0;
      const atividadesConcluidas = Math.round(
        (aluno.progresso / 100) * atividadesIniciadas,
      );
      const respostasRegistradas = aluno.progresso > 0 ? 8 : 0;
      return {
        aluno: {
          id: aluno._id,
          nomeCompleto: aluno.nomeCompleto,
          ra: aluno.ra || `2026${index + 1}`,
        },
        indicadores: {
          atividadesIniciadas,
          atividadesConcluidas,
          respostasRegistradas,
          respostasSemData: 0,
          acertos: respostasRegistradas
            ? Math.round((respostasRegistradas * percentualAcerto) / 100)
            : 0,
          erros: respostasRegistradas
            ? respostasRegistradas -
              Math.round((respostasRegistradas * percentualAcerto) / 100)
            : 0,
          percentualAcerto: respostasRegistradas ? percentualAcerto : null,
        },
      };
    });
    const respostasRegistradas = alunos.reduce(
      (total, item) => total + item.indicadores.respostasRegistradas,
      0,
    );
    const acertos = alunos.reduce(
      (total, item) => total + item.indicadores.acertos,
      0,
    );
    return {
      turma: turmaAtual ? { id: turmaAtual._id, nome: turmaAtual.nome } : null,
      periodo: {
        inicio: url.searchParams.get("data") || agora,
        fim: url.searchParams.get("data") || agora,
        fuso: "America/Sao_Paulo",
        disponivel:
          new Date(url.searchParams.get("data") || agora).getTime() <
          new Date(agora).getTime(),
      },
      totalAlunos: alunos.length,
      indicadores: {
        atividadesIniciadas: alunos.reduce(
          (total, item) => total + item.indicadores.atividadesIniciadas,
          0,
        ),
        atividadesConcluidas: alunos.reduce(
          (total, item) => total + item.indicadores.atividadesConcluidas,
          0,
        ),
        respostasRegistradas,
        respostasSemData: 0,
        acertos,
        erros: respostasRegistradas - acertos,
        percentualAcerto: respostasRegistradas
          ? Math.round((acertos / respostasRegistradas) * 10000) / 100
          : null,
      },
      alunos,
    };
  }
  const desempenhoAluno = route.match(/^\/api\/desempenho\/alunos\/([^/]+)$/);
  if (desempenhoAluno && method === "GET") {
    const aluno = alunosDemo.find((item) => item._id === desempenhoAluno[1]);
    if (!aluno) return {};
    const percentualAcerto = aluno.progresso || null;
    const respostasRegistradas = aluno.progresso > 0 ? 8 : 0;
    const acertos = respostasRegistradas
      ? Math.round((respostasRegistradas * percentualAcerto) / 100)
      : 0;
    const questoesComMaisErros = respostasRegistradas && acertos < respostasRegistradas
      ? [{
          questaoId: `demo-questao-${aluno._id}`,
          enunciado: "Qual palavra começa com o som indicado?",
          tituloAtividade: "Atividade de leitura",
          respostasRegistradas,
          acertos,
          erros: respostasRegistradas - acertos,
        }]
      : [];
    return {
      turma: {
        id: aluno.turma,
        nome: turmasDemo.find((item) => item._id === aluno.turma)?.nome || "Turma",
      },
      aluno: {
        id: aluno._id,
        ra:
          aluno.ra ||
          `2026${alunosDemo
            .filter((item) => item.turma === aluno.turma)
            .findIndex((item) => item._id === aluno._id) + 1}`,
        nomeCompleto: aluno.nomeCompleto,
      },
      indicadores: {
        atividadesIniciadas: aluno.progresso > 0 ? 3 : 0,
        atividadesConcluidas: aluno.progresso > 0 ? 1 : 0,
        respostasRegistradas,
        acertos,
        erros: respostasRegistradas - acertos,
        percentualAcerto,
      },
      questoesComMaisErros,
    };
  }
  return {};
}

// Dados efêmeros do navegador para navegar pelo front-end sem o Zooly-api.
const agora = "2026-10-27T12:00:00.000Z";

export const turmasDemo = [
  {
    _id: "demo-turma-1",
    nome: "1º Ano A",
    escola: { nome: "Escola do Vale" },
    escolaId: "demo-escola",
    anoEscolar: 1,
    codigoPermanente: "VALE-1A",
  },
  {
    _id: "demo-turma-2",
    nome: "2º Ano B",
    escola: { nome: "Escola do Vale" },
    escolaId: "demo-escola",
    anoEscolar: 2,
    codigoPermanente: "VALE-2B",
  },
];

export const alunosDemo = [
  {
    _id: "demo-aluno-1",
    nomeCompleto: "Lucas Machado",
    email: "lucas.machado@zooly.com",
    sexo: "masculino",
    cadastroInicialConcluido: true,
    progresso: 85,
    ultimoAcesso: "Hoje, 10:45",
    createdAt: agora,
  },
  {
    _id: "demo-aluno-2",
    nomeCompleto: "Matheus Rodrigues",
    email: "matheus.r@zooly.com",
    sexo: "masculino",
    cadastroInicialConcluido: true,
    progresso: 40,
    ultimoAcesso: "Ontem, 16:20",
    createdAt: agora,
  },
  {
    _id: "demo-aluno-3",
    nomeCompleto: "Helena Ferreira",
    email: "helena.f@zooly.com",
    sexo: "feminino",
    cadastroInicialConcluido: true,
    progresso: 92,
    ultimoAcesso: "Há 2 horas",
    createdAt: agora,
  },
  {
    _id: "demo-aluno-4",
    nomeCompleto: "Beatriz Souza",
    email: "b.souza@zooly.com",
    sexo: "feminino",
    cadastroInicialConcluido: false,
    progresso: 15,
    ultimoAcesso: "Há 4 dias",
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
    fonema: "/b/",
    concluidas: 24,
    totalAlunos: 32,
    status: "Em andamento",
  },
  {
    _id: "demo-atividade-2",
    turma: "demo-turma-2",
    titulo: "Caça às Patas",
    publicadoEm: agora,
    recompensaMoedas: 15,
    ordem: 2,
    fonema: "/p/",
    concluidas: 0,
    totalAlunos: 22,
    status: "Agendada",
  },
  {
    _id: "demo-atividade-3",
    turma: "demo-turma-1",
    titulo: "Leitura Guiada",
    publicadoEm: agora,
    recompensaMoedas: 20,
    ordem: 3,
    fonema: "/v/",
    concluidas: 28,
    totalAlunos: 32,
    status: "Em andamento",
  },
  {
    _id: "demo-atividade-4",
    turma: "demo-turma-2",
    titulo: "Eco das Vogais",
    publicadoEm: agora,
    recompensaMoedas: 10,
    ordem: 4,
    fonema: "/a/",
    concluidas: 0,
    totalAlunos: 22,
    status: "Agendada",
  },
];

export const historiasDemo = [
  { _id: "demo-historia-1", titulo: "O passeio da capivara" },
  { _id: "demo-historia-2", titulo: "O papagaio curioso" },
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
        nome: "Helena Ferreira",
        email: options.body?.email || "helena.ferreira@zooly.edu.br",
        tipo: "professor",
      },
    };
  }
  if (route === "/api/professores" && method === "POST")
    return { mensagem: "Cadastro de demonstração concluído." };
  if (route === "/api/turmas" && method === "GET")
    return { turmas: turmasDemo };
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
  if (/^\/api\/turmas\/[^/]+\/arquivar$/.test(route) && method === "PATCH")
    return { mensagem: "Turma arquivada na demonstração." };
  const alunosDaTurma = route.match(/^\/api\/alunos\/turma\/([^/]+)$/);
  if (alunosDaTurma && method === "GET") return { alunos: alunosDemo };
  if (route === "/api/alunos" && method === "POST") {
    alunosDemo.push({
      _id: `demo-aluno-${Date.now()}`,
      nomeCompleto: options.body?.nomeCompleto || "Cadastro inicial pendente",
      email: options.body?.email || "",
      sexo: "nao_informado",
      cadastroInicialConcluido: false,
      progresso: 0,
      ultimoAcesso: "Nunca acessou",
      createdAt: agora,
      ra: options.body?.ra,
    });
    return { mensagem: "Aluno adicionado à demonstração." };
  }
  if (route === "/api/atividades/publicadas" && method === "GET")
    return { atividades: atividadesDemo };
  if (route === "/api/historias" && method === "GET")
    return { historias: historiasDemo };
  if (route === "/api/atividades" && method === "POST") {
    const atividade = {
      _id: `demo-atividade-${Date.now()}`,
      ...options.body,
      titulo: options.body?.titulo || "Nova atividade",
      publicadoEm: agora,
    };
    atividadesDemo.unshift(atividade);
    return { atividade };
  }
  if (/^\/api\/atividades\/[^/]+\/publicar$/.test(route) && method === "PATCH")
    return { mensagem: "Atividade publicada na demonstração." };
  if (/^\/api\/desempenho\/turmas\/[^/]+\/semanal$/.test(route)) {
    return {
      turma:
        turmasDemo.find((item) => item._id === route.split("/")[4]) ||
        turmasDemo[0],
      periodo: {
        inicio: url.searchParams.get("data") || agora,
        fim: url.searchParams.get("data") || agora,
        fuso: "America/Sao_Paulo",
        disponivel: true,
      },
      totalAlunos: alunosDemo.length,
      indicadores: {
        atividadesIniciadas: 156,
        atividadesConcluidas: 112,
        percentualAcerto: 84.2,
      },
      alunos: alunosDemo.map((aluno, index) => ({
        aluno: {
          id: aluno._id,
          nomeCompleto: aluno.nomeCompleto,
          ra: `2026${index + 1}`,
        },
        ultimoAcesso: aluno.ultimoAcesso,
        indicadores: {
          atividadesIniciadas: 3,
          atividadesConcluidas: index + 1,
          respostasRegistradas: 8,
          acertos: 6,
          percentualAcerto: [95, 68, 32, 75][index % 4],
        },
      })),
    };
  }
  return {};
}

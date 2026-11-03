// Testes unitários das regras do Banco de Histórias no painel (src/utils/historias.js).
// Não usam rede: provam filtros, conversões e o corpo exato enviado à API.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  anexarApoio,
  errosDaPergunta,
  errosPorCampo,
  filtrarHistorias,
  formularioParaCorpo,
  formularioVazio,
  historiaParaFormulario,
  montarCorpoAtividade,
  preservarApoio,
  questaoPreenchida,
  questoesDoModelo,
  rotuloFaixa,
  rotuloOrigem,
  temasDe,
} from "../../src/utils/historias.js";

const historias = [
  {
    _id: "1",
    titulo: "O Curupira da Mata Atlântica",
    descricao: "O guardião da floresta.",
    tema: "Folclore da floresta",
    faixaEtaria: { minima: 4, maxima: 8 },
    objetivosPedagogicos: ["Educação ambiental"],
    origem: "zooly",
    status: "ativa",
  },
  {
    _id: "2",
    titulo: "A tartaruga Tita",
    descricao: "Uma tartaruga volta à praia.",
    tema: "Animais do mar",
    faixaEtaria: { minima: 6, maxima: 7 },
    objetivosPedagogicos: ["Ciclo de vida"],
    origem: "professor",
    status: "ativa",
  },
  {
    _id: "3",
    titulo: "História arquivada",
    tema: "Animais do mar",
    faixaEtaria: { minima: 5, maxima: 5 },
    origem: "professor",
    status: "arquivada",
  },
  // Documento antigo da API: sem origem, status nem faixa.
  { _id: "4", titulo: "Antiga", conteudo: "Texto antigo." },
];
const ids = (lista) => lista.map((h) => h._id);

test("filtros: padrão mostra só as ativas (inclusive documentos antigos)", () => {
  assert.deepEqual(ids(filtrarHistorias(historias)), ["1", "2", "4"]);
  assert.deepEqual(ids(filtrarHistorias(historias, { status: "arquivada" })), [
    "3",
  ]);
  assert.equal(filtrarHistorias(historias, { status: "todas" }).length, 4);
});

test("filtros: busca sem acento, tema, idade e origem", () => {
  assert.deepEqual(ids(filtrarHistorias(historias, { busca: "atlantica" })), [
    "1",
  ]);
  assert.deepEqual(ids(filtrarHistorias(historias, { busca: "CICLO" })), ["2"]);
  assert.deepEqual(
    ids(filtrarHistorias(historias, { tema: "Animais do mar" })),
    ["2"],
  );
  assert.deepEqual(ids(filtrarHistorias(historias, { idade: "5" })), [
    "1",
    "4",
  ]);
  assert.deepEqual(ids(filtrarHistorias(historias, { origem: "zooly" })), [
    "1",
    "4",
  ]);
  assert.deepEqual(
    ids(filtrarHistorias(historias, { origem: "professor", idade: "7" })),
    ["2"],
  );
  assert.deepEqual(filtrarHistorias(historias, { busca: "inexistente" }), []);
});

test("rótulos e temas", () => {
  assert.deepEqual(temasDe(historias), [
    "Animais do mar",
    "Folclore da floresta",
  ]);
  assert.equal(rotuloFaixa({ minima: 4, maxima: 8 }), "4 a 8 anos");
  assert.equal(rotuloFaixa({ minima: 5, maxima: 5 }), "5 anos");
  assert.equal(rotuloFaixa(undefined), "4 a 8 anos");
  assert.equal(rotuloOrigem(historias[1]), "Minha história");
  assert.equal(rotuloOrigem(historias[3]), "Zooly");
});

test("formulário de história: ida e volta preserva ids e a alternativa correta", () => {
  const daApi = {
    titulo: "A tartaruga Tita",
    descricao: "Resumo",
    conteudo: "Texto",
    tema: "Mar",
    nota: "",
    faixaEtaria: { minima: 5, maxima: 7 },
    objetivosPedagogicos: ["Objetivo A"],
    perguntas: [
      {
        _id: "p1",
        enunciado: "Para onde Tita voltou?",
        alternativas: [
          { _id: "a1", texto: "Montanha" },
          { _id: "a2", texto: "Praia" },
        ],
        alternativaCorreta: 1,
        feedback: "Isso!",
        objetivoPedagogico: "Localizar",
      },
    ],
  };
  const form = historiaParaFormulario(daApi);
  assert.equal(form.perguntas[0].correta, "a2");
  form.titulo = "  A tartaruga Tita  ";
  form.objetivos.push("   ");
  const corpo = formularioParaCorpo(form);
  assert.deepEqual(corpo, {
    titulo: "A tartaruga Tita",
    descricao: "Resumo",
    conteudo: "Texto",
    tema: "Mar",
    nota: "",
    faixaEtaria: { minima: 5, maxima: 7 },
    objetivosPedagogicos: ["Objetivo A"],
    perguntas: [
      {
        _id: "p1",
        enunciado: "Para onde Tita voltou?",
        alternativas: [
          { _id: "a1", texto: "Montanha" },
          { _id: "a2", texto: "Praia" },
        ],
        alternativaCorreta: 1,
        feedback: "Isso!",
        objetivoPedagogico: "Localizar",
      },
    ],
  });
  // Nenhum campo controlado pelo servidor sai do formulário.
  for (const proibido of ["origem", "professor", "status", "chave"])
    assert.equal(proibido in corpo, false);
});

test("formulário vazio gera uma pergunta nova sem ids da API", () => {
  const corpo = formularioParaCorpo(formularioVazio());
  assert.equal(corpo.perguntas.length, 1);
  assert.equal(corpo.perguntas[0].alternativas.length, 2);
  assert.equal("_id" in corpo.perguntas[0], false);
  assert.equal(corpo.perguntas[0].alternativaCorreta, 0);
});

test("erros da API agrupados por campo e por pergunta", () => {
  const mapa = errosPorCampo([
    { campo: "titulo", mensagem: "Campo obrigatório." },
    { campo: "perguntas[1].alternativas", mensagem: "Repetidas." },
    { campo: "perguntas[1].alternativaCorreta", mensagem: "Inválida." },
    { campo: "perguntas[10].enunciado", mensagem: "Outra pergunta." },
  ]);
  assert.deepEqual(mapa.titulo, ["Campo obrigatório."]);
  assert.deepEqual(errosDaPergunta(mapa, 1), ["Repetidas.", "Inválida."]);
  assert.deepEqual(errosDaPergunta(mapa, 0), []);
});

const modelo = {
  titulo: "O Curupira",
  historia: { tipo: "propria", texto: "Texto", bancoHistoriaId: "h1" },
  questoes: [
    {
      tipo: "multipla_escolha",
      enunciado: "Como são os cabelos?",
      alternativas: [
        { _id: "x1", texto: "Azuis" },
        { _id: "x2", texto: "Vermelhos" },
      ],
      respostasCorretas: ["x2"],
    },
  ],
};
const apoio = {
  perguntas: [{ feedback: "Vermelhos como fogo.", objetivoPedagogico: "Ler" }],
};

test("modelo de atividade vira questões editáveis com a correta marcada e o apoio", () => {
  const [questao] = questoesDoModelo(modelo, apoio);
  assert.equal(questao.respostaCorreta, "x2");
  assert.deepEqual(
    questao.alternativas.map((a) => a._id),
    ["x1", "x2"],
  );
  assert.deepEqual(questao.apoio, {
    feedback: "Vermelhos como fogo.",
    objetivoPedagogico: "Ler",
  });
  assert.equal(questaoPreenchida(questao), true);
  assert.equal(
    questaoPreenchida({ enunciado: " ", alternativas: [{ texto: "" }] }),
    false,
  );
});

test("criação: corpo de POST /api/atividades no contrato exato, sem campos de apoio", () => {
  const questoes = questoesDoModelo(modelo, apoio);
  questoes[0].enunciado = "Como são os cabelos do Curupira?";
  const corpo = montarCorpoAtividade({
    form: {
      turma: "t1",
      titulo: " Missão do Curupira ",
      historiaTipo: "propria",
      historiaId: "",
      textoHistoria: " Texto editado ",
      bancoHistoriaId: "h1",
      recompensaMoedas: "15",
      prazo: "2026-12-01",
    },
    questoes,
    etapas: ["ler_texto"],
    habilidades: [{ codigo: "EF01LP05", texto: "T", etapa: "EF", extra: 1 }],
    atividadeId: "",
  });
  assert.deepEqual(corpo, {
    turma: "t1",
    titulo: "Missão do Curupira",
    recompensaMoedas: 15,
    historia: {
      tipo: "propria",
      texto: "Texto editado",
      bancoHistoriaId: "h1",
    },
    missao: { etapas: ["ler_texto"] },
    habilidadesBncc: [{ codigo: "EF01LP05", texto: "T", etapa: "EF" }],
    questoes: [
      {
        tipo: "multipla_escolha",
        enunciado: "Como são os cabelos do Curupira?",
        pontos: 0,
        alternativas: [
          { _id: "x1", texto: "Azuis" },
          { _id: "x2", texto: "Vermelhos" },
        ],
        respostasCorretas: ["x2"],
      },
    ],
    prazo: new Date("2026-12-01T23:59:00").toISOString(),
  });
  const texto = JSON.stringify(corpo);
  for (const proibido of ["apoio", "feedback", "objetivoPedagogico", "key"])
    assert.equal(texto.includes(proibido), false, proibido);
});

test("edição: PUT sem turma, com índices de resposta e sem bancoHistoriaId quando o texto é próprio", () => {
  const questoes = [
    {
      _id: "q1",
      key: "q1",
      tipo: "multipla_escolha",
      enunciado: "Pergunta",
      pontos: 2,
      alternativas: [
        { _id: "a1", key: "a1", texto: "A" },
        { key: "novo", texto: "B" },
      ],
      respostaCorreta: "novo",
    },
  ];
  const corpo = montarCorpoAtividade({
    form: {
      turma: "t1",
      titulo: "T",
      historiaTipo: "propria",
      textoHistoria: "Texto",
      bancoHistoriaId: "",
      recompensaMoedas: "10",
      prazo: "",
    },
    questoes,
    etapas: [],
    habilidades: [],
    atividadeId: "act1",
  });
  assert.equal("turma" in corpo, false);
  assert.deepEqual(corpo.historia, { tipo: "propria", texto: "Texto" });
  assert.deepEqual(corpo.questoes[0].respostasCorretas, [1]);
  assert.equal(corpo.questoes[0]._id, "q1");
  assert.equal(corpo.prazo, null);

  const referencia = montarCorpoAtividade({
    form: {
      ...corpo,
      historiaTipo: "oficial",
      historiaId: "h9",
      textoHistoria: "x",
      recompensaMoedas: "1",
      prazo: "",
      titulo: "T",
    },
    questoes: [],
    etapas: [],
    habilidades: [],
    atividadeId: "act1",
  });
  assert.deepEqual(referencia.historia, { tipo: "oficial", historiaId: "h9" });
});

test("apoio pedagógico: preservado após salvar e reanexado por enunciado", () => {
  const anteriores = [
    { enunciado: "Como são os cabelos?", apoio: { feedback: "F" } },
    { enunciado: "Outra", apoio: { feedback: "G" } },
  ];
  const novas = [
    { enunciado: "Como são os cabelos?" },
    { enunciado: "Outra editada" },
  ];
  const preservadas = preservarApoio(anteriores, novas);
  assert.deepEqual(preservadas[0].apoio, { feedback: "F" });
  assert.equal(preservadas[1].apoio, undefined);

  const anexadas = anexarApoio(
    [{ enunciado: "COMO são os cabelos?" }, { enunciado: "Nova" }],
    [
      {
        enunciado: "Como são os cabelos?",
        feedback: "F",
        objetivoPedagogico: "O",
      },
    ],
  );
  assert.deepEqual(anexadas[0].apoio, {
    feedback: "F",
    objetivoPedagogico: "O",
  });
  assert.equal(anexadas[1].apoio, undefined);
});

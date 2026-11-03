// Regras do Banco de Histórias no painel (sem dependências: testadas com node:test).
// O formato das histórias e das perguntas segue a API (docs/historias.md no Zooly-api).

export const LIMITES = Object.freeze({
  titulo: 120,
  descricao: 400,
  conteudo: 8000,
  tema: 80,
  nota: 400,
  objetivos: 10,
  perguntas: 20,
  alternativasMin: 2,
  alternativasMax: 6,
  idadeMin: 3,
  idadeMax: 12,
});

export function novoId() {
  return Array.from({ length: 24 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
}

function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function rotuloFaixa(faixa) {
  const minima = faixa?.minima ?? 4;
  const maxima = faixa?.maxima ?? 8;
  return minima === maxima ? `${minima} anos` : `${minima} a ${maxima} anos`;
}

export function rotuloOrigem(historia) {
  return historia?.origem === "professor" ? "Minha história" : "Zooly";
}

/** Temas distintos, em ordem alfabética, para o filtro. */
export function temasDe(historias) {
  return [
    ...new Set(
      (historias ?? []).map((h) => (h.tema ?? "").trim()).filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/**
 * Filtros da tela do Banco de Histórias.
 * - busca: título, descrição, tema e objetivos (sem acento e sem diferenciar maiúsculas);
 * - tema: igual ao tema;
 * - idade: a faixa da história contém a idade;
 * - origem: "zooly" | "professor" | "" (todas);
 * - status: "ativa" (padrão) | "arquivada" | "todas".
 */
export function filtrarHistorias(historias, filtros = {}) {
  const busca = normalizar(filtros.busca);
  const idade = Number(filtros.idade);
  const status = filtros.status || "ativa";
  return (historias ?? []).filter((historia) => {
    const statusHistoria = historia.status || "ativa";
    if (status !== "todas" && statusHistoria !== status) return false;
    if (filtros.origem && (historia.origem || "zooly") !== filtros.origem)
      return false;
    if (filtros.tema && (historia.tema ?? "") !== filtros.tema) return false;
    if (Number.isInteger(idade) && idade > 0) {
      const minima = historia.faixaEtaria?.minima ?? 4;
      const maxima = historia.faixaEtaria?.maxima ?? 8;
      if (idade < minima || idade > maxima) return false;
    }
    if (busca) {
      const alvo = normalizar(
        [
          historia.titulo,
          historia.descricao,
          historia.tema,
          ...(historia.objetivosPedagogicos ?? []),
        ].join(" "),
      );
      if (!alvo.includes(busca)) return false;
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// Formulário de história (cadastro e edição)
// ---------------------------------------------------------------------------

export function novaAlternativaForm(texto = "") {
  return { key: novoId(), texto };
}

export function novaPerguntaForm() {
  const alternativas = [novaAlternativaForm(), novaAlternativaForm()];
  return {
    key: novoId(),
    enunciado: "",
    alternativas,
    correta: alternativas[0].key,
    feedback: "",
    objetivoPedagogico: "",
  };
}

export function formularioVazio() {
  return {
    titulo: "",
    descricao: "",
    conteudo: "",
    tema: "",
    nota: "",
    faixaMinima: 4,
    faixaMaxima: 8,
    objetivos: [""],
    perguntas: [novaPerguntaForm()],
  };
}

/** Converte a história da API (GET /api/historias/:id) no estado do formulário. */
export function historiaParaFormulario(historia) {
  return {
    titulo: historia.titulo ?? "",
    descricao: historia.descricao ?? "",
    conteudo: historia.conteudo ?? "",
    tema: historia.tema ?? "",
    nota: historia.nota ?? "",
    faixaMinima: historia.faixaEtaria?.minima ?? 4,
    faixaMaxima: historia.faixaEtaria?.maxima ?? 8,
    objetivos: historia.objetivosPedagogicos?.length
      ? [...historia.objetivosPedagogicos]
      : [""],
    perguntas: (historia.perguntas ?? []).map((pergunta) => {
      const alternativas = pergunta.alternativas.map((alternativa) => ({
        key: String(alternativa._id ?? novoId()),
        ...(alternativa._id ? { _id: String(alternativa._id) } : {}),
        texto: alternativa.texto ?? "",
      }));
      return {
        key: String(pergunta._id ?? novoId()),
        ...(pergunta._id ? { _id: String(pergunta._id) } : {}),
        enunciado: pergunta.enunciado ?? "",
        alternativas,
        correta:
          alternativas[pergunta.alternativaCorreta]?.key ??
          alternativas[0]?.key,
        feedback: pergunta.feedback ?? "",
        objetivoPedagogico: pergunta.objetivoPedagogico ?? "",
      };
    }),
  };
}

/** Corpo aceito por POST/PUT /api/historias e POST /api/historias/validar. */
export function formularioParaCorpo(form) {
  return {
    titulo: form.titulo.trim(),
    descricao: form.descricao.trim(),
    conteudo: form.conteudo.trim(),
    tema: form.tema.trim(),
    nota: form.nota.trim(),
    faixaEtaria: {
      minima: Number(form.faixaMinima),
      maxima: Number(form.faixaMaxima),
    },
    objetivosPedagogicos: form.objetivos
      .map((objetivo) => objetivo.trim())
      .filter(Boolean),
    perguntas: form.perguntas.map((pergunta) => ({
      ...(pergunta._id ? { _id: pergunta._id } : {}),
      enunciado: pergunta.enunciado.trim(),
      alternativas: pergunta.alternativas.map((alternativa) => ({
        ...(alternativa._id ? { _id: alternativa._id } : {}),
        texto: alternativa.texto.trim(),
      })),
      alternativaCorreta: pergunta.alternativas.findIndex(
        (alternativa) => alternativa.key === pergunta.correta,
      ),
      feedback: pergunta.feedback.trim(),
      objetivoPedagogico: pergunta.objetivoPedagogico.trim(),
    })),
  };
}

/**
 * Agrupa os erros da API ([{ campo, mensagem }]) por campo, para mostrar ao lado de cada
 * entrada do formulário. Ex.: "perguntas[0].alternativas" → mensagens daquela pergunta.
 */
export function errosPorCampo(erros) {
  const mapa = {};
  for (const erro of erros ?? []) {
    const campo = erro?.campo ?? "geral";
    (mapa[campo] ??= []).push(erro?.mensagem ?? "Valor inválido.");
  }
  return mapa;
}

/** Mensagens de erro de uma pergunta (inclui alternativas e demais campos dela). */
export function errosDaPergunta(mapa, indice) {
  const prefixo = `perguntas[${indice}]`;
  return Object.entries(mapa)
    .filter(([campo]) => campo === prefixo || campo.startsWith(`${prefixo}.`))
    .flatMap(([, mensagens]) => mensagens);
}

// ---------------------------------------------------------------------------
// Integração com o formulário de atividades
// ---------------------------------------------------------------------------

/**
 * Converte o modelo de GET /api/historias/:id/modelo-atividade nas questões do formulário
 * de atividade. O feedback e o objetivo de cada pergunta ficam em `apoio`, só na tela:
 * não fazem parte do contrato de POST /api/atividades e nunca são enviados.
 */
export function questoesDoModelo(modelo, apoioPedagogico) {
  const apoios = apoioPedagogico?.perguntas ?? [];
  return (modelo?.questoes ?? []).map((questao, indice) => {
    const alternativas = (questao.alternativas ?? []).map((alternativa) => ({
      key: String(alternativa._id),
      _id: String(alternativa._id),
      texto: alternativa.texto ?? "",
    }));
    const correta = String(questao.respostasCorretas?.[0] ?? "");
    return {
      key: novoId(),
      tipo: questao.tipo || "multipla_escolha",
      enunciado: questao.enunciado ?? "",
      pontos: Number.isSafeInteger(questao.pontos) ? questao.pontos : 0,
      alternativas,
      respostaCorreta:
        alternativas.find((alternativa) => alternativa.key === correta)?.key ??
        alternativas[0]?.key ??
        "",
      apoio: {
        feedback: apoios[indice]?.feedback ?? "",
        objetivoPedagogico: apoios[indice]?.objetivoPedagogico ?? "",
      },
    };
  });
}

/**
 * Ao reabrir uma atividade criada a partir do banco, recupera o feedback e o objetivo das
 * perguntas cujo enunciado continua igual ao da história de origem.
 */
export function anexarApoio(questoes, perguntasBanco) {
  const porEnunciado = new Map(
    (perguntasBanco ?? []).map((pergunta) => [
      normalizar(pergunta.enunciado),
      {
        feedback: pergunta.feedback ?? "",
        objetivoPedagogico: pergunta.objetivoPedagogico ?? "",
      },
    ]),
  );
  return questoes.map((questao) => {
    const apoio = porEnunciado.get(normalizar(questao.enunciado));
    return apoio && !questao.apoio ? { ...questao, apoio } : questao;
  });
}

/** Mantém o apoio pedagógico das questões depois de salvar (a API não guarda esses campos). */
export function preservarApoio(anteriores, novas) {
  return novas.map((questao, indice) => {
    const anterior = anteriores[indice];
    return anterior?.apoio &&
      normalizar(anterior.enunciado) === normalizar(questao.enunciado)
      ? { ...questao, apoio: anterior.apoio }
      : questao;
  });
}

/** A questão tem algum conteúdo digitado? (para confirmar antes de substituir). */
export function questaoPreenchida(questao) {
  return Boolean(
    questao.enunciado?.trim() ||
    questao.alternativas?.some((alternativa) => alternativa.texto?.trim()),
  );
}

/**
 * Corpo de POST /api/atividades (criação) ou PUT /api/atividades/:id (edição), exatamente
 * no contrato da API. Na criação, as respostas corretas são ids de alternativas; na edição,
 * índices (a API resolve). Campos de apoio da tela (feedback, objetivo, chaves) não vão.
 */
export function montarCorpoAtividade({
  form,
  questoes,
  etapas,
  habilidades,
  atividadeId,
}) {
  let historia;
  if (form.historiaTipo === "oficial") {
    historia = { tipo: "oficial", historiaId: form.historiaId };
  } else {
    historia = {
      tipo: "propria",
      texto: form.textoHistoria.trim(),
      ...(form.bancoHistoriaId
        ? { bancoHistoriaId: form.bancoHistoriaId }
        : {}),
    };
  }
  return {
    // A turma é definida na criação; o PUT da API rejeita esse campo.
    ...(atividadeId ? {} : { turma: form.turma }),
    titulo: form.titulo.trim(),
    recompensaMoedas: Number(form.recompensaMoedas),
    historia,
    missao: { etapas },
    habilidadesBncc: habilidades.map(({ codigo, texto, etapa }) => ({
      codigo,
      texto,
      etapa,
    })),
    questoes: questoes.map((questao) => ({
      ...(atividadeId && questao._id ? { _id: questao._id } : {}),
      tipo: questao.tipo,
      enunciado: questao.enunciado.trim(),
      pontos: Number(questao.pontos),
      alternativas: questao.alternativas.map((alternativa) => ({
        ...(alternativa._id ? { _id: alternativa._id } : {}),
        texto: alternativa.texto.trim(),
      })),
      respostasCorretas: atividadeId
        ? [
            questao.alternativas.findIndex(
              (alternativa) => alternativa.key === questao.respostaCorreta,
            ),
          ]
        : [
            questao.alternativas.find(
              (alternativa) => alternativa.key === questao.respostaCorreta,
            )?._id,
          ],
    })),
    prazo: form.prazo ? new Date(`${form.prazo}T23:59:00`).toISOString() : null,
  };
}

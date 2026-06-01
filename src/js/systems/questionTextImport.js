const QUESTION_SEPARATOR = "---";
const QUESTION_MARKER = "@questao";

const REQUIRED_FIELDS = [
  "enunciado",
  "a",
  "b",
  "c",
  "d",
  "e",
  "correta",
  "explicacao",
];

const VALID_CORRECT_ALTERNATIVES = ["A", "B", "C", "D", "E"];

export function parseQuestionsFromText(rawText) {
  const text = rawText.trim();

  if (!text) {
    return {
      validQuestions: [],
      errors: ["Nenhum texto foi informado."],
    };
  }

  const questionBlocks = text
    .split(QUESTION_SEPARATOR)
    .map((block) => block.trim())
    .filter(Boolean);

  const validQuestions = [];
  const errors = [];

  questionBlocks.forEach((block, index) => {
    const questionNumber = index + 1;
    const result = parseQuestionBlock(block, questionNumber);

    if (result.error) {
      errors.push(result.error);
      return;
    }

    validQuestions.push(result.question);
  });

  return {
    validQuestions,
    errors,
  };
}

function parseQuestionBlock(block, questionNumber) {
  if (!block.startsWith(QUESTION_MARKER)) {
    return {
      error: `Questão ${questionNumber}: marcador @questao ausente.`,
    };
  }

  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const fields = {};

  lines.forEach((line) => {
    if (line === QUESTION_MARKER) {
      return;
    }

    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) {
      return;
    }

    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();

    fields[key] = value;
  });

  const missingField = REQUIRED_FIELDS.find((field) => !fields[field]);

  if (missingField) {
    return {
      error: `Questão ${questionNumber}: campo "${missingField}" ausente.`,
    };
  }

  const correctAlternative = fields.correta.toUpperCase();

  if (!VALID_CORRECT_ALTERNATIVES.includes(correctAlternative)) {
    return {
      error: `Questão ${questionNumber}: alternativa correta inválida. Use A, B, C, D ou E.`,
    };
  }

  return {
    question: {
      statement: fields.enunciado,
      alternatives: {
        A: fields.a,
        B: fields.b,
        C: fields.c,
        D: fields.d,
        E: fields.e,
      },
      correctAlternative,
      explanation: fields.explicacao,
    },
  };
}
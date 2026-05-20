import { getCollection } from "../core/storage.js";

const SUBJECTS_COLLECTION = "subjects";
const THEMES_COLLECTION = "themes";
const QUESTIONS_COLLECTION = "questions";
const ATTEMPTS_COLLECTION = "attempts";

export function initDashboard() {
  const dashboardSubjectsCount = document.querySelector(
    "#dashboard-subjects-count",
  );
  const dashboardThemesCount = document.querySelector(
    "#dashboard-themes-count",
  );
  const dashboardQuestionsCount = document.querySelector(
    "#dashboard-questions-count",
  );
  const dashboardAttemptsCount = document.querySelector(
    "#dashboard-attempts-count",
  );
  const dashboardCorrectCount = document.querySelector(
    "#dashboard-correct-count",
  );
  const dashboardErrorsCount = document.querySelector(
    "#dashboard-errors-count",
  );
  const dashboardAccuracyRate = document.querySelector(
    "#dashboard-accuracy-rate",
  );
  const dashboardWrongCount = document.querySelector("#dashboard-wrong-count");

  if (
    !dashboardWrongCount ||
    !dashboardSubjectsCount ||
    !dashboardThemesCount ||
    !dashboardQuestionsCount ||
    !dashboardAttemptsCount ||
    !dashboardCorrectCount ||
    !dashboardErrorsCount ||
    !dashboardAccuracyRate
  ) {
    return;
  }

  function getSubjects() {
    return getCollection(SUBJECTS_COLLECTION);
  }

  function getThemes() {
    return getCollection(THEMES_COLLECTION);
  }

  function getQuestions() {
    return getCollection(QUESTIONS_COLLECTION);
  }

  function getAttempts() {
    return getCollection(ATTEMPTS_COLLECTION);
  }

  function updateDashboard() {
    const subjects = getSubjects();
    const themes = getThemes();
    const questions = getQuestions();
    const attempts = getAttempts();

    const correctAttempts = attempts.filter((attempt) => {
      return attempt.isCorrect;
    });

    const wrongAttempts = attempts.filter((attempt) => {
      return !attempt.isCorrect;
    });

    const pendingErrorQuestionIds = new Set(
      wrongAttempts.map((attempt) => {
        return attempt.questionId;
      }),
    );

    const accuracyRate =
      attempts.length === 0
        ? 0
        : Math.round((correctAttempts.length / attempts.length) * 100);

    dashboardSubjectsCount.textContent = subjects.length;
    dashboardThemesCount.textContent = themes.length;
    dashboardQuestionsCount.textContent = questions.length;
    dashboardAttemptsCount.textContent = attempts.length;
    dashboardCorrectCount.textContent = correctAttempts.length;
    dashboardWrongCount.textContent = wrongAttempts.length;
    dashboardErrorsCount.textContent = pendingErrorQuestionIds.size;
    dashboardAccuracyRate.textContent = `${accuracyRate}%`;
  }

  document.addEventListener("subjects:changed", updateDashboard);
  document.addEventListener("themes:changed", updateDashboard);
  document.addEventListener("questions:changed", updateDashboard);
  document.addEventListener("attempts:changed", updateDashboard);

  updateDashboard();

  console.log("Dashboard carregado.");
}

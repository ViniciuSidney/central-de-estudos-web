import { getCollection } from "../core/storage.js";

const SUBJECTS_COLLECTION = "subjects";
const THEMES_COLLECTION = "themes";
const QUESTIONS_COLLECTION = "questions";
const ATTEMPTS_COLLECTION = "attempts";
const ERROR_REVIEWS_COLLECTION = "errorReviews";

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
  const dashboardTabButtons = document.querySelectorAll("[data-dashboard-tab]");
  const dashboardSummaryTab = document.querySelector("#dashboard-summary-tab");
  const dashboardPerformanceTab = document.querySelector(
    "#dashboard-performance-tab",
  );

  if (
    !dashboardTabButtons.length ||
    !dashboardSummaryTab ||
    !dashboardPerformanceTab ||
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

  function getErrorReviews() {
    return getCollection(ERROR_REVIEWS_COLLECTION);
  }

  function getLastWrongAttemptsByQuestion() {
    const wrongAttempts = getAttempts().filter((attempt) => {
      return !attempt.isCorrect;
    });

    const lastWrongAttemptByQuestion = new Map();

    wrongAttempts.forEach((attempt) => {
      const savedAttempt = lastWrongAttemptByQuestion.get(attempt.questionId);

      if (
        !savedAttempt ||
        new Date(attempt.answeredAt) > new Date(savedAttempt.answeredAt)
      ) {
        lastWrongAttemptByQuestion.set(attempt.questionId, attempt);
      }
    });

    return Array.from(lastWrongAttemptByQuestion.values());
  }

  function getPendingErrorAttempts() {
    const reviewedAttemptIds = new Set(
      getErrorReviews()
        .filter((review) => {
          return review.isReviewed;
        })
        .map((review) => {
          return review.attemptId;
        }),
    );

    return getLastWrongAttemptsByQuestion().filter((attempt) => {
      return !reviewedAttemptIds.has(attempt.id);
    });
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

    const pendingErrorAttempts = getPendingErrorAttempts();

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
    dashboardErrorsCount.textContent = pendingErrorAttempts.length;
    dashboardAccuracyRate.textContent = `${accuracyRate}%`;
  }

  function showDashboardTab(tabName) {
    dashboardTabButtons.forEach((button) => {
      const isSelectedTab = button.dataset.dashboardTab === tabName;

      button.classList.toggle("is-active", isSelectedTab);
    });

    dashboardSummaryTab.classList.toggle("is-active", tabName === "summary");
    dashboardPerformanceTab.classList.toggle(
      "is-active",
      tabName === "performance",
    );
  }

  document.addEventListener("subjects:changed", updateDashboard);
  document.addEventListener("themes:changed", updateDashboard);
  document.addEventListener("questions:changed", updateDashboard);
  document.addEventListener("attempts:changed", updateDashboard);
  document.addEventListener("errorReviews:changed", updateDashboard);
  
  dashboardTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showDashboardTab(button.dataset.dashboardTab);
    });
  });

  updateDashboard();

  console.log("Dashboard carregado.");
}

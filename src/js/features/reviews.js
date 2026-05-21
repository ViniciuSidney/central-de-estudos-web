import { getCollection, saveCollection } from "../core/storage.js";

const SUBJECTS_COLLECTION = "subjects";
const THEMES_COLLECTION = "themes";
const QUESTIONS_COLLECTION = "questions";
const ATTEMPTS_COLLECTION = "attempts";
const ERROR_REVIEWS_COLLECTION = "errorReviews";

export function initReviews() {
  const reviewTabButtons = document.querySelectorAll("[data-review-tab]");
  const reviewHistoryTab = document.querySelector("#review-history-tab");
  const reviewErrorsTab = document.querySelector("#review-errors-tab");

  const reviewHistorySubjectSelect = document.querySelector(
    "#review-history-subject",
  );
  const reviewHistoryThemeSelect = document.querySelector(
    "#review-history-theme",
  );
  const reviewHistoryResultSelect = document.querySelector(
    "#review-history-result",
  );

  const reviewHistoryCount = document.querySelector("#review-history-count");
  const reviewHistoryEmpty = document.querySelector("#review-history-empty");
  const reviewHistoryList = document.querySelector("#review-history-list");

  const reviewErrorsCount = document.querySelector("#review-errors-count");
  const reviewErrorsEmpty = document.querySelector("#review-errors-empty");
  const reviewErrorsList = document.querySelector("#review-errors-list");

  const reviewErrorModal = document.querySelector("#review-error-modal");
  const reviewErrorCurrent = document.querySelector("#review-error-current");
  const reviewErrorReasonInput = document.querySelector("#review-error-reason");
  const reviewErrorRuleInput = document.querySelector("#review-error-rule");
  const reviewErrorNoteInput = document.querySelector("#review-error-note");
  const reviewErrorMessage = document.querySelector("#review-error-message");
  const reviewErrorCancelButton = document.querySelector(
    "#review-error-cancel",
  );
  const reviewErrorSaveButton = document.querySelector("#review-error-save");

  if (
    !reviewErrorModal ||
    !reviewErrorCurrent ||
    !reviewErrorReasonInput ||
    !reviewErrorRuleInput ||
    !reviewErrorNoteInput ||
    !reviewErrorMessage ||
    !reviewErrorCancelButton ||
    !reviewErrorSaveButton ||
    !reviewTabButtons.length ||
    !reviewHistoryTab ||
    !reviewErrorsTab ||
    !reviewHistorySubjectSelect ||
    !reviewHistoryThemeSelect ||
    !reviewHistoryResultSelect ||
    !reviewHistoryCount ||
    !reviewHistoryEmpty ||
    !reviewHistoryList ||
    !reviewErrorsCount ||
    !reviewErrorsEmpty ||
    !reviewErrorsList
  ) {
    return;
  }

  let reviewAttemptId = null;

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

  function saveErrorReviews(errorReviews) {
    saveCollection(ERROR_REVIEWS_COLLECTION, errorReviews);
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showReviewTab(tabName) {
    reviewTabButtons.forEach((button) => {
      const isSelectedTab = button.dataset.reviewTab === tabName;

      button.classList.toggle("is-active", isSelectedTab);
    });

    reviewHistoryTab.classList.toggle("is-active", tabName === "history");
    reviewErrorsTab.classList.toggle("is-active", tabName === "errors");
  }

  function getSubjectById(subjectId) {
    return getSubjects().find((subject) => {
      return subject.id === subjectId;
    });
  }

  function getThemeById(themeId) {
    return getThemes().find((theme) => {
      return theme.id === themeId;
    });
  }

  function getQuestionById(questionId) {
    return getQuestions().find((question) => {
      return question.id === questionId;
    });
  }

  function formatDateTime(dateValue) {
    const date = new Date(dateValue);

    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getQuestionIndexWithinTheme(question) {
    const questionsFromTheme = getQuestions().filter((currentQuestion) => {
      return currentQuestion.themeId === question.themeId;
    });

    const questionIndex = questionsFromTheme.findIndex((currentQuestion) => {
      return currentQuestion.id === question.id;
    });

    return questionIndex === -1
      ? "-"
      : String(questionIndex + 1).padStart(2, "0");
  }

  function renderSubjectFilterOptions() {
    const subjects = getSubjects();
    const previousSubjectId = reviewHistorySubjectSelect.value;

    reviewHistorySubjectSelect.innerHTML = `
      <option value="">Todas as matérias</option>
    `;

    subjects.forEach((subject) => {
      const option = document.createElement("option");

      option.value = subject.id;
      option.textContent = subject.name;

      reviewHistorySubjectSelect.appendChild(option);
    });

    const selectedSubjectStillExists = subjects.some((subject) => {
      return subject.id === previousSubjectId;
    });

    reviewHistorySubjectSelect.value = selectedSubjectStillExists
      ? previousSubjectId
      : "";

    renderThemeFilterOptions();
  }

  function renderThemeFilterOptions() {
    const selectedSubjectId = reviewHistorySubjectSelect.value;
    const previousThemeId = reviewHistoryThemeSelect.value;

    const themes = getThemes().filter((theme) => {
      if (!selectedSubjectId) {
        return true;
      }

      return theme.subjectId === selectedSubjectId;
    });

    reviewHistoryThemeSelect.innerHTML = `
      <option value="">Todos os temas</option>
    `;

    themes.forEach((theme) => {
      const option = document.createElement("option");

      option.value = theme.id;
      option.textContent = theme.name;

      reviewHistoryThemeSelect.appendChild(option);
    });

    const selectedThemeStillExists = themes.some((theme) => {
      return theme.id === previousThemeId;
    });

    reviewHistoryThemeSelect.value = selectedThemeStillExists
      ? previousThemeId
      : "";
  }

  function getFilteredAttempts() {
    const selectedSubjectId = reviewHistorySubjectSelect.value;
    const selectedThemeId = reviewHistoryThemeSelect.value;
    const selectedResult = reviewHistoryResultSelect.value;

    return getAttempts()
      .filter((attempt) => {
        const matchesSubject =
          !selectedSubjectId || attempt.subjectId === selectedSubjectId;

        const matchesTheme =
          !selectedThemeId || attempt.themeId === selectedThemeId;

        const matchesResult =
          selectedResult === "all" ||
          (selectedResult === "correct" && attempt.isCorrect) ||
          (selectedResult === "wrong" && !attempt.isCorrect);

        return matchesSubject && matchesTheme && matchesResult;
      })
      .sort((firstAttempt, secondAttempt) => {
        return (
          new Date(secondAttempt.answeredAt) - new Date(firstAttempt.answeredAt)
        );
      });
  }

  function renderHistory() {
    const attempts = getFilteredAttempts();

    reviewHistoryList.innerHTML = "";

    reviewHistoryCount.textContent =
      attempts.length === 1 ? "1 registro" : `${attempts.length} registros`;

    if (attempts.length === 0) {
      reviewHistoryEmpty.hidden = false;
      return;
    }

    reviewHistoryEmpty.hidden = true;

    attempts.forEach((attempt) => {
      const subject = getSubjectById(attempt.subjectId);
      const theme = getThemeById(attempt.themeId);
      const question = getQuestionById(attempt.questionId);

      const subjectName = subject ? subject.name : "Matéria removida";
      const themeName = theme ? theme.name : "Tema removido";
      const questionNumber = question
        ? getQuestionIndexWithinTheme(question)
        : "-";

      const historyCard = document.createElement("article");

      historyCard.classList.add("review-card");

      historyCard.innerHTML = `
        <div class="review-card__content">
          <strong>Questão ${escapeHTML(questionNumber)}</strong>

          <span>${escapeHTML(subjectName)} • ${escapeHTML(themeName)}</span>

          <span>Resolvida em ${escapeHTML(formatDateTime(attempt.answeredAt))}</span>
        </div>

        <span class="review-card__status ${attempt.isCorrect ? "is-correct" : "is-wrong"}">
          ${attempt.isCorrect ? "Acertou" : "Errou"}
        </span>
      `;

      reviewHistoryList.appendChild(historyCard);
    });
  }

  function getPendingErrorAttempts() {
    const wrongAttempts = getAttempts().filter((attempt) => {
      return !attempt.isCorrect;
    });

    const lastWrongAttemptByQuestion = new Map();

    wrongAttempts.forEach((attempt) => {
      const currentSavedAttempt = lastWrongAttemptByQuestion.get(
        attempt.questionId,
      );

      if (
        !currentSavedAttempt ||
        new Date(attempt.answeredAt) > new Date(currentSavedAttempt.answeredAt)
      ) {
        lastWrongAttemptByQuestion.set(attempt.questionId, attempt);
      }
    });

    return Array.from(lastWrongAttemptByQuestion.values()).sort(
      (firstAttempt, secondAttempt) => {
        return (
          new Date(secondAttempt.answeredAt) - new Date(firstAttempt.answeredAt)
        );
      },
    );
  }

  function renderErrors() {
    const pendingErrors = getPendingErrorAttempts();

    reviewErrorsList.innerHTML = "";

    reviewErrorsCount.textContent =
      pendingErrors.length === 1 ? "1 erro" : `${pendingErrors.length} erros`;

    if (pendingErrors.length === 0) {
      reviewErrorsEmpty.hidden = false;
      return;
    }

    reviewErrorsEmpty.hidden = true;

    pendingErrors.forEach((attempt) => {
      const subject = getSubjectById(attempt.subjectId);
      const theme = getThemeById(attempt.themeId);
      const question = getQuestionById(attempt.questionId);

      const subjectName = subject ? subject.name : "Matéria removida";
      const themeName = theme ? theme.name : "Tema removido";
      const questionNumber = question
        ? getQuestionIndexWithinTheme(question)
        : "-";

      const errorCard = document.createElement("article");

      errorCard.classList.add("review-card");

      errorCard.innerHTML = `
        <div class="review-card__content">
          <strong>Questão ${escapeHTML(questionNumber)}</strong>

          <span>${escapeHTML(subjectName)} • ${escapeHTML(themeName)}</span>

          <span>Último erro em ${escapeHTML(formatDateTime(attempt.answeredAt))}</span>
        </div>

        <div class="review-card__actions">
          <span class="review-card__status is-wrong">
            Pendente
          </span>

          <button
            class="button button--secondary"
            type="button"
            data-review-error="${attempt.id}"
          >
            Revisar erro
          </button>
        </div>
      `;

      reviewErrorsList.appendChild(errorCard);
    });
  }

  function setReviewErrorMessage(message, type = "default") {
    reviewErrorMessage.textContent = message;

    reviewErrorMessage.classList.remove("is-error", "is-success");

    if (type === "error") {
      reviewErrorMessage.classList.add("is-error");
    }

    if (type === "success") {
      reviewErrorMessage.classList.add("is-success");
    }
  }

  function createErrorReview({ attempt, reason, rule, note }) {
    return {
      id: crypto.randomUUID(),
      attemptId: attempt.id,
      questionId: attempt.questionId,
      subjectId: attempt.subjectId,
      themeId: attempt.themeId,
      reason,
      rule,
      note,
      isReviewed: false,
      createdAt: new Date().toISOString(),
    };
  }

  function openReviewErrorModal(attempt) {
    reviewAttemptId = attempt.id;

    const subject = getSubjectById(attempt.subjectId);
    const theme = getThemeById(attempt.themeId);
    const question = getQuestionById(attempt.questionId);

    const subjectName = subject ? subject.name : "Matéria removida";
    const themeName = theme ? theme.name : "Tema removido";
    const questionNumber = question
      ? getQuestionIndexWithinTheme(question)
      : "-";

    reviewErrorCurrent.innerHTML = `
    <span><strong>Questão:</strong> ${escapeHTML(questionNumber)}</span>
    <span><strong>Matéria:</strong> ${escapeHTML(subjectName)}</span>
    <span><strong>Tema:</strong> ${escapeHTML(themeName)}</span>
    <span><strong>Erro em:</strong> ${escapeHTML(formatDateTime(attempt.answeredAt))}</span>
  `;

    reviewErrorReasonInput.value = "";
    reviewErrorRuleInput.value = "";
    reviewErrorNoteInput.value = "";
    setReviewErrorMessage("");

    reviewErrorModal.hidden = false;
    reviewErrorReasonInput.focus();
  }

  function closeReviewErrorModal() {
    reviewAttemptId = null;

    reviewErrorReasonInput.value = "";
    reviewErrorRuleInput.value = "";
    reviewErrorNoteInput.value = "";
    setReviewErrorMessage("");

    reviewErrorModal.hidden = true;
  }

  function saveCurrentErrorReview() {
    if (!reviewAttemptId) {
      return;
    }

    const attempt = getAttempts().find((currentAttempt) => {
      return currentAttempt.id === reviewAttemptId;
    });

    if (!attempt) {
      closeReviewErrorModal();
      return;
    }

    const reason = reviewErrorReasonInput.value.trim();
    const rule = reviewErrorRuleInput.value.trim();
    const note = reviewErrorNoteInput.value.trim();

    if (!reason) {
      setReviewErrorMessage("Informe o motivo do erro.", "error");
      reviewErrorReasonInput.focus();
      return;
    }

    if (!rule) {
      setReviewErrorMessage("Informe uma regra de correção.", "error");
      reviewErrorRuleInput.focus();
      return;
    }

    const errorReviews = getErrorReviews();

    const existingReviewIndex = errorReviews.findIndex((review) => {
      return review.attemptId === attempt.id;
    });

    const newReview = createErrorReview({
      attempt,
      reason,
      rule,
      note,
    });

    if (existingReviewIndex !== -1) {
      errorReviews[existingReviewIndex] = {
        ...errorReviews[existingReviewIndex],
        reason,
        rule,
        note,
        updatedAt: new Date().toISOString(),
      };
    } else {
      errorReviews.push(newReview);
    }

    saveErrorReviews(errorReviews);

    document.dispatchEvent(new CustomEvent("errorReviews:changed"));

    closeReviewErrorModal();
    renderErrors();
  }

  function handleReviewErrorClick(event) {
    const reviewButton = event.target.closest("[data-review-error]");

    if (!reviewButton) {
      return;
    }

    const attemptId = reviewButton.dataset.reviewError;

    const attempt = getAttempts().find((currentAttempt) => {
      return currentAttempt.id === attemptId;
    });

    if (!attempt) {
      return;
    }

    openReviewErrorModal(attempt);
  }

  function renderReviews() {
    renderSubjectFilterOptions();
    renderHistory();
    renderErrors();
  }

  reviewTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showReviewTab(button.dataset.reviewTab);
    });
  });

  reviewHistorySubjectSelect.addEventListener("change", () => {
    renderThemeFilterOptions();
    renderHistory();
  });

  reviewHistoryThemeSelect.addEventListener("change", renderHistory);
  reviewHistoryResultSelect.addEventListener("change", renderHistory);

  document.addEventListener("subjects:changed", renderReviews);
  document.addEventListener("themes:changed", renderReviews);
  document.addEventListener("questions:changed", renderReviews);
  document.addEventListener("attempts:changed", renderReviews);
  
  reviewErrorsList.addEventListener("click", handleReviewErrorClick);
  reviewErrorCancelButton.addEventListener("click", closeReviewErrorModal);
  reviewErrorSaveButton.addEventListener("click", saveCurrentErrorReview);

  reviewErrorModal.addEventListener("click", (event) => {
    if (event.target === reviewErrorModal) {
      closeReviewErrorModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !reviewErrorModal.hidden) {
      closeReviewErrorModal();
    }
  });

  document.addEventListener("errorReviews:changed", renderErrors);

  renderReviews();

  console.log("Sistema de revisões carregado.");
}

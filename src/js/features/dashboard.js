import { getCollection } from "../core/storage.js";

const SUBJECTS_COLLECTION = "subjects";
const THEMES_COLLECTION = "themes";
const QUESTIONS_COLLECTION = "questions";
const ATTEMPTS_COLLECTION = "attempts";
const ERROR_REVIEWS_COLLECTION = "errorReviews";
const NOTES_COLLECTION = "notes";

export function initDashboard() {
  const dashboardTabButtons = document.querySelectorAll("[data-dashboard-tab]");

  const summaryCards = document.querySelector("#dashboard-summary-cards");
  const performanceCards = document.querySelector("#dashboard-performance-cards");
  const reviewCards = document.querySelector("#dashboard-review-cards");
  const contentCards = document.querySelector("#dashboard-content-cards");

  const recentActivityList = document.querySelector("#dashboard-recent-activity");
  const subjectPerformanceList = document.querySelector(
    "#dashboard-subject-performance",
  );
  const pendingErrorsList = document.querySelector("#dashboard-pending-errors");
  const contentAlertsList = document.querySelector("#dashboard-content-alerts");

  if (
    !summaryCards ||
    !performanceCards ||
    !reviewCards ||
    !contentCards ||
    !recentActivityList ||
    !subjectPerformanceList ||
    !pendingErrorsList ||
    !contentAlertsList
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

  function getNotes() {
    return getCollection(NOTES_COLLECTION);
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatPercent(value) {
    if (!Number.isFinite(value)) {
      return "0%";
    }

    return `${Math.round(value)}%`;
  }

  function formatDateTime(dateValue) {
    if (!dateValue) {
      return "Data não registrada";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Data inválida";
    }

    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  function getSubjectName(subjectId) {
    const subject = getSubjectById(subjectId);

    return subject ? subject.name : "Matéria removida";
  }

  function getThemeName(themeId) {
    const theme = getThemeById(themeId);

    return theme ? theme.name : "Tema removido";
  }

  function getQuestionTitle(questionId) {
    const questions = getQuestions();
    const questionIndex = questions.findIndex((question) => {
      return question.id === questionId;
    });

    if (questionIndex === -1) {
      return "Questão removida";
    }

    return `Questão ${String(questionIndex + 1).padStart(2, "0")}`;
  }

  function getAttemptResult(attempt) {
    if (typeof attempt.isCorrect === "boolean") {
      return attempt.isCorrect ? "correct" : "wrong";
    }

    if (attempt.result === "correct" || attempt.result === "right") {
      return "correct";
    }

    if (attempt.result === "wrong" || attempt.result === "incorrect") {
      return "wrong";
    }

    if (attempt.status === "correct") {
      return "correct";
    }

    if (attempt.status === "wrong") {
      return "wrong";
    }

    return "unknown";
  }

  function getAttemptDate(attempt) {
    return (
      attempt.createdAt ||
      attempt.answeredAt ||
      attempt.resolvedAt ||
      attempt.date ||
      attempt.updatedAt ||
      null
    );
  }

  function getReviewDate(review) {
    return (
      review.reviewedAt ||
      review.createdAt ||
      review.updatedAt ||
      review.date ||
      null
    );
  }

  function isReviewPending(review) {
    if (typeof review.isReviewed === "boolean") {
      return !review.isReviewed;
    }

    if (review.status === "pending") {
      return true;
    }

    if (review.status === "reviewed") {
      return false;
    }

    if (review.reviewedAt) {
      return false;
    }

    return true;
  }

  function getReviewQuestionId(review) {
    return review.questionId || review.sourceQuestionId || review.idQuestion || null;
  }

  function getGeneralStats() {
    const subjects = getSubjects();
    const themes = getThemes();
    const questions = getQuestions();
    const attempts = getAttempts();
    const errorReviews = getErrorReviews();
    const notes = getNotes();

    const correctAttempts = attempts.filter((attempt) => {
      return getAttemptResult(attempt) === "correct";
    });

    const wrongAttempts = attempts.filter((attempt) => {
      return getAttemptResult(attempt) === "wrong";
    });

    const pendingErrors = errorReviews.filter(isReviewPending);
    const reviewedErrors = errorReviews.filter((review) => {
      return !isReviewPending(review);
    });

    const accuracy =
      attempts.length > 0 ? (correctAttempts.length / attempts.length) * 100 : 0;

    return {
      subjects,
      themes,
      questions,
      attempts,
      errorReviews,
      notes,
      correctAttempts,
      wrongAttempts,
      pendingErrors,
      reviewedErrors,
      accuracy,
    };
  }

  function createCard({ title, value, description }) {
    return `
      <article class="dashboard-card">
        <strong>${escapeHTML(value)}</strong>
        <span>${escapeHTML(title)}</span>
        <p>${escapeHTML(description)}</p>
      </article>
    `;
  }

  function renderEmptyState(container, title, description) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>${escapeHTML(title)}</strong>
        <span>${escapeHTML(description)}</span>
      </div>
    `;
  }

  function renderSummaryCards(stats) {
    summaryCards.innerHTML = [
      createCard({
        title: "Matérias",
        value: stats.subjects.length,
        description: "Áreas principais cadastradas.",
      }),
      createCard({
        title: "Temas",
        value: stats.themes.length,
        description: "Conteúdos divididos por matéria.",
      }),
      createCard({
        title: "Questões",
        value: stats.questions.length,
        description: "Exercícios disponíveis para prática.",
      }),
      createCard({
        title: "Anotações",
        value: stats.notes.length,
        description: "Registros livres ou vinculados.",
      }),
      createCard({
        title: "Tentativas",
        value: stats.attempts.length,
        description: "Resoluções registradas.",
      }),
      createCard({
        title: "Taxa geral",
        value: formatPercent(stats.accuracy),
        description: "Aproveitamento geral nas questões.",
      }),
    ].join("");
  }

  function renderPerformanceCards(stats) {
    performanceCards.innerHTML = [
      createCard({
        title: "Acertos",
        value: stats.correctAttempts.length,
        description: "Questões respondidas corretamente.",
      }),
      createCard({
        title: "Erros",
        value: stats.wrongAttempts.length,
        description: "Questões respondidas incorretamente.",
      }),
      createCard({
        title: "Tentativas",
        value: stats.attempts.length,
        description: "Total de resoluções feitas.",
      }),
      createCard({
        title: "Taxa de acerto",
        value: formatPercent(stats.accuracy),
        description: "Porcentagem geral de acertos.",
      }),
    ].join("");
  }

  function renderReviewCards(stats) {
    reviewCards.innerHTML = [
      createCard({
        title: "Erros pendentes",
        value: stats.pendingErrors.length,
        description: "Erros que ainda precisam de revisão.",
      }),
      createCard({
        title: "Erros revisados",
        value: stats.reviewedErrors.length,
        description: "Erros já transformados em regra.",
      }),
      createCard({
        title: "Erros totais",
        value: stats.errorReviews.length,
        description: "Registro total de erros acompanhados.",
      }),
      createCard({
        title: "Taxa de revisão",
        value: formatPercent(
          stats.errorReviews.length > 0
            ? (stats.reviewedErrors.length / stats.errorReviews.length) * 100
            : 0,
        ),
        description: "Proporção de erros já revisados.",
      }),
    ].join("");
  }

  function renderContentCards(stats) {
    const freeNotes = stats.notes.filter((note) => {
      return !note.subjectId && !note.themeId;
    });

    const pinnedNotes = stats.notes.filter((note) => {
      return note.isPinned;
    });

    const archivedNotes = stats.notes.filter((note) => {
      return note.isArchived;
    });

    contentCards.innerHTML = [
      createCard({
        title: "Matérias",
        value: stats.subjects.length,
        description: "Base principal de organização.",
      }),
      createCard({
        title: "Temas",
        value: stats.themes.length,
        description: "Subdivisões dos conteúdos.",
      }),
      createCard({
        title: "Questões",
        value: stats.questions.length,
        description: "Exercícios cadastrados.",
      }),
      createCard({
        title: "Anotações livres",
        value: freeNotes.length,
        description: "Anotações sem vínculo específico.",
      }),
      createCard({
        title: "Anotações fixadas",
        value: pinnedNotes.length,
        description: "Registros destacados no topo.",
      }),
      createCard({
        title: "Anotações arquivadas",
        value: archivedNotes.length,
        description: "Registros guardados fora da lista principal.",
      }),
    ].join("");
  }

  function renderRecentActivity(stats) {
    const recentAttempts = stats.attempts.map((attempt) => {
      const questionId = attempt.questionId;
      const question = questionId ? getQuestionById(questionId) : null;

      return {
        type: "attempt",
        title: questionId ? getQuestionTitle(questionId) : "Questão respondida",
        description: question
          ? `${getSubjectName(question.subjectId)} • ${getThemeName(question.themeId)}`
          : "Resolução registrada.",
        status:
          getAttemptResult(attempt) === "correct"
            ? "Acertou"
            : getAttemptResult(attempt) === "wrong"
              ? "Errou"
              : "Registrada",
        date: getAttemptDate(attempt),
      };
    });

    const recentReviews = stats.errorReviews.map((review) => {
      const questionId = getReviewQuestionId(review);

      return {
        type: "review",
        title: questionId ? getQuestionTitle(questionId) : "Erro revisado",
        description: isReviewPending(review)
          ? "Erro pendente de revisão."
          : "Erro transformado em regra de correção.",
        status: isReviewPending(review) ? "Pendente" : "Revisado",
        date: getReviewDate(review),
      };
    });

    const activities = [...recentAttempts, ...recentReviews]
      .filter((activity) => activity.date)
      .sort((firstActivity, secondActivity) => {
        return new Date(secondActivity.date) - new Date(firstActivity.date);
      })
      .slice(0, 5);

    if (activities.length === 0) {
      renderEmptyState(
        recentActivityList,
        "Nenhuma atividade registrada ainda.",
        "Resolva questões ou revise erros para movimentar o Dashboard.",
      );
      return;
    }

    recentActivityList.innerHTML = activities
      .map((activity) => {
        return `
          <article class="dashboard-list-item">
            <div>
              <strong>${escapeHTML(activity.title)}</strong>
              <span>${escapeHTML(activity.description)}</span>
              <small>${escapeHTML(formatDateTime(activity.date))}</small>
            </div>

            <span class="dashboard-chip">${escapeHTML(activity.status)}</span>
          </article>
        `;
      })
      .join("");
  }

  function getSubjectPerformance() {
    const subjects = getSubjects();
    const questions = getQuestions();
    const attempts = getAttempts();

    return subjects
      .map((subject) => {
        const questionIdsFromSubject = questions
          .filter((question) => {
            return question.subjectId === subject.id;
          })
          .map((question) => {
            return question.id;
          });

        const attemptsFromSubject = attempts.filter((attempt) => {
          return questionIdsFromSubject.includes(attempt.questionId);
        });

        const correctAttempts = attemptsFromSubject.filter((attempt) => {
          return getAttemptResult(attempt) === "correct";
        });

        const wrongAttempts = attemptsFromSubject.filter((attempt) => {
          return getAttemptResult(attempt) === "wrong";
        });

        const accuracy =
          attemptsFromSubject.length > 0
            ? (correctAttempts.length / attemptsFromSubject.length) * 100
            : 0;

        return {
          subject,
          attempts: attemptsFromSubject.length,
          correct: correctAttempts.length,
          wrong: wrongAttempts.length,
          accuracy,
        };
      })
      .sort((firstItem, secondItem) => {
        return secondItem.wrong - firstItem.wrong;
      });
  }

  function renderSubjectPerformance() {
    const subjectPerformance = getSubjectPerformance().filter((item) => {
      return item.attempts > 0;
    });

    if (subjectPerformance.length === 0) {
      renderEmptyState(
        subjectPerformanceList,
        "Nenhum desempenho por matéria ainda.",
        "Resolva questões para visualizar indicadores por matéria.",
      );
      return;
    }

    subjectPerformanceList.innerHTML = subjectPerformance
      .map((item) => {
        return `
          <article class="dashboard-list-item">
            <div>
              <strong>${escapeHTML(item.subject.name)}</strong>
              <span>
                ${item.correct} acertos • ${item.wrong} erros • ${item.attempts} tentativas
              </span>
            </div>

            <span class="dashboard-chip">
              ${escapeHTML(formatPercent(item.accuracy))}
            </span>
          </article>
        `;
      })
      .join("");
  }

  function renderPendingErrors(stats) {
    const pendingErrors = stats.pendingErrors.slice(0, 5);

    if (pendingErrors.length === 0) {
      renderEmptyState(
        pendingErrorsList,
        "Nenhum erro pendente encontrado.",
        "Quando uma questão for respondida incorretamente, ela aparecerá aqui.",
      );
      return;
    }

    pendingErrorsList.innerHTML = pendingErrors
      .map((review) => {
        const questionId = getReviewQuestionId(review);
        const question = questionId ? getQuestionById(questionId) : null;

        return `
          <article class="dashboard-list-item">
            <div>
              <strong>${escapeHTML(
                questionId ? getQuestionTitle(questionId) : "Erro pendente",
              )}</strong>
              <span>
                ${
                  question
                    ? `${escapeHTML(getSubjectName(question.subjectId))} • ${escapeHTML(
                        getThemeName(question.themeId),
                      )}`
                    : "Questão não encontrada."
                }
              </span>
              <small>${escapeHTML(formatDateTime(getReviewDate(review)))}</small>
            </div>

            <span class="dashboard-chip is-danger">Pendente</span>
          </article>
        `;
      })
      .join("");
  }

  function getContentAlerts() {
    const subjects = getSubjects();
    const themes = getThemes();
    const questions = getQuestions();
    const notes = getNotes();

    const alerts = [];

    subjects.forEach((subject) => {
      const subjectThemes = themes.filter((theme) => {
        return theme.subjectId === subject.id;
      });

      if (subjectThemes.length === 0) {
        alerts.push({
          title: subject.name,
          description: "Matéria sem temas cadastrados.",
          type: "Matéria",
        });
      }
    });

    themes.forEach((theme) => {
      const themeQuestions = questions.filter((question) => {
        return question.themeId === theme.id;
      });

      const themeNotes = notes.filter((note) => {
        return note.themeId === theme.id;
      });

      if (themeQuestions.length === 0) {
        alerts.push({
          title: theme.name,
          description: `Tema de ${getSubjectName(theme.subjectId)} sem questões.`,
          type: "Tema",
        });
      }

      if (themeNotes.length === 0) {
        alerts.push({
          title: theme.name,
          description: `Tema de ${getSubjectName(theme.subjectId)} sem anotações.`,
          type: "Tema",
        });
      }
    });

    return alerts.slice(0, 8);
  }

  function renderContentAlerts() {
    const alerts = getContentAlerts();

    if (alerts.length === 0) {
      renderEmptyState(
        contentAlertsList,
        "Nenhum ponto de atenção encontrado.",
        "Sua base de conteúdos está bem preenchida até aqui.",
      );
      return;
    }

    contentAlertsList.innerHTML = alerts
      .map((alert) => {
        return `
          <article class="dashboard-list-item">
            <div>
              <strong>${escapeHTML(alert.title)}</strong>
              <span>${escapeHTML(alert.description)}</span>
            </div>

            <span class="dashboard-chip">${escapeHTML(alert.type)}</span>
          </article>
        `;
      })
      .join("");
  }

  function renderDashboard() {
    const stats = getGeneralStats();

    renderSummaryCards(stats);
    renderPerformanceCards(stats);
    renderReviewCards(stats);
    renderContentCards(stats);
    renderRecentActivity(stats);
    renderSubjectPerformance();
    renderPendingErrors(stats);
    renderContentAlerts();
  }

  function showDashboardTab(tabName) {
    dashboardTabButtons.forEach((button) => {
      const isSelectedTab = button.dataset.dashboardTab === tabName;

      button.classList.toggle("is-active", isSelectedTab);
    });

    document
      .querySelector("#dashboard-summary-tab")
      ?.classList.toggle("is-active", tabName === "summary");

    document
      .querySelector("#dashboard-performance-tab")
      ?.classList.toggle("is-active", tabName === "performance");

    document
      .querySelector("#dashboard-reviews-tab")
      ?.classList.toggle("is-active", tabName === "reviews");

    document
      .querySelector("#dashboard-contents-tab")
      ?.classList.toggle("is-active", tabName === "contents");
  }

  dashboardTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showDashboardTab(button.dataset.dashboardTab);
    });
  });

  document.addEventListener("subjects:changed", renderDashboard);
  document.addEventListener("themes:changed", renderDashboard);
  document.addEventListener("questions:changed", renderDashboard);
  document.addEventListener("attempts:changed", renderDashboard);
  document.addEventListener("errorReviews:changed", renderDashboard);
  document.addEventListener("notes:changed", renderDashboard);

  renderDashboard();

  console.log("Dashboard inteligente carregado.");
}
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
  const performanceCards = document.querySelector(
    "#dashboard-performance-cards",
  );
  const reviewCards = document.querySelector("#dashboard-review-cards");
  const contentCards = document.querySelector("#dashboard-content-cards");

  const recentActivityList = document.querySelector(
    "#dashboard-recent-activity",
  );
  const subjectPerformanceList = document.querySelector(
    "#dashboard-subject-performance",
  );
  const pendingErrorsList = document.querySelector("#dashboard-pending-errors");
  const contentAlertsList = document.querySelector("#dashboard-content-alerts");
  const topErrorSubjectsList = document.querySelector(
    "#dashboard-top-error-subjects",
  );
  const topErrorThemesList = document.querySelector(
    "#dashboard-top-error-themes",
  );
  const topPendingSubjectsList = document.querySelector(
    "#dashboard-top-pending-subjects",
  );

  const topPendingThemesList = document.querySelector(
    "#dashboard-top-pending-themes",
  );
  const priorityNotesList = document.querySelector("#dashboard-priority-notes");

  if (
    !priorityNotesList ||
    !topPendingSubjectsList ||
    !topPendingThemesList ||
    !topErrorSubjectsList ||
    !topErrorThemesList ||
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

  function getNoteSubjectName(note) {
    if (!note.subjectId) {
      return "Livre";
    }

    return getSubjectName(note.subjectId);
  }

  function getNoteThemeName(note) {
    if (!note.themeId) {
      return "Sem tema";
    }

    return getThemeName(note.themeId);
  }

  function getShortTags(tags, limit = 2) {
    if (!Array.isArray(tags) || tags.length === 0) {
      return [];
    }

    return tags.slice(0, limit);
  }

  const NOTE_STATUS_LABELS = {
    rascunho: "Rascunho",
    finalizada: "Finalizada",
    revisar: "Revisar depois",
    flashcard: "Virar flashcard",
    importante: "Importante",
  };

  const NOTE_STATUS_ICONS = {
    rascunho: "✏️",
    finalizada: "✅",
    revisar: "🔁",
    flashcard: "🃏",
    importante: "⚠️",
  };

  function getNoteStatusIcon(status) {
    return NOTE_STATUS_ICONS[status] || "✏️";
  }

  function getNoteStatusLabel(status) {
    return NOTE_STATUS_LABELS[status] || "Rascunho";
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
      review.answeredAt ||
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
    return (
      review.questionId || review.sourceQuestionId || review.idQuestion || null
    );
  }

  function getPendingErrorAttempts() {
    const reviewedAttemptIds = new Set(
      getErrorReviews().map((review) => {
        return review.attemptId;
      }),
    );

    const wrongAttempts = getAttempts().filter((attempt) => {
      return getAttemptResult(attempt) === "wrong";
    });

    const lastWrongAttemptByQuestion = new Map();

    wrongAttempts.forEach((attempt) => {
      if (reviewedAttemptIds.has(attempt.id)) {
        return;
      }

      const currentSavedAttempt = lastWrongAttemptByQuestion.get(
        attempt.questionId,
      );

      if (
        !currentSavedAttempt ||
        new Date(getAttemptDate(attempt)) >
          new Date(getAttemptDate(currentSavedAttempt))
      ) {
        lastWrongAttemptByQuestion.set(attempt.questionId, attempt);
      }
    });

    return Array.from(lastWrongAttemptByQuestion.values()).sort(
      (firstAttempt, secondAttempt) => {
        return (
          new Date(getAttemptDate(secondAttempt)) -
          new Date(getAttemptDate(firstAttempt))
        );
      },
    );
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

    const pendingErrors = getPendingErrorAttempts();
    const reviewedErrors = errorReviews;

    const accuracy =
      attempts.length > 0
        ? (correctAttempts.length / attempts.length) * 100
        : 0;

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
        title: "Questões pendentes",
        value: stats.pendingErrors.length,
        description: "Questões erradas que ainda precisam de revisão.",
      }),
      createCard({
        title: "Revisões feitas",
        value: stats.reviewedErrors.length,
        description: "Erros já transformados em regra de correção.",
      }),
      createCard({
        title: "Tentativas erradas",
        value: stats.wrongAttempts.length,
        description: "Total de respostas incorretas registradas.",
      }),
      createCard({
        title: "Taxa de revisão",
        value: formatPercent(
          stats.wrongAttempts.length > 0
            ? (stats.reviewedErrors.length / stats.wrongAttempts.length) * 100
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
      .map((attempt) => {
        const questionId = getReviewQuestionId(attempt);
        const question = questionId ? getQuestionById(questionId) : null;

        return `
        <article class="dashboard-list-item dashboard-pending-error-item">
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

            <small>${escapeHTML(formatDateTime(getReviewDate(attempt)))}</small>
          </div>

          <button
            class="dashboard-link-button dashboard-link-button--danger"
            type="button"
            data-open-dashboard-review-error="${escapeHTML(attempt.id)}"
            aria-label="Revisar erro pendente"
            title="Revisar erro"
          >
            🔗
          </button>
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
          entityLabel: "Matéria",
          middleText: " sem ",
          missing: "themes",
          suffix: " cadastrados.",
          targetSection: "themes",
          targetAction: "create-theme",
          subjectId: subject.id,
          themeId: null,
          priority: 1,
        });
      }
    });

    themes.forEach((theme) => {
      const themeQuestions = questions.filter((question) => {
        return question.themeId === theme.id;
      });

      const themeNotes = notes.filter((note) => {
        return note.themeId === theme.id && !note.isArchived;
      });

      if (themeQuestions.length === 0) {
        alerts.push({
          title: theme.name,
          entityLabel: "Tema",
          middleText: ` de ${getSubjectName(theme.subjectId)} sem `,
          missing: "questions",
          suffix: ".",
          targetSection: "questions",
          targetAction: "create-question",
          subjectId: theme.subjectId,
          themeId: theme.id,
          priority: 2,
        });
      }

      if (themeNotes.length === 0) {
        alerts.push({
          title: theme.name,
          entityLabel: "Tema",
          middleText: ` de ${getSubjectName(theme.subjectId)} sem `,
          missing: "notes",
          suffix: ".",
          targetSection: "notes",
          targetAction: "create-note",
          subjectId: theme.subjectId,
          themeId: theme.id,
          priority: 3,
        });
      }
    });

    return alerts
      .sort((firstAlert, secondAlert) => {
        return firstAlert.priority - secondAlert.priority;
      })
      .slice(0, 5);
  }

  function getPriorityNotes() {
    return getNotes()
      .filter((note) => {
        if (note.isArchived) {
          return false;
        }

        return (
          note.status === "revisar" ||
          note.status === "importante" ||
          note.isPinned ||
          note.isFavorite
        );
      })
      .sort((firstNote, secondNote) => {
        const firstPinnedValue = firstNote.isPinned ? 1 : 0;
        const secondPinnedValue = secondNote.isPinned ? 1 : 0;

        if (firstPinnedValue !== secondPinnedValue) {
          return secondPinnedValue - firstPinnedValue;
        }

        return new Date(secondNote.updatedAt) - new Date(firstNote.updatedAt);
      })
      .slice(0, 5);
  }

  function renderPriorityNotes() {
    const priorityNotes = getPriorityNotes();

    if (priorityNotes.length === 0) {
      renderEmptyState(
        priorityNotesList,
        "Nenhuma anotação prioritária.",
        "Anotações fixadas, favoritas, importantes ou para revisar aparecerão aqui.",
      );
      return;
    }

    priorityNotesList.innerHTML = priorityNotes
      .map((note) => {
        const markers = [
          note.isPinned ? "📌 Fixada" : "",
          note.isFavorite ? "⭐ Favorita" : "",
          note.status === "importante" ? "Importante" : "",
          note.status === "revisar" ? "Revisar" : "",
        ].filter(Boolean);

        const visibleTags = getShortTags(note.tags);
        const hiddenTagsCount = Array.isArray(note.tags)
          ? Math.max(note.tags.length - visibleTags.length, 0)
          : 0;

        return `
        <article class="dashboard-list-item dashboard-note-priority-item">
          <div>
            <strong>${escapeHTML(note.title)}</strong>

            <span>
              ${getNoteStatusIcon(note.status)}
              ${escapeHTML(getNoteStatusLabel(note.status))}
              ${
                markers.length > 0 ? `• ${escapeHTML(markers.join(" • "))}` : ""
              }
            </span>

            <span>
              ${escapeHTML(getNoteSubjectName(note))}
              •
              ${escapeHTML(getNoteThemeName(note))}
            </span>

            ${
              visibleTags.length > 0
                ? `
                  <div class="dashboard-note-tags">
                    ${visibleTags
                      .map((tag) => {
                        return `<span>#${escapeHTML(tag)}</span>`;
                      })
                      .join("")}

                    ${
                      hiddenTagsCount > 0
                        ? `<span>+${hiddenTagsCount}</span>`
                        : ""
                    }
                  </div>
                `
                : ""
            }

            <small>
              Editada em ${escapeHTML(formatDateTime(note.updatedAt))}
            </small>
          </div>

          <button
            class="dashboard-link-button"
            type="button"
            data-open-dashboard-note="${note.id}"
            aria-label="Abrir anotação ${escapeHTML(note.title)}"
            title="Abrir anotação"
          >
            🔗
          </button>
        </article>
      `;
      })
      .join("");
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
        <article class="dashboard-list-item dashboard-content-alert-item">
          <div>
            <strong>${escapeHTML(alert.title)}</strong>
            <span>${getContentAlertMessage(alert)}</span>
          </div>

          <button
            class="dashboard-link-button"
            type="button"
            data-open-dashboard-section="${escapeHTML(alert.targetSection)}"
            data-dashboard-action="${escapeHTML(alert.targetAction)}"
            data-dashboard-subject-id="${escapeHTML(alert.subjectId || "")}"
            data-dashboard-theme-id="${escapeHTML(alert.themeId || "")}"
            aria-label="Ir para a seção relacionada"
            title="Ir para seção"
          >
            🔗
          </button>
        </article>
      `;
      })
      .join("");
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

  function getTopErrorSubjects() {
    const subjectPerformance = getSubjectPerformance();

    return subjectPerformance
      .filter((item) => {
        return item.wrong > 0;
      })
      .sort((firstItem, secondItem) => {
        return secondItem.wrong - firstItem.wrong;
      })
      .slice(0, 5);
  }

  function getThemePerformance() {
    const themes = getThemes();
    const questions = getQuestions();
    const attempts = getAttempts();

    return themes
      .map((theme) => {
        const questionIdsFromTheme = questions
          .filter((question) => {
            return question.themeId === theme.id;
          })
          .map((question) => {
            return question.id;
          });

        const attemptsFromTheme = attempts.filter((attempt) => {
          return questionIdsFromTheme.includes(attempt.questionId);
        });

        const correctAttempts = attemptsFromTheme.filter((attempt) => {
          return getAttemptResult(attempt) === "correct";
        });

        const wrongAttempts = attemptsFromTheme.filter((attempt) => {
          return getAttemptResult(attempt) === "wrong";
        });

        const accuracy =
          attemptsFromTheme.length > 0
            ? (correctAttempts.length / attemptsFromTheme.length) * 100
            : 0;

        return {
          theme,
          attempts: attemptsFromTheme.length,
          correct: correctAttempts.length,
          wrong: wrongAttempts.length,
          accuracy,
        };
      })
      .sort((firstItem, secondItem) => {
        return secondItem.wrong - firstItem.wrong;
      });
  }

  function getTopErrorThemes() {
    const themePerformance = getThemePerformance();

    return themePerformance
      .filter((item) => {
        return item.wrong > 0;
      })
      .sort((firstItem, secondItem) => {
        return secondItem.wrong - firstItem.wrong;
      })
      .slice(0, 5);
  }

  function renderTopErrorSubjects() {
    const topErrorSubjects = getTopErrorSubjects();

    if (topErrorSubjects.length === 0) {
      renderEmptyState(
        topErrorSubjectsList,
        "Nenhuma matéria com erro registrada.",
        "Quando houver respostas incorretas, as matérias com mais erros aparecerão aqui.",
      );
      return;
    }

    topErrorSubjectsList.innerHTML = topErrorSubjects
      .map((item, index) => {
        return `
        <article class="dashboard-rank-item">
          <span class="dashboard-rank-position">
            ${String(index + 1).padStart(2, "0")}
          </span>

          <div>
            <strong>${escapeHTML(item.subject.name)}</strong>
            <span>
              ${item.wrong} erros • ${item.correct} acertos • ${item.attempts} tentativas
            </span>
          </div>

          <span class="dashboard-chip is-danger">
            ${item.wrong} erros
          </span>
        </article>
      `;
      })
      .join("");
  }

  function renderTopErrorThemes() {
    const topErrorThemes = getTopErrorThemes();

    if (topErrorThemes.length === 0) {
      renderEmptyState(
        topErrorThemesList,
        "Nenhum tema com erro registrado.",
        "Quando houver respostas incorretas, os temas com mais erros aparecerão aqui.",
      );
      return;
    }

    topErrorThemesList.innerHTML = topErrorThemes
      .map((item, index) => {
        return `
        <article class="dashboard-rank-item">
          <span class="dashboard-rank-position">
            ${String(index + 1).padStart(2, "0")}
          </span>

          <div>
            <strong>${escapeHTML(item.theme.name)}</strong>
            <span>
              ${escapeHTML(getSubjectName(item.theme.subjectId))} •
              ${item.wrong} erros •
              ${item.correct} acertos
            </span>
          </div>

          <span class="dashboard-chip is-danger">
            ${item.wrong} erros
          </span>
        </article>
      `;
      })
      .join("");
  }

  function sortRankingByCount(firstItem, secondItem) {
    return secondItem.count - firstItem.count;
  }

  function getTopPendingSubjects() {
    const stats = getGeneralStats();
    const pendingErrors = stats.pendingErrors;

    const pendingBySubject = new Map();

    pendingErrors.forEach((review) => {
      const questionId = getReviewQuestionId(review);
      const question = questionId ? getQuestionById(questionId) : null;

      if (!question || !question.subjectId) {
        return;
      }

      const subjectName = getSubjectName(question.subjectId);
      const currentItem = pendingBySubject.get(question.subjectId) || {
        id: question.subjectId,
        name: subjectName,
        count: 0,
      };

      currentItem.count += 1;

      pendingBySubject.set(question.subjectId, currentItem);
    });

    return Array.from(pendingBySubject.values())
      .sort(sortRankingByCount)
      .slice(0, 5);
  }

  function getTopPendingThemes() {
    const stats = getGeneralStats();
    const pendingErrors = stats.pendingErrors;

    const pendingByTheme = new Map();

    pendingErrors.forEach((review) => {
      const questionId = getReviewQuestionId(review);
      const question = questionId ? getQuestionById(questionId) : null;

      if (!question || !question.themeId) {
        return;
      }

      const theme = getThemeById(question.themeId);
      const themeName = theme ? theme.name : "Tema removido";
      const subjectName = question.subjectId
        ? getSubjectName(question.subjectId)
        : "Matéria removida";

      const currentItem = pendingByTheme.get(question.themeId) || {
        id: question.themeId,
        name: themeName,
        subjectName,
        count: 0,
      };

      currentItem.count += 1;

      pendingByTheme.set(question.themeId, currentItem);
    });

    return Array.from(pendingByTheme.values())
      .sort(sortRankingByCount)
      .slice(0, 5);
  }

  function renderTopPendingSubjects() {
    const topPendingSubjects = getTopPendingSubjects();

    if (topPendingSubjects.length === 0) {
      renderEmptyState(
        topPendingSubjectsList,
        "Nenhuma matéria com pendência.",
        "Quando houver erros pendentes, as matérias mais recorrentes aparecerão aqui.",
      );
      return;
    }

    topPendingSubjectsList.innerHTML = topPendingSubjects
      .map((item, index) => {
        return `
        <article class="dashboard-rank-item">
          <span class="dashboard-rank-position">
            ${String(index + 1).padStart(2, "0")}
          </span>

          <div>
            <strong>${escapeHTML(item.name)}</strong>
            <span>
              ${item.count} ${item.count === 1 ? "erro pendente" : "erros pendentes"}
            </span>
          </div>

          <span class="dashboard-chip is-danger">
            ${item.count}
          </span>
        </article>
      `;
      })
      .join("");
  }

  function renderTopPendingThemes() {
    const topPendingThemes = getTopPendingThemes();

    if (topPendingThemes.length === 0) {
      renderEmptyState(
        topPendingThemesList,
        "Nenhum tema com pendência.",
        "Quando houver erros pendentes, os temas mais recorrentes aparecerão aqui.",
      );
      return;
    }

    topPendingThemesList.innerHTML = topPendingThemes
      .map((item, index) => {
        return `
        <article class="dashboard-rank-item">
          <span class="dashboard-rank-position">
            ${String(index + 1).padStart(2, "0")}
          </span>

          <div>
            <strong>${escapeHTML(item.name)}</strong>
            <span>
              ${escapeHTML(item.subjectName)} •
              ${item.count} ${item.count === 1 ? "erro pendente" : "erros pendentes"}
            </span>
          </div>

          <span class="dashboard-chip is-danger">
            ${item.count}
          </span>
        </article>
      `;
      })
      .join("");
  }

  function getContentAlertMessage(alert) {
    const missingLabel = {
      themes: "temas",
      questions: "questões",
      notes: "anotações",
    };

    return `
    <strong class="dashboard-entity-highlight">
      ${escapeHTML(alert.entityLabel)}
    </strong>
    ${escapeHTML(alert.middleText)}
    <strong class="dashboard-missing-word">
      ${escapeHTML(missingLabel[alert.missing] || "conteúdos")}
    </strong>
    ${escapeHTML(alert.suffix)}
  `;
  }

  function requestAppNavigation(sectionId) {
    document.dispatchEvent(
      new CustomEvent("app:navigate", {
        detail: {
          sectionId,
        },
      }),
    );
  }

  function handleDashboardSectionOpen(event) {
    const openButton = event.target.closest("[data-open-dashboard-section]");

    if (!openButton) {
      return;
    }

    const sectionId = openButton.dataset.openDashboardSection;
    const action = openButton.dataset.dashboardAction;
    const subjectId = openButton.dataset.dashboardSubjectId || null;
    const themeId = openButton.dataset.dashboardThemeId || null;

    requestAppNavigation(sectionId);

    const eventByAction = {
      "create-theme": "themes:prepare-create",
      "create-question": "questions:prepare-create",
      "create-note": "notes:prepare-create",
    };

    const eventName = eventByAction[action];

    if (!eventName) {
      return;
    }

    document.dispatchEvent(
      new CustomEvent(eventName, {
        detail: {
          subjectId,
          themeId,
        },
      }),
    );
  }

  function handleDashboardNoteOpen(event) {
    const openButton = event.target.closest("[data-open-dashboard-note]");

    if (!openButton) {
      return;
    }

    const noteId = openButton.dataset.openDashboardNote;

    requestAppNavigation("notes");

    document.dispatchEvent(
      new CustomEvent("notes:open-note", {
        detail: {
          noteId,
        },
      }),
    );
  }

  function handleDashboardReviewErrorOpen(event) {
    const openButton = event.target.closest(
      "[data-open-dashboard-review-error]",
    );

    if (!openButton) {
      return;
    }

    const attemptId = openButton.dataset.openDashboardReviewError;

    requestAppNavigation("reviews");

    document.dispatchEvent(
      new CustomEvent("reviews:open-error-review", {
        detail: {
          attemptId,
        },
      }),
    );
  }

  //------------------------------------------------------

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

    renderTopErrorSubjects();
    renderTopErrorThemes();

    renderTopPendingSubjects();
    renderTopPendingThemes();

    renderPriorityNotes();
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
  
  priorityNotesList.addEventListener("click", handleDashboardNoteOpen);
  contentAlertsList.addEventListener("click", handleDashboardSectionOpen);
pendingErrorsList.addEventListener("click", handleDashboardReviewErrorOpen);
  renderDashboard();

  console.log("Dashboard inteligente carregado.");
}

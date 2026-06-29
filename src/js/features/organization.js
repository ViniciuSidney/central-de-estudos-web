import { getCollection, saveCollection } from "../core/storage.js";
import { compareNames } from "../systems/listTextImport.js";
import { addSubtopic, deleteSubtopic } from "./subtopics.js";
import {
  removeThemesQuestionsAndRelatedDataBySubjectIds,
  removeQuestionsAndRelatedDataByThemeIds,
  removeSubtopicsQuestionsAndRelatedDataByThemeIds,
} from "../systems/dataIntegrity.js";

const SUBJECTS_COLLECTION = "subjects";
const THEMES_COLLECTION = "themes";
const SUBTOPICS_COLLECTION = "subtopics";
const QUESTIONS_COLLECTION = "questions";
const ATTEMPTS_COLLECTION = "attempts";
const ERROR_REVIEWS_COLLECTION = "errorReviews";

export function initOrganization() {
  const organizationSection = document.querySelector("#organization");

  if (!organizationSection) {
    return;
  }

  const organizationTree = organizationSection.querySelector(".organization-tree");
  const organizationMainPanel = organizationSection.querySelector(".organization-main-panel");
  const subjectSearchForm = organizationMainPanel?.querySelector(".organization-search");
  const subjectSearchInput = organizationMainPanel?.querySelector('.organization-search input[type="search"]');
  const subjectGallery = organizationMainPanel?.querySelector(".organization-gallery");
  const subjectFeatureCard = organizationMainPanel?.querySelector(".organization-feature-card--active, .organization-feature-card--empty");
  const subjectAddCard = organizationMainPanel?.querySelector(".organization-fixed-row > .organization-add-card");
  const emptySubjectsState = organizationSection.querySelector("#organization-empty-subjects");
  const noSubjectResultsState = organizationSection.querySelector("#organization-no-subject-results");

  const subjectModalLayer = organizationSection.querySelector("#organization-subject-panel-preview");
  const subjectModalTitle = subjectModalLayer?.querySelector("#organization-subject-modal-title");
  const subjectModalCloseButton = subjectModalLayer?.querySelector(".organization-modal-close");

  const subjectModalContent = subjectModalLayer?.querySelector(".organization-subject-content");
  const themeSearchForm = subjectModalContent?.querySelector(".organization-search--compact");
  const themeSearchInput = themeSearchForm?.querySelector('input[type="search"]');
  const themeFeatureCard = subjectModalContent?.querySelector(".organization-fixed-row--modal .organization-feature-card--active");
  const themeAddCard = subjectModalContent?.querySelector(".organization-fixed-row--modal .organization-add-card");
  const themeGallery = subjectModalContent?.querySelector(".organization-modal-gallery");
  const emptyThemesState = subjectModalContent?.querySelector("#organization-empty-themes");
  const noThemeResultsState = subjectModalContent?.querySelector("#organization-no-theme-results");

  const topicPanel = subjectModalLayer?.querySelector(".organization-topic-panel");
  const topicPanelTitle = topicPanel?.querySelector(".organization-modal-header--compact h3");
  const subtopicSearchForm = topicPanel?.querySelector(".organization-search--compact");
  const subtopicSearchInput = subtopicSearchForm?.querySelector('input[type="search"]');
  const subtopicAddCard = topicPanel?.querySelector(".organization-add-card--horizontal");
  const selectThemeState = topicPanel?.querySelector("#organization-select-theme-state");
  const subtopicList = topicPanel?.querySelector(".organization-subtopic-list");
  const emptySubtopicsState = topicPanel?.querySelector("#organization-empty-subtopics");
  const noSubtopicResultsState = topicPanel?.querySelector("#organization-no-subtopic-results");
  const deleteModalLayer = organizationSection.querySelector("#organization-delete-modal");
  const deleteModalTitle = deleteModalLayer?.querySelector("#organization-delete-title");
  const deleteModalName = deleteModalLayer?.querySelector(".organization-delete-modal__name");
  const deleteModalDescription = deleteModalLayer?.querySelector("#organization-delete-description");
  const deleteModalStats = deleteModalLayer?.querySelector(".organization-delete-modal__stats");
  const deleteModalCheckInput = deleteModalLayer?.querySelector(".organization-delete-modal__check input");
  const deleteModalConfirmButton = deleteModalLayer?.querySelector(".organization-delete-modal__confirm");
  const deleteModalCancelButton = deleteModalLayer?.querySelector(".organization-delete-modal__cancel");
  const deleteModalCloseButton = deleteModalLayer?.querySelector(".organization-modal-close");

  if (
    !deleteModalLayer ||
    !deleteModalTitle ||
    !deleteModalName ||
    !deleteModalDescription ||
    !deleteModalStats ||
    !deleteModalCheckInput ||
    !deleteModalConfirmButton ||
    !deleteModalCancelButton ||
    !deleteModalCloseButton ||
    !organizationTree ||
    !organizationMainPanel ||
    !subjectSearchForm ||
    !subjectSearchInput ||
    !subjectGallery ||
    !subjectFeatureCard ||
    !subjectAddCard ||
    !emptySubjectsState ||
    !noSubjectResultsState ||
    !subjectModalLayer ||
    !subjectModalTitle ||
    !subjectModalCloseButton ||
    !subjectModalContent ||
    !themeSearchForm ||
    !themeSearchInput ||
    !themeFeatureCard ||
    !themeAddCard ||
    !themeGallery ||
    !emptyThemesState ||
    !noThemeResultsState ||
    !topicPanel ||
    !topicPanelTitle ||
    !subtopicSearchForm ||
    !subtopicSearchInput ||
    !subtopicAddCard ||
    !selectThemeState ||
    !subtopicList ||
    !emptySubtopicsState ||
    !noSubtopicResultsState
  ) {
    console.warn("Organização v1.2 não iniciada: elementos não encontrados.");
    return;
  }

  let selectedSubjectId = null;
  let selectedThemeId = null;
  let selectedSubtopicId = null;

  let subjectSearchText = "";
  let themeSearchText = "";
  let subtopicSearchText = "";

  let isSubjectModalOpen = false;
  let isDeleteModalOpen = false;

  let subjectCardMode = "view";
  let themeCardMode = "view";
  let isSubtopicFormOpen = false;
  let editingSubtopicId = null;

  let pendingDeleteTarget = null;

  const collapsedSubjectIds = new Set();
  const collapsedThemeIds = new Set();

  function getSubjects() {
    return getCollection(SUBJECTS_COLLECTION);
  }

  function getThemes() {
    return getCollection(THEMES_COLLECTION);
  }

  function getSubtopics() {
    return getCollection(SUBTOPICS_COLLECTION);
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

  function saveSubjects(subjects) {
    saveCollection(SUBJECTS_COLLECTION, subjects);
  }

  function saveThemes(themes) {
    saveCollection(THEMES_COLLECTION, themes);
  }

  function saveSubtopics(subtopics) {
    saveCollection(SUBTOPICS_COLLECTION, subtopics);
  }

  function notifySubjectsChanged() {
    document.dispatchEvent(new CustomEvent("subjects:changed"));
  }

  function notifyThemesChanged() {
    document.dispatchEvent(new CustomEvent("themes:changed"));
  }

  function notifySubtopicsChanged() {
    document.dispatchEvent(new CustomEvent("subtopics:changed"));
  }

  function notifyQuestionsChanged() {
    document.dispatchEvent(new CustomEvent("questions:changed"));
  }

  function notifyAttemptsChanged() {
    document.dispatchEvent(new CustomEvent("attempts:changed"));
  }

  function notifyErrorReviewsChanged() {
    document.dispatchEvent(new CustomEvent("errorReviews:changed"));
  }

  function notifyOrganizationRelatedDataChanged() {
    notifySubjectsChanged();
    notifyThemesChanged();
    notifySubtopicsChanged();
    notifyQuestionsChanged();
    notifyAttemptsChanged();
    notifyErrorReviewsChanged();
  }

  function createSubject(name) {
    return {
      id: crypto.randomUUID(),
      name,
      description: "",
      createdAt: new Date().toISOString(),
    };
  }

  function createTheme({ subjectId, name }) {
    return {
      id: crypto.randomUUID(),
      subjectId,
      name,
      description: "",
      createdAt: new Date().toISOString(),
    };
  }

  function findDuplicatedSubject(name) {
    return getSubjects().find((subject) => {
      return compareNames(subject.name, name);
    });
  }

  function findDuplicatedTheme({ subjectId, name }) {
    return getThemesBySubjectId(subjectId).find((theme) => {
      return compareNames(theme.name, name);
    });
  }

  function findDuplicatedSubjectIgnoringCurrent({ subjectId, name }) {
    return getSubjects().find((subject) => {
      return subject.id !== subjectId && compareNames(subject.name, name);
    });
  }

  function findDuplicatedThemeIgnoringCurrent({ themeId, subjectId, name }) {
    return getThemesBySubjectId(subjectId).find((theme) => {
      return theme.id !== themeId && compareNames(theme.name, name);
    });
  }

  function findDuplicatedSubtopicIgnoringCurrent({ subtopicId, themeId, name }) {
    return getSubtopicsByThemeId(themeId).find((subtopic) => {
      return subtopic.id !== subtopicId && compareNames(subtopic.name, name);
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

  function getSubtopicById(subtopicId) {
    return getSubtopics().find((subtopic) => {
      return subtopic.id === subtopicId;
    });
  }

  function getQuestionById(questionId) {
    return getQuestions().find((question) => {
      return question.id === questionId;
    });
  }

  function getThemesBySubjectId(subjectId) {
    return getThemes().filter((theme) => {
      return theme.subjectId === subjectId;
    });
  }

  function getSubtopicsByThemeId(themeId) {
    return getSubtopics().filter((subtopic) => {
      return subtopic.themeId === themeId;
    });
  }

  function getQuestionsBySubjectId(subjectId) {
    return getQuestions().filter((question) => {
      return question.subjectId === subjectId;
    });
  }

  function getQuestionsByThemeId(themeId) {
    return getQuestions().filter((question) => {
      return question.themeId === themeId;
    });
  }

  function getQuestionsBySubtopicId(subtopicId) {
    return getQuestions().filter((question) => {
      return question.subtopicId === subtopicId;
    });
  }

  function getSubtopicsBySubjectId(subjectId) {
    return getSubtopics().filter((subtopic) => {
      return subtopic.subjectId === subjectId;
    });
  }

  function saveQuestions(questions) {
    saveCollection(QUESTIONS_COLLECTION, questions);
  }

  function unlinkQuestionsFromSubtopic(subtopicId) {
    const updatedQuestions = getQuestions().map((question) => {
      if (question.subtopicId !== subtopicId) {
        return question;
      }

      return {
        ...question,
        subtopicId: null,
        updatedAt: new Date().toISOString(),
      };
    });

    saveQuestions(updatedQuestions);
    notifyQuestionsChanged();
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeText(value) {
    return String(value ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replaceAll(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function getCardNameSizeClass(name) {
    const nameLength = normalizeText(name).length;

    if (nameLength >= 34) {
      return "organization-card__name--very-long";
    }

    if (nameLength >= 24) {
      return "organization-card__name--long";
    }

    return "";
  }

  function getPendingErrorAttempts() {
    const wrongAttempts = getAttempts().filter((attempt) => {
      return !attempt.isCorrect;
    });

    const lastWrongAttemptByQuestion = new Map();

    wrongAttempts.forEach((attempt) => {
      const savedAttempt = lastWrongAttemptByQuestion.get(attempt.questionId);

      if (!savedAttempt || new Date(attempt.answeredAt) > new Date(savedAttempt.answeredAt)) {
        lastWrongAttemptByQuestion.set(attempt.questionId, attempt);
      }
    });

    const reviewedAttemptIds = new Set(
      getErrorReviews()
        .filter((review) => {
          return review.isReviewed;
        })
        .map((review) => {
          return review.attemptId;
        }),
    );

    return Array.from(lastWrongAttemptByQuestion.values()).filter((attempt) => {
      return !reviewedAttemptIds.has(attempt.id);
    });
  }

  function getAttemptQuestion(attempt) {
    return getQuestionById(attempt.questionId);
  }

  function getPendingErrorsBySubjectId(subjectId) {
    return getPendingErrorAttempts().filter((attempt) => {
      return attempt.subjectId === subjectId;
    });
  }

  function getPendingErrorsByThemeId(themeId) {
    return getPendingErrorAttempts().filter((attempt) => {
      const question = getAttemptQuestion(attempt);

      return attempt.themeId === themeId || question?.themeId === themeId;
    });
  }

  function getPendingErrorsBySubtopicId(subtopicId) {
    return getPendingErrorAttempts().filter((attempt) => {
      const question = getAttemptQuestion(attempt);

      return attempt.subtopicId === subtopicId || question?.subtopicId === subtopicId;
    });
  }

  function getFilteredSubjects() {
    const subjects = getSubjects();

    if (!subjectSearchText) {
      return subjects;
    }

    return subjects.filter((subject) => {
      return normalizeText(subject.name).includes(subjectSearchText);
    });
  }

  function getFilteredThemesFromSelectedSubject() {
    if (!selectedSubjectId) {
      return [];
    }

    const themes = getThemesBySubjectId(selectedSubjectId);

    if (!themeSearchText) {
      return themes;
    }

    return themes.filter((theme) => {
      return normalizeText(theme.name).includes(themeSearchText);
    });
  }

  function getFilteredSubtopicsFromSelectedTheme() {
    if (!selectedThemeId) {
      return [];
    }

    const subtopics = getSubtopicsByThemeId(selectedThemeId);

    if (!subtopicSearchText) {
      return subtopics;
    }

    return subtopics.filter((subtopic) => {
      return normalizeText(subtopic.name).includes(subtopicSearchText);
    });
  }

  function ensureSelectedSubject() {
    const subjects = getSubjects();

    if (selectedSubjectId) {
      const selectedSubjectStillExists = subjects.some((subject) => {
        return subject.id === selectedSubjectId;
      });

      if (selectedSubjectStillExists) {
        return;
      }
    }

    selectedSubjectId = subjects[0]?.id || null;
    selectedThemeId = null;
    selectedSubtopicId = null;
  }

  function ensureSelectedThemeBelongsToSubject() {
    if (!selectedSubjectId || !selectedThemeId) {
      selectedThemeId = null;
      selectedSubtopicId = null;
      return;
    }

    const theme = getThemeById(selectedThemeId);

    if (!theme || theme.subjectId !== selectedSubjectId) {
      selectedThemeId = null;
      selectedSubtopicId = null;
    }
  }

  function ensureSelectedSubtopicBelongsToTheme() {
    if (!selectedThemeId || !selectedSubtopicId) {
      selectedSubtopicId = null;
      return;
    }

    const subtopic = getSubtopicById(selectedSubtopicId);

    if (!subtopic || subtopic.themeId !== selectedThemeId) {
      selectedSubtopicId = null;
    }
  }

  function selectSubject(subjectId) {
    const subject = getSubjectById(subjectId);

    if (!subject) {
      return;
    }

    selectedSubjectId = subject.id;
    selectedThemeId = null;
    selectedSubtopicId = null;

    subjectCardMode = "view";
    themeCardMode = "view";
    isSubtopicFormOpen = false;
    editingSubtopicId = null;

    renderOrganization();
  }

  function selectTheme(themeId) {
    const theme = getThemeById(themeId);

    if (!theme) {
      return;
    }

    selectedSubjectId = theme.subjectId;
    selectedThemeId = theme.id;
    selectedSubtopicId = null;

    themeCardMode = "view";
    isSubtopicFormOpen = false;
    editingSubtopicId = null;

    renderOrganization();
  }

  function selectSubtopic(subtopicId) {
    const subtopic = getSubtopicById(subtopicId);

    if (!subtopic) {
      return;
    }

    selectedSubjectId = subtopic.subjectId;
    selectedThemeId = subtopic.themeId;
    selectedSubtopicId = subtopic.id;

    themeCardMode = "view";
    isSubtopicFormOpen = false;
    editingSubtopicId = null;

    renderOrganization();
  }

  function toggleCollapsedSubject(subjectId) {
    if (!subjectId) {
      return;
    }

    if (collapsedSubjectIds.has(subjectId)) {
      collapsedSubjectIds.delete(subjectId);
    } else {
      collapsedSubjectIds.add(subjectId);
    }

    renderOrganizationTree();
  }

  function toggleCollapsedTheme(themeId) {
    if (!themeId) {
      return;
    }

    if (collapsedThemeIds.has(themeId)) {
      collapsedThemeIds.delete(themeId);
    } else {
      collapsedThemeIds.add(themeId);
    }

    renderOrganizationTree();
  }

  function renderOrganizationTree() {
    const subjects = getSubjects();

    organizationTree.innerHTML = "";

    if (subjects.length === 0) {
      organizationTree.innerHTML = `
			<div class="organization-state organization-state--compact">
				<strong>Nenhuma matéria.</strong>
				<span>Adicione uma matéria para montar sua estrutura.</span>
			</div>
		`;

      return;
    }

    subjects.forEach((subject) => {
      const subjectThemes = getThemesBySubjectId(subject.id);
      const isSelectedSubject = selectedSubjectId === subject.id;
      const isSubjectCollapsed = collapsedSubjectIds.has(subject.id);
      const shouldShowThemes = subjectThemes.length > 0 && !isSubjectCollapsed;

      const group = document.createElement("div");
      group.classList.add("organization-tree__group");

      if (!isSubjectCollapsed) {
        group.classList.add("is-open");
      }

      const themesHTML = subjectThemes
        .map((theme) => {
          const themeSubtopics = getSubtopicsByThemeId(theme.id);
          const isSelectedTheme = selectedThemeId === theme.id;
          const isThemeCollapsed = collapsedThemeIds.has(theme.id);
          const shouldShowSubtopics = themeSubtopics.length > 0 && !isThemeCollapsed;

          const subtopicsHTML = themeSubtopics
            .map((subtopic) => {
              const isSelectedSubtopic = selectedSubtopicId === subtopic.id;

              return `
							<button
								class="organization-tree__item organization-tree__item--subtopic ${isSelectedSubtopic ? "is-active" : ""}"
								type="button"
								data-organization-tree-subtopic="${escapeHTML(subtopic.id)}"
							>
								${escapeHTML(subtopic.name)}
							</button>
						`;
            })
            .join("");

          return `
					<button
						class="organization-tree__item organization-tree__item--theme ${isSelectedTheme ? "is-active" : ""}"
						type="button"
						data-organization-tree-theme="${escapeHTML(theme.id)}"
					>
						<span>${escapeHTML(theme.name)}</span>

						<span
							class="organization-tree__toggle"
							data-organization-tree-toggle-theme="${escapeHTML(theme.id)}"
							aria-hidden="true"
						>
							${themeSubtopics.length > 0 ? (isThemeCollapsed ? "▸" : "▾") : "•"}
						</span>
					</button>

					${
            shouldShowSubtopics
              ? `
								<div class="organization-tree__children organization-tree__children--subtopics">
									${subtopicsHTML}
								</div>
							`
              : ""
          }
				`;
        })
        .join("");

      group.innerHTML = `
			<button
				class="organization-tree__item organization-tree__item--subject ${isSelectedSubject ? "is-active" : ""}"
				type="button"
				data-organization-tree-subject="${escapeHTML(subject.id)}"
			>
				<span>${escapeHTML(subject.name)}</span>

				<span
					class="organization-tree__toggle"
					data-organization-tree-toggle-subject="${escapeHTML(subject.id)}"
					aria-hidden="true"
				>
					${subjectThemes.length > 0 ? (isSubjectCollapsed ? "▸" : "▾") : "•"}
				</span>
			</button>

			${
        shouldShowThemes
          ? `
						<div class="organization-tree__children">
							${themesHTML}
						</div>
					`
          : ""
      }
		`;

      organizationTree.appendChild(group);
    });
  }

  function renderSubjectGallery() {
    const allSubjects = getSubjects();
    const filteredSubjects = getFilteredSubjects();

    subjectGallery.innerHTML = "";

    const hasSubjects = allSubjects.length > 0;
    const hasFilteredSubjects = filteredSubjects.length > 0;

    subjectGallery.hidden = !hasSubjects || !hasFilteredSubjects;
    emptySubjectsState.hidden = hasSubjects;
    noSubjectResultsState.hidden = !hasSubjects || hasFilteredSubjects;

    if (!hasSubjects || !hasFilteredSubjects) {
      return;
    }

    filteredSubjects.forEach((subject) => {
      const themesCount = getThemesBySubjectId(subject.id).length;
      const questionsCount = getQuestionsBySubjectId(subject.id).length;

      const subjectCard = document.createElement("article");

      subjectCard.classList.add("organization-card", "organization-card--clickable");

      if (subject.id === selectedSubjectId) {
        subjectCard.classList.add("is-active");
      }

      subjectCard.setAttribute("role", "button");
      subjectCard.setAttribute("tabindex", "0");
      subjectCard.setAttribute("aria-label", `Abrir matéria ${subject.name}`);
      subjectCard.dataset.organizationSubjectId = subject.id;

      const nameSizeClass = getCardNameSizeClass(subject.name);

      subjectCard.innerHTML = `
				<div class="organization-card__name ${nameSizeClass}" title="${escapeHTML(subject.name)}">
					<span class="organization-card__name-text">
						${escapeHTML(subject.name)}
					</span>
				</div>

				<div class="organization-card__meta">
					<span><strong>${themesCount}</strong> ${themesCount === 1 ? "tema" : "temas"}</span>
					<span><strong>${questionsCount}</strong> ${questionsCount === 1 ? "questão" : "questões"}</span>
				</div>
			`;

      subjectGallery.appendChild(subjectCard);
    });
  }

  function renderSubjectFeatureCard() {
    if (subjectCardMode === "create") {
      subjectFeatureCard.className = "organization-feature-card organization-feature-card--form";

      subjectFeatureCard.innerHTML = `
		<div class="organization-feature-card__field">
			<label for="organization-new-subject-name">Nome da matéria</label>

			<input
				id="organization-new-subject-name"
				type="text"
				placeholder="Ex: Matemática"
				data-organization-subject-name-input
			/>
		</div>

		<div class="organization-inline-actions">
			<button
				class="organization-confirm-button"
				type="button"
				data-organization-action="confirm-create-subject"
				aria-label="Confirmar matéria"
				title="Confirmar"
			>
				✅
			</button>

			<button
				class="organization-cancel-button"
				type="button"
				data-organization-action="cancel-create-subject"
				aria-label="Cancelar criação de matéria"
				title="Cancelar"
			>
				❌
			</button>
		</div>
	`;

      requestAnimationFrame(() => {
        subjectFeatureCard.querySelector("[data-organization-subject-name-input]")?.focus();
      });

      return;
    }

    if (subjectCardMode === "edit") {
      const subject = getSubjectById(selectedSubjectId);

      if (!subject) {
        subjectCardMode = "view";
        renderOrganization();
        return;
      }

      subjectFeatureCard.className = "organization-feature-card organization-feature-card--form";

      subjectFeatureCard.innerHTML = `
		<div class="organization-feature-card__field">
			<label for="organization-edit-subject-name">Nome da matéria</label>

			<input
				id="organization-edit-subject-name"
				type="text"
				value="${escapeHTML(subject.name)}"
				data-organization-subject-edit-input
			/>
		</div>

		<div class="organization-inline-actions">
			<button
				class="organization-confirm-button"
				type="button"
				data-organization-action="confirm-edit-subject"
				aria-label="Confirmar edição da matéria"
				title="Confirmar"
			>
				✅
			</button>

			<button
				class="organization-cancel-button"
				type="button"
				data-organization-action="cancel-edit-subject"
				aria-label="Cancelar edição da matéria"
				title="Cancelar"
			>
				❌
			</button>
		</div>
	`;

      requestAnimationFrame(() => {
        const input = subjectFeatureCard.querySelector("[data-organization-subject-edit-input]");

        input?.focus();
        input?.select();
      });

      return;
    }

    const subject = getSubjectById(selectedSubjectId);

    if (!subject) {
      subjectFeatureCard.className = "organization-feature-card organization-feature-card--empty";

      subjectFeatureCard.innerHTML = `
				<p>Primeiro selecione uma matéria para editá-la ou acessar suas ações.</p>
			`;

      return;
    }

    const themesCount = getThemesBySubjectId(subject.id).length;
    const questionsCount = getQuestionsBySubjectId(subject.id).length;
    const errorsCount = getPendingErrorsBySubjectId(subject.id).length;

    subjectFeatureCard.className = "organization-feature-card organization-feature-card--active";

    subjectFeatureCard.innerHTML = `
			<div class="organization-feature-card__topline">
				<div class="organization-feature-card__name-wrap">
					<div class="organization-feature-card__name" title="${escapeHTML(subject.name)}">
						${escapeHTML(subject.name)}
					</div>

					<button
						class="organization-edit-button"
						type="button"
						data-organization-action="edit-subject"
						aria-label="Editar nome da matéria"
						title="Editar"
					>
						✏️
					</button>
				</div>
			</div>

			<div class="organization-feature-card__statsline">
				<div class="organization-feature-card__stats">
					<span><strong>${themesCount}</strong> ${themesCount === 1 ? "Tema" : "Temas"}</span>
					<span><strong>${questionsCount}</strong> ${questionsCount === 1 ? "Questão" : "Questões"}</span>
					<span><strong>${errorsCount}</strong> ${errorsCount === 1 ? "Erro" : "Erros"}</span>
				</div>
			</div>

			<div class="organization-feature-card__actionline">
				<button
					class="organization-icon-button organization-feature-card__delete"
					type="button"
					data-organization-action="delete-subject"
					aria-label="Excluir matéria"
					title="Excluir"
				>
					🗑️
				</button>

				<div class="organization-feature-card__actions">
					<button
						type="button"
						data-organization-action="resolve-subject"
						${questionsCount === 0 ? 'disabled title="Cadastre uma questão para resolver."' : ""}
					>
						Resolver
					</button>

					<button
						type="button"
						data-organization-action="create-question"
					>
						+ Questão
					</button>

					<button
						type="button"
						data-organization-action="review-subject"
						${errorsCount === 0 ? 'disabled title="Nenhum erro pendente para revisar."' : ""}
					>
						Revisar
					</button>

					<button
						type="button"
						data-organization-action="create-note"
					>
						Anotar
					</button>
				</div>
			</div>
		`;
  }

  function renderThemeGallery() {
    const subject = getSubjectById(selectedSubjectId);
    const allThemes = subject ? getThemesBySubjectId(subject.id) : [];
    const filteredThemes = getFilteredThemesFromSelectedSubject();

    themeGallery.innerHTML = "";

    const hasThemes = allThemes.length > 0;
    const hasFilteredThemes = filteredThemes.length > 0;

    themeGallery.hidden = !hasThemes || !hasFilteredThemes;
    emptyThemesState.hidden = hasThemes;
    noThemeResultsState.hidden = !hasThemes || hasFilteredThemes;

    if (!hasThemes || !hasFilteredThemes) {
      return;
    }

    filteredThemes.forEach((theme) => {
      const subtopicsCount = getSubtopicsByThemeId(theme.id).length;
      const questionsCount = getQuestionsByThemeId(theme.id).length;

      const themeCard = document.createElement("article");

      themeCard.classList.add("organization-card", "organization-card--topic", "organization-card--clickable");

      if (theme.id === selectedThemeId) {
        themeCard.classList.add("is-active");
      }

      themeCard.setAttribute("role", "button");
      themeCard.setAttribute("tabindex", "0");
      themeCard.setAttribute("aria-label", `Selecionar tema ${theme.name}`);
      themeCard.dataset.organizationThemeId = theme.id;

      const nameSizeClass = getCardNameSizeClass(theme.name);

      themeCard.innerHTML = `
				<div class="organization-card__name ${nameSizeClass}" title="${escapeHTML(theme.name)}">
					<span class="organization-card__name-text">
						${escapeHTML(theme.name)}
					</span>
				</div>

				<div class="organization-card__meta">
					<span><strong>${subtopicsCount}</strong> ${subtopicsCount === 1 ? "assunto" : "assuntos"}</span>
					<span><strong>${questionsCount}</strong> ${questionsCount === 1 ? "questão" : "questões"}</span>
				</div>
			`;

      themeGallery.appendChild(themeCard);
    });
  }

  function renderThemeFeatureCard() {
    if (themeCardMode === "create") {
      themeFeatureCard.className = "organization-feature-card organization-feature-card--form";

      themeFeatureCard.innerHTML = `
		<div class="organization-feature-card__field">
			<label for="organization-new-theme-name">Nome do tema</label>

			<input
				id="organization-new-theme-name"
				type="text"
				placeholder="Ex: Probabilidade"
				data-organization-theme-name-input
			/>
		</div>

		<div class="organization-inline-actions">
			<button
				class="organization-confirm-button"
				type="button"
				data-organization-theme-action="confirm-create-theme"
				aria-label="Confirmar tema"
				title="Confirmar"
			>
				✅
			</button>

			<button
				class="organization-cancel-button"
				type="button"
				data-organization-theme-action="cancel-create-theme"
				aria-label="Cancelar criação de tema"
				title="Cancelar"
			>
				❌
			</button>
		</div>
	`;

      requestAnimationFrame(() => {
        themeFeatureCard.querySelector("[data-organization-theme-name-input]")?.focus();
      });

      return;
    }

    if (themeCardMode === "edit") {
      const theme = getThemeById(selectedThemeId);

      if (!theme) {
        themeCardMode = "view";
        renderSubjectModal();
        return;
      }

      themeFeatureCard.className = "organization-feature-card organization-feature-card--form";

      themeFeatureCard.innerHTML = `
		<div class="organization-feature-card__field">
			<label for="organization-edit-theme-name">Nome do tema</label>

			<input
				id="organization-edit-theme-name"
				type="text"
				value="${escapeHTML(theme.name)}"
				data-organization-theme-edit-input
			/>
		</div>

		<div class="organization-inline-actions">
			<button
				class="organization-confirm-button"
				type="button"
				data-organization-theme-action="confirm-edit-theme"
				aria-label="Confirmar edição do tema"
				title="Confirmar"
			>
				✅
			</button>

			<button
				class="organization-cancel-button"
				type="button"
				data-organization-theme-action="cancel-edit-theme"
				aria-label="Cancelar edição do tema"
				title="Cancelar"
			>
				❌
			</button>
		</div>
	`;

      requestAnimationFrame(() => {
        const input = themeFeatureCard.querySelector("[data-organization-theme-edit-input]");

        input?.focus();
        input?.select();
      });

      return;
    }

    const theme = getThemeById(selectedThemeId);

    if (!theme) {
      themeFeatureCard.className = "organization-feature-card organization-feature-card--empty";

      themeFeatureCard.innerHTML = `
				<p>Primeiro selecione um tema para editá-lo ou acessar suas ações.</p>
			`;

      return;
    }

    const subtopicsCount = getSubtopicsByThemeId(theme.id).length;
    const questionsCount = getQuestionsByThemeId(theme.id).length;
    const errorsCount = getPendingErrorsByThemeId(theme.id).length;

    themeFeatureCard.className = "organization-feature-card organization-feature-card--active";

    themeFeatureCard.innerHTML = `
			<div class="organization-feature-card__topline">
				<div class="organization-feature-card__name-wrap">
					<div class="organization-feature-card__name" title="${escapeHTML(theme.name)}">
						${escapeHTML(theme.name)}
					</div>

					<button
						class="organization-edit-button"
						type="button"
						data-organization-theme-action="edit-theme"
						aria-label="Editar nome do tema"
						title="Editar"
					>
						✏️
					</button>
				</div>
			</div>

			<div class="organization-feature-card__statsline">
				<div class="organization-feature-card__stats">
					<span><strong>${subtopicsCount}</strong> ${subtopicsCount === 1 ? "Assunto" : "Assuntos"}</span>
					<span><strong>${questionsCount}</strong> ${questionsCount === 1 ? "Questão" : "Questões"}</span>
					<span><strong>${errorsCount}</strong> ${errorsCount === 1 ? "Erro" : "Erros"}</span>
				</div>
			</div>

			<div class="organization-feature-card__actionline">
				<button
					class="organization-icon-button organization-feature-card__delete"
					type="button"
					data-organization-theme-action="delete-theme"
					aria-label="Excluir tema"
					title="Excluir"
				>
					🗑️
				</button>

				<div class="organization-feature-card__actions">
					<button
						type="button"
						data-organization-theme-action="resolve-theme"
						${questionsCount === 0 ? 'disabled title="Cadastre uma questão para resolver."' : ""}
					>
						Resolver
					</button>

					<button
						type="button"
						data-organization-theme-action="create-question"
					>
						+ Questão
					</button>

					<button
						type="button"
						data-organization-theme-action="review-theme"
						${errorsCount === 0 ? 'disabled title="Nenhum erro pendente para revisar."' : ""}
					>
						Revisar
					</button>

					<button
						type="button"
						data-organization-theme-action="create-note"
					>
						Anotar
					</button>
				</div>
			</div>
		`;
  }

  function renderSubtopicPanel() {
    const theme = getThemeById(selectedThemeId);

    if (!theme) {
      topicPanelTitle.textContent = "Tema";
      subtopicAddCard.hidden = true;
      selectThemeState.hidden = false;
      subtopicList.hidden = true;
      emptySubtopicsState.hidden = true;
      noSubtopicResultsState.hidden = true;
      return;
    }

    topicPanelTitle.textContent = theme.name;
    subtopicAddCard.hidden = false;
    selectThemeState.hidden = true;

    const allSubtopics = getSubtopicsByThemeId(theme.id);
    const filteredSubtopics = getFilteredSubtopicsFromSelectedTheme();

    subtopicList.innerHTML = "";

    if (isSubtopicFormOpen) {
      const formCard = document.createElement("article");

      formCard.classList.add("organization-subtopic-card", "organization-subtopic-card--form");

      formCard.innerHTML = `
		<input
			class="organization-subtopic-card__input"
			type="text"
			placeholder="Nome do assunto"
			data-organization-subtopic-name-input
			aria-label="Nome do assunto"
		/>

		<div class="organization-inline-actions organization-inline-actions--compact">
			<button
				class="organization-confirm-button"
				type="button"
				data-organization-subtopic-action="confirm-create-subtopic"
				aria-label="Confirmar assunto"
				title="Confirmar"
			>
				✅
			</button>

			<button
				class="organization-cancel-button"
				type="button"
				data-organization-subtopic-action="cancel-create-subtopic"
				aria-label="Cancelar criação de assunto"
				title="Cancelar"
			>
				❌
			</button>
		</div>
	`;

      subtopicList.appendChild(formCard);

      requestAnimationFrame(() => {
        formCard.querySelector("[data-organization-subtopic-name-input]")?.focus();
      });
    }

    const hasSubtopics = allSubtopics.length > 0;
    const hasFilteredSubtopics = filteredSubtopics.length > 0;

    const shouldShowSubtopicList = isSubtopicFormOpen || (hasSubtopics && hasFilteredSubtopics);

    subtopicList.hidden = !shouldShowSubtopicList;
    emptySubtopicsState.hidden = hasSubtopics || isSubtopicFormOpen;
    noSubtopicResultsState.hidden = !hasSubtopics || hasFilteredSubtopics || isSubtopicFormOpen;

    if (!hasSubtopics || !hasFilteredSubtopics) {
      return;
    }

    filteredSubtopics.forEach((subtopic) => {
      const questionsCount = getQuestionsBySubtopicId(subtopic.id).length;
      const errorsCount = getPendingErrorsBySubtopicId(subtopic.id).length;
      const isExpanded = selectedSubtopicId === subtopic.id;
      const isEditingSubtopic = editingSubtopicId === subtopic.id;

      const subtopicCard = document.createElement("article");

      subtopicCard.classList.add("organization-subtopic-card", "organization-subtopic-card--clickable");

      if (isExpanded) {
        subtopicCard.classList.add("is-expanded", "is-active");
      }

      subtopicCard.dataset.organizationSubtopicId = subtopic.id;

      if (isEditingSubtopic) {
        subtopicCard.classList.add("is-expanded", "is-active");

        subtopicCard.innerHTML = `
		<input
			class="organization-subtopic-card__input"
			type="text"
			value="${escapeHTML(subtopic.name)}"
			data-organization-subtopic-edit-input
			aria-label="Nome do assunto"
		/>

		<div class="organization-inline-actions organization-inline-actions--compact">
			<button
				class="organization-confirm-button"
				type="button"
				data-organization-subtopic-action="confirm-edit-subtopic"
				data-subtopic-id="${escapeHTML(subtopic.id)}"
				aria-label="Confirmar edição do assunto"
				title="Confirmar"
			>
				✅
			</button>

			<button
				class="organization-cancel-button"
				type="button"
				data-organization-subtopic-action="cancel-edit-subtopic"
				data-subtopic-id="${escapeHTML(subtopic.id)}"
				aria-label="Cancelar edição do assunto"
				title="Cancelar"
			>
				❌
			</button>
		</div>
	`;

        subtopicList.appendChild(subtopicCard);

        requestAnimationFrame(() => {
          const input = subtopicCard.querySelector("[data-organization-subtopic-edit-input]");

          input?.focus();
          input?.select();
        });

        return;
      }

      subtopicCard.innerHTML = `
				<div class="organization-subtopic-card__top">
					<strong title="${escapeHTML(subtopic.name)}">
						${escapeHTML(subtopic.name)}
					</strong>

					<div class="organization-subtopic-card__icons">
						${
              isExpanded
                ? `
									<button
										type="button"
										data-organization-subtopic-action="edit-subtopic"
										data-subtopic-id="${escapeHTML(subtopic.id)}"
										aria-label="Editar assunto"
										title="Editar"
									>
										✏️
									</button>
								`
                : ""
            }

						<button
							type="button"
							data-organization-subtopic-action="delete-subtopic"
							data-subtopic-id="${escapeHTML(subtopic.id)}"
							aria-label="Excluir assunto"
							title="Excluir"
						>
							🗑️
						</button>
					</div>
				</div>

				${
          isExpanded
            ? `
							<div class="organization-subtopic-card__stats">
								<span><strong>${questionsCount}</strong> ${questionsCount === 1 ? "Questão" : "Questões"}</span>
								<span><strong>0</strong> Anotações</span>
								<span><strong>${errorsCount}</strong> ${errorsCount === 1 ? "Erro" : "Erros"}</span>
							</div>

							<div class="organization-subtopic-card__actions">
								<button type="button" data-organization-subtopic-action="create-question" data-subtopic-id="${escapeHTML(subtopic.id)}">
									+ Questão
								</button>

								<button type="button" data-organization-subtopic-action="create-note" data-subtopic-id="${escapeHTML(subtopic.id)}">
									Anotar
								</button>

								<button
									type="button"
									data-organization-subtopic-action="review-subtopic"
									data-subtopic-id="${escapeHTML(subtopic.id)}"
									${errorsCount === 0 ? 'disabled title="Nenhum erro pendente para revisar."' : ""}
								>
									Revisar
								</button>

								<button
									type="button"
									data-organization-subtopic-action="resolve-subtopic"
									data-subtopic-id="${escapeHTML(subtopic.id)}"
									${questionsCount === 0 ? 'disabled title="Cadastre uma questão para resolver."' : ""}
								>
									Resolver
								</button>
							</div>
						`
            : ""
        }
			`;

      subtopicList.appendChild(subtopicCard);
    });
  }

  function renderSubjectModal() {
    if (!isSubjectModalOpen) {
      return;
    }

    const subject = getSubjectById(selectedSubjectId);

    if (!subject) {
      closeSubjectModal();
      return;
    }

    ensureSelectedThemeBelongsToSubject();
    ensureSelectedSubtopicBelongsToTheme();

    subjectModalTitle.textContent = subject.name;

    renderThemeGallery();
    renderThemeFeatureCard();
    renderSubtopicPanel();
  }

  function renderOrganization() {
    ensureSelectedSubject();
    ensureSelectedThemeBelongsToSubject();
    ensureSelectedSubtopicBelongsToTheme();

    renderOrganizationTree();
    renderSubjectGallery();
    renderSubjectFeatureCard();
    renderSubjectModal();
  }

  function syncBodyScrollLock() {
    document.body.style.overflow = isSubjectModalOpen || isDeleteModalOpen ? "hidden" : "";
  }

  function openSubjectModal(subjectId) {
    selectSubject(subjectId);

    isSubjectModalOpen = true;
    subjectModalLayer.hidden = false;
    syncBodyScrollLock();

    themeSearchText = "";
    subtopicSearchText = "";
    themeSearchInput.value = "";
    subtopicSearchInput.value = "";

    renderSubjectModal();
    subjectModalCloseButton.focus();
  }

  function openSubjectModalWithTheme(themeId) {
    selectTheme(themeId);

    isSubjectModalOpen = true;
    subjectModalLayer.hidden = false;
    syncBodyScrollLock();

    subtopicSearchText = "";
    subtopicSearchInput.value = "";

    renderSubjectModal();
    subjectModalCloseButton.focus();
  }

  function openSubjectModalWithSubtopic(subtopicId) {
    selectSubtopic(subtopicId);

    isSubjectModalOpen = true;
    subjectModalLayer.hidden = false;
    syncBodyScrollLock();

    renderSubjectModal();
    subjectModalCloseButton.focus();
  }

  function closeSubjectModal() {
    isSubjectModalOpen = false;
    themeCardMode = "view";
    isSubtopicFormOpen = false;
    editingSubtopicId = null;

    subjectModalLayer.hidden = true;
    syncBodyScrollLock();
  }

  function openQuestionCreationFromSubject(subject) {
    const subjectThemes = getThemesBySubjectId(subject.id);

    if (subjectThemes.length === 0) {
      document.dispatchEvent(
        new CustomEvent("themes:prepare-create", {
          detail: {
            subjectId: subject.id,
          },
        }),
      );

      document.dispatchEvent(
        new CustomEvent("app:navigate", {
          detail: {
            sectionId: "themes",
          },
        }),
      );

      return;
    }

    if (subjectThemes.length === 1) {
      document.dispatchEvent(
        new CustomEvent("questions:prepare-create", {
          detail: {
            subjectId: subject.id,
            themeId: subjectThemes[0].id,
          },
        }),
      );
    }

    document.dispatchEvent(
      new CustomEvent("app:navigate", {
        detail: {
          sectionId: "questions",
        },
      }),
    );
  }

  function openQuestionCreationFromTheme(theme) {
    document.dispatchEvent(
      new CustomEvent("questions:prepare-create", {
        detail: {
          subjectId: theme.subjectId,
          themeId: theme.id,
        },
      }),
    );

    document.dispatchEvent(
      new CustomEvent("app:navigate", {
        detail: {
          sectionId: "questions",
        },
      }),
    );
  }

  function openQuestionCreationFromSubtopic(subtopic) {
    document.dispatchEvent(
      new CustomEvent("questions:prepare-create", {
        detail: {
          subjectId: subtopic.subjectId,
          themeId: subtopic.themeId,
          subtopicId: subtopic.id,
        },
      }),
    );

    document.dispatchEvent(
      new CustomEvent("app:navigate", {
        detail: {
          sectionId: "questions",
        },
      }),
    );
  }

  function openNoteCreationFromSubject(subject) {
    document.dispatchEvent(
      new CustomEvent("notes:prepare-create", {
        detail: {
          subjectId: subject.id,
        },
      }),
    );

    document.dispatchEvent(
      new CustomEvent("app:navigate", {
        detail: {
          sectionId: "notes",
        },
      }),
    );
  }

  function openNoteCreationFromTheme(theme) {
    document.dispatchEvent(
      new CustomEvent("notes:prepare-create", {
        detail: {
          subjectId: theme.subjectId,
          themeId: theme.id,
        },
      }),
    );

    document.dispatchEvent(
      new CustomEvent("app:navigate", {
        detail: {
          sectionId: "notes",
        },
      }),
    );
  }

  function openNoteCreationFromSubtopic(subtopic) {
    const theme = getThemeById(subtopic.themeId);

    document.dispatchEvent(
      new CustomEvent("notes:prepare-create", {
        detail: {
          subjectId: subtopic.subjectId,
          themeId: subtopic.themeId,
        },
      }),
    );

    document.dispatchEvent(
      new CustomEvent("app:navigate", {
        detail: {
          sectionId: "notes",
        },
      }),
    );

    console.log("Anotação aberta a partir do assunto:", {
      subtopic: subtopic.name,
      theme: theme?.name || "",
    });
  }

  function openSubjectCreateForm() {
    subjectCardMode = "create";
    selectedSubjectId = null;
    selectedThemeId = null;
    selectedSubtopicId = null;

    renderOrganization();
  }

  function cancelSubjectCreateForm() {
    subjectCardMode = "view";
    ensureSelectedSubject();

    renderOrganization();
  }

  function confirmSubjectCreateForm() {
    const input = subjectFeatureCard.querySelector("[data-organization-subject-name-input]");

    if (!input) {
      return;
    }

    input.setCustomValidity("");

    const subjectName = input.value.trim();

    if (!subjectName) {
      input.setCustomValidity("Informe o nome da matéria.");
      input.reportValidity();
      input.focus();
      return;
    }

    const duplicatedSubject = findDuplicatedSubject(subjectName);

    if (duplicatedSubject) {
      input.setCustomValidity(`A matéria "${duplicatedSubject.name}" já está cadastrada.`);
      input.reportValidity();
      input.focus();
      return;
    }

    const subjects = getSubjects();
    const newSubject = createSubject(subjectName);

    saveSubjects([...subjects, newSubject]);

    selectedSubjectId = newSubject.id;
    selectedThemeId = null;
    selectedSubtopicId = null;
    subjectCardMode = "view";

    notifySubjectsChanged();
    renderOrganization();
  }

  function openThemeCreateForm() {
    if (!selectedSubjectId) {
      return;
    }

    themeCardMode = "create";
    selectedThemeId = null;
    selectedSubtopicId = null;
    isSubtopicFormOpen = false;

    renderSubjectModal();
  }

  function cancelThemeCreateForm() {
    themeCardMode = "view";
    renderSubjectModal();
  }

  function confirmThemeCreateForm() {
    const input = themeFeatureCard.querySelector("[data-organization-theme-name-input]");

    if (!input || !selectedSubjectId) {
      return;
    }

    input.setCustomValidity("");

    const themeName = input.value.trim();

    if (!themeName) {
      input.setCustomValidity("Informe o nome do tema.");
      input.reportValidity();
      input.focus();
      return;
    }

    const duplicatedTheme = findDuplicatedTheme({
      subjectId: selectedSubjectId,
      name: themeName,
    });

    if (duplicatedTheme) {
      input.setCustomValidity(`O tema "${duplicatedTheme.name}" já está cadastrado nesta matéria.`);
      input.reportValidity();
      input.focus();
      return;
    }

    const themes = getThemes();

    const newTheme = createTheme({
      subjectId: selectedSubjectId,
      name: themeName,
    });

    saveThemes([...themes, newTheme]);

    selectedThemeId = newTheme.id;
    selectedSubtopicId = null;
    themeCardMode = "view";
    isSubtopicFormOpen = false;

    notifyThemesChanged();
    renderOrganization();
  }

  function openSubtopicCreateForm() {
    if (!selectedSubjectId || !selectedThemeId) {
      return;
    }

    isSubtopicFormOpen = true;
    selectedSubtopicId = null;
    editingSubtopicId = null;

    renderSubtopicPanel();
  }

  function cancelSubtopicCreateForm() {
    isSubtopicFormOpen = false;
    editingSubtopicId = null;
    renderSubtopicPanel();
  }

  function confirmSubtopicCreateForm() {
    const input = subtopicList.querySelector("[data-organization-subtopic-name-input]");

    if (!input || !selectedSubjectId || !selectedThemeId) {
      return;
    }

    input.setCustomValidity("");

    const subtopicName = input.value.trim();

    if (!subtopicName) {
      input.setCustomValidity("Informe o nome do assunto.");
      input.reportValidity();
      input.focus();
      return;
    }

    const result = addSubtopic({
      subjectId: selectedSubjectId,
      themeId: selectedThemeId,
      name: subtopicName,
    });

    if (!result.ok) {
      input.setCustomValidity(result.message);
      input.reportValidity();
      input.focus();
      return;
    }

    selectedSubtopicId = result.subtopic.id;
    isSubtopicFormOpen = false;
    editingSubtopicId = null;

    renderOrganization();
  }

  function openSubjectEditForm() {
    if (!selectedSubjectId) {
      return;
    }

    subjectCardMode = "edit";
    renderOrganization();
  }

  function cancelSubjectEditForm() {
    subjectCardMode = "view";
    renderOrganization();
  }

  function confirmSubjectEditForm() {
    const input = subjectFeatureCard.querySelector("[data-organization-subject-edit-input]");
    const subject = getSubjectById(selectedSubjectId);

    if (!input || !subject) {
      return;
    }

    input.setCustomValidity("");

    const newName = input.value.trim();

    if (!newName) {
      input.setCustomValidity("Informe o nome da matéria.");
      input.reportValidity();
      input.focus();
      return;
    }

    const duplicatedSubject = findDuplicatedSubjectIgnoringCurrent({
      subjectId: subject.id,
      name: newName,
    });

    if (duplicatedSubject) {
      input.setCustomValidity(`A matéria "${duplicatedSubject.name}" já está cadastrada.`);
      input.reportValidity();
      input.focus();
      return;
    }

    const updatedSubjects = getSubjects().map((currentSubject) => {
      if (currentSubject.id !== subject.id) {
        return currentSubject;
      }

      return {
        ...currentSubject,
        name: newName,
        updatedAt: new Date().toISOString(),
      };
    });

    saveSubjects(updatedSubjects);

    subjectCardMode = "view";

    notifySubjectsChanged();
    renderOrganization();
  }

  function openThemeEditForm() {
    if (!selectedThemeId) {
      return;
    }

    themeCardMode = "edit";
    isSubtopicFormOpen = false;
    editingSubtopicId = null;

    renderSubjectModal();
  }

  function cancelThemeEditForm() {
    themeCardMode = "view";
    renderSubjectModal();
  }

  function confirmThemeEditForm() {
    const input = themeFeatureCard.querySelector("[data-organization-theme-edit-input]");
    const theme = getThemeById(selectedThemeId);

    if (!input || !theme) {
      return;
    }

    input.setCustomValidity("");

    const newName = input.value.trim();

    if (!newName) {
      input.setCustomValidity("Informe o nome do tema.");
      input.reportValidity();
      input.focus();
      return;
    }

    const duplicatedTheme = findDuplicatedThemeIgnoringCurrent({
      themeId: theme.id,
      subjectId: theme.subjectId,
      name: newName,
    });

    if (duplicatedTheme) {
      input.setCustomValidity(`O tema "${duplicatedTheme.name}" já está cadastrado nesta matéria.`);
      input.reportValidity();
      input.focus();
      return;
    }

    const updatedThemes = getThemes().map((currentTheme) => {
      if (currentTheme.id !== theme.id) {
        return currentTheme;
      }

      return {
        ...currentTheme,
        name: newName,
        updatedAt: new Date().toISOString(),
      };
    });

    saveThemes(updatedThemes);

    themeCardMode = "view";

    notifyThemesChanged();
    renderOrganization();
  }

  function openSubtopicEditForm(subtopic) {
    if (!subtopic) {
      return;
    }

    selectedSubjectId = subtopic.subjectId;
    selectedThemeId = subtopic.themeId;
    selectedSubtopicId = subtopic.id;

    isSubtopicFormOpen = false;
    editingSubtopicId = subtopic.id;

    renderSubtopicPanel();
  }

  function cancelSubtopicEditForm() {
    editingSubtopicId = null;
    renderSubtopicPanel();
  }

  function confirmSubtopicEditForm(subtopic) {
    const input = subtopicList.querySelector("[data-organization-subtopic-edit-input]");

    if (!input || !subtopic) {
      return;
    }

    input.setCustomValidity("");

    const newName = input.value.trim();

    if (!newName) {
      input.setCustomValidity("Informe o nome do assunto.");
      input.reportValidity();
      input.focus();
      return;
    }

    const duplicatedSubtopic = findDuplicatedSubtopicIgnoringCurrent({
      subtopicId: subtopic.id,
      themeId: subtopic.themeId,
      name: newName,
    });

    if (duplicatedSubtopic) {
      input.setCustomValidity(`O assunto "${duplicatedSubtopic.name}" já está cadastrado neste tema.`);
      input.reportValidity();
      input.focus();
      return;
    }

    const updatedSubtopics = getSubtopics().map((currentSubtopic) => {
      if (currentSubtopic.id !== subtopic.id) {
        return currentSubtopic;
      }

      return {
        ...currentSubtopic,
        name: newName,
        updatedAt: new Date().toISOString(),
      };
    });

    saveSubtopics(updatedSubtopics);

    editingSubtopicId = null;
    selectedSubtopicId = subtopic.id;

    notifySubtopicsChanged();
    renderOrganization();
  }

  function getDeleteTarget({ type, id }) {
    if (type === "subject") {
      return getSubjectById(id);
    }

    if (type === "theme") {
      return getThemeById(id);
    }

    if (type === "subtopic") {
      return getSubtopicById(id);
    }

    return null;
  }

  function getDeleteModalData({ type, target }) {
    if (type === "subject") {
      const themesCount = getThemesBySubjectId(target.id).length;
      const subtopicsCount = getSubtopicsBySubjectId(target.id).length;
      const questionsCount = getQuestionsBySubjectId(target.id).length;

      return {
        tag: "Excluir matéria",
        name: target.name,
        description: "Esta ação remove a matéria, seus temas, assuntos, questões e registros relacionados. Use apenas se tiver certeza.",
        stats: [
          { label: themesCount === 1 ? "Tema" : "Temas", value: themesCount },
          { label: subtopicsCount === 1 ? "Assunto" : "Assuntos", value: subtopicsCount },
          { label: questionsCount === 1 ? "Questão" : "Questões", value: questionsCount },
        ],
      };
    }

    if (type === "theme") {
      const subtopicsCount = getSubtopicsByThemeId(target.id).length;
      const questionsCount = getQuestionsByThemeId(target.id).length;
      const errorsCount = getPendingErrorsByThemeId(target.id).length;

      return {
        tag: "Excluir tema",
        name: target.name,
        description: "Esta ação remove o tema, seus assuntos, questões e registros relacionados. A matéria continuará cadastrada.",
        stats: [
          { label: subtopicsCount === 1 ? "Assunto" : "Assuntos", value: subtopicsCount },
          { label: questionsCount === 1 ? "Questão" : "Questões", value: questionsCount },
          { label: errorsCount === 1 ? "Erro" : "Erros", value: errorsCount },
        ],
      };
    }

    const questionsCount = getQuestionsBySubtopicId(target.id).length;
    const errorsCount = getPendingErrorsBySubtopicId(target.id).length;

    return {
      tag: "Excluir assunto",
      name: target.name,
      description: "Esta ação remove apenas o assunto. As questões vinculadas serão mantidas no tema, mas ficarão sem assunto.",
      stats: [
        { label: questionsCount === 1 ? "Questão mantida" : "Questões mantidas", value: questionsCount },
        { label: errorsCount === 1 ? "Erro vinculado" : "Erros vinculados", value: errorsCount },
        { label: "Ação", value: "Desvincular" },
      ],
    };
  }

  function renderDeleteModalStats(stats) {
    deleteModalStats.innerHTML = stats
      .map((item) => {
        return `
				<span>
					<strong>${escapeHTML(item.value)}</strong>
					${escapeHTML(item.label)}
				</span>
			`;
      })
      .join("");
  }

  function openDeleteModal({ type, id }) {
    const target = getDeleteTarget({ type, id });

    if (!target) {
      return;
    }

    const modalData = getDeleteModalData({ type, target });

    pendingDeleteTarget = {
      type,
      id,
    };

    deleteModalTitle.textContent = modalData.tag;
    deleteModalName.textContent = modalData.name;
    deleteModalDescription.textContent = modalData.description;

    renderDeleteModalStats(modalData.stats);

    deleteModalCheckInput.checked = false;
    deleteModalConfirmButton.disabled = true;

    isDeleteModalOpen = true;
    deleteModalLayer.hidden = false;

    syncBodyScrollLock();

    deleteModalCheckInput.focus();
  }

  function closeDeleteModal() {
    isDeleteModalOpen = false;
    pendingDeleteTarget = null;

    deleteModalLayer.hidden = true;
    deleteModalCheckInput.checked = false;
    deleteModalConfirmButton.disabled = true;

    syncBodyScrollLock();
  }

  function updateDeleteConfirmState() {
    deleteModalConfirmButton.disabled = !deleteModalCheckInput.checked;
  }

  function deleteSubjectFromOrganization(subjectId) {
    const updatedSubjects = getSubjects().filter((subject) => {
      return subject.id !== subjectId;
    });

    saveSubjects(updatedSubjects);
    removeThemesQuestionsAndRelatedDataBySubjectIds([subjectId]);

    if (selectedSubjectId === subjectId) {
      selectedSubjectId = null;
      selectedThemeId = null;
      selectedSubtopicId = null;
    }

    subjectCardMode = "view";
    themeCardMode = "view";
    isSubtopicFormOpen = false;

    closeSubjectModal();
    notifyOrganizationRelatedDataChanged();
    renderOrganization();
  }

  function deleteThemeFromOrganization(themeId) {
    const updatedThemes = getThemes().filter((theme) => {
      return theme.id !== themeId;
    });

    saveThemes(updatedThemes);

    removeSubtopicsQuestionsAndRelatedDataByThemeIds([themeId]);
    removeQuestionsAndRelatedDataByThemeIds([themeId]);

    if (selectedThemeId === themeId) {
      selectedThemeId = null;
      selectedSubtopicId = null;
    }

    themeCardMode = "view";
    isSubtopicFormOpen = false;

    notifyOrganizationRelatedDataChanged();
    renderOrganization();
  }

  function deleteSubtopicFromOrganization(subtopicId) {
    unlinkQuestionsFromSubtopic(subtopicId);
    deleteSubtopic(subtopicId);

    if (selectedSubtopicId === subtopicId) {
      selectedSubtopicId = null;
    }

    isSubtopicFormOpen = false;

    notifySubtopicsChanged();
    renderOrganization();
  }

  function confirmDeleteModal() {
    if (!pendingDeleteTarget || deleteModalConfirmButton.disabled) {
      return;
    }

    const { type, id } = pendingDeleteTarget;

    closeDeleteModal();

    if (type === "subject") {
      deleteSubjectFromOrganization(id);
      return;
    }

    if (type === "theme") {
      deleteThemeFromOrganization(id);
      return;
    }

    if (type === "subtopic") {
      deleteSubtopicFromOrganization(id);
    }
  }

  function handleDeleteModalClick(event) {
    if (event.target === deleteModalLayer) {
      closeDeleteModal();
    }
  }

  function handleDeleteModalKeydown(event) {
    if (event.key === "Escape" && isDeleteModalOpen) {
      closeDeleteModal();
    }
  }

  function handleSubjectGalleryClick(event) {
    const subjectCard = event.target.closest("[data-organization-subject-id]");

    if (!subjectCard) {
      return;
    }

    openSubjectModal(subjectCard.dataset.organizationSubjectId);
  }

  function handleSubjectGalleryKeydown(event) {
    if (!["Enter", " "].includes(event.key)) {
      return;
    }

    const subjectCard = event.target.closest("[data-organization-subject-id]");

    if (!subjectCard) {
      return;
    }

    event.preventDefault();
    openSubjectModal(subjectCard.dataset.organizationSubjectId);
  }

  function handleTreeClick(event) {
    const themeToggle = event.target.closest("[data-organization-tree-toggle-theme]");
    const subjectToggle = event.target.closest("[data-organization-tree-toggle-subject]");

    if (themeToggle) {
      event.preventDefault();
      event.stopPropagation();

      toggleCollapsedTheme(themeToggle.dataset.organizationTreeToggleTheme);
      return;
    }

    if (subjectToggle) {
      event.preventDefault();
      event.stopPropagation();

      toggleCollapsedSubject(subjectToggle.dataset.organizationTreeToggleSubject);
      return;
    }

    const subtopicButton = event.target.closest("[data-organization-tree-subtopic]");
    const themeButton = event.target.closest("[data-organization-tree-theme]");
    const subjectButton = event.target.closest("[data-organization-tree-subject]");

    if (subtopicButton) {
      openSubjectModalWithSubtopic(subtopicButton.dataset.organizationTreeSubtopic);
      return;
    }

    if (themeButton) {
      openSubjectModalWithTheme(themeButton.dataset.organizationTreeTheme);
      return;
    }

    if (subjectButton) {
      openSubjectModal(subjectButton.dataset.organizationTreeSubject);
    }
  }

  function handleSubjectSearchInput() {
    subjectSearchText = normalizeText(subjectSearchInput.value);
    renderSubjectGallery();
  }

  function handleSubjectSearchSubmit(event) {
    event.preventDefault();

    subjectSearchText = normalizeText(subjectSearchInput.value);
    renderSubjectGallery();
  }

  function handleThemeSearchInput() {
    themeSearchText = normalizeText(themeSearchInput.value);
    renderThemeGallery();
  }

  function handleThemeSearchSubmit(event) {
    event.preventDefault();

    themeSearchText = normalizeText(themeSearchInput.value);
    renderThemeGallery();
  }

  function handleSubtopicSearchInput() {
    subtopicSearchText = normalizeText(subtopicSearchInput.value);
    renderSubtopicPanel();
  }

  function handleSubtopicSearchSubmit(event) {
    event.preventDefault();

    subtopicSearchText = normalizeText(subtopicSearchInput.value);
    renderSubtopicPanel();
  }

  function handleFeatureCardAction(event) {
    const actionButton = event.target.closest("[data-organization-action]");

    if (!actionButton || actionButton.disabled) {
      return;
    }

    const action = actionButton.dataset.organizationAction;

    if (action === "confirm-create-subject") {
      confirmSubjectCreateForm();
      return;
    }

    if (action === "cancel-create-subject") {
      cancelSubjectCreateForm();
      return;
    }

    if (action === "confirm-edit-subject") {
      confirmSubjectEditForm();
      return;
    }

    if (action === "cancel-edit-subject") {
      cancelSubjectEditForm();
      return;
    }

    const subject = getSubjectById(selectedSubjectId);

    if (!subject) {
      return;
    }

    if (action === "resolve-subject") {
      document.dispatchEvent(new CustomEvent("app:navigate", { detail: { sectionId: "solve" } }));
      return;
    }

    if (action === "review-subject") {
      document.dispatchEvent(new CustomEvent("app:navigate", { detail: { sectionId: "reviews" } }));
      return;
    }

    if (action === "create-question") {
      openQuestionCreationFromSubject(subject);
      return;
    }

    if (action === "create-note") {
      openNoteCreationFromSubject(subject);
      return;
    }

    if (action === "edit-subject") {
      openSubjectEditForm();
      return;
    }

    if (action === "delete-subject") {
      openDeleteModal({
        type: "subject",
        id: subject.id,
      });

      return;
    }
  }

  function handleSubjectModalClick(event) {
    const closeButton = event.target.closest(".organization-modal-close");

    if (closeButton) {
      closeSubjectModal();
      return;
    }

    const themeActionButton = event.target.closest("[data-organization-theme-action]");

    if (themeActionButton && !themeActionButton.disabled) {
      const action = themeActionButton.dataset.organizationThemeAction;

      if (action === "confirm-create-theme") {
        confirmThemeCreateForm();
        return;
      }

      if (action === "cancel-create-theme") {
        cancelThemeCreateForm();
        return;
      }

      if (action === "confirm-edit-theme") {
        confirmThemeEditForm();
        return;
      }

      if (action === "cancel-edit-theme") {
        cancelThemeEditForm();
        return;
      }

      const theme = getThemeById(selectedThemeId);

      if (!theme) {
        return;
      }

      if (action === "create-question") {
        openQuestionCreationFromTheme(theme);
        return;
      }

      if (action === "create-note") {
        openNoteCreationFromTheme(theme);
        return;
      }

      if (action === "resolve-theme") {
        document.dispatchEvent(new CustomEvent("app:navigate", { detail: { sectionId: "solve" } }));
        return;
      }

      if (action === "review-theme") {
        document.dispatchEvent(new CustomEvent("app:navigate", { detail: { sectionId: "reviews" } }));
        return;
      }

      if (action === "edit-theme") {
        openThemeEditForm();
        return;
      }

      if (action === "delete-theme") {
        openDeleteModal({
          type: "theme",
          id: theme.id,
        });

        return;
      }
    }

    const subtopicActionButton = event.target.closest("[data-organization-subtopic-action]");

    if (subtopicActionButton && !subtopicActionButton.disabled) {
      const action = subtopicActionButton.dataset.organizationSubtopicAction;

      if (action === "confirm-create-subtopic") {
        confirmSubtopicCreateForm();
        return;
      }

      if (action === "cancel-create-subtopic") {
        cancelSubtopicCreateForm();
        return;
      }

      const subtopicId = subtopicActionButton.dataset.subtopicId;
      const subtopic = getSubtopicById(subtopicId);

      if (action === "confirm-edit-subtopic") {
        confirmSubtopicEditForm(subtopic);
        return;
      }

      if (action === "cancel-edit-subtopic") {
        cancelSubtopicEditForm();
        return;
      }

      if (!subtopic) {
        return;
      }

      if (action === "create-question") {
        openQuestionCreationFromSubtopic(subtopic);
        return;
      }

      if (action === "create-note") {
        openNoteCreationFromSubtopic(subtopic);
        return;
      }

      if (action === "resolve-subtopic") {
        document.dispatchEvent(
          new CustomEvent("solve:prepare-subtopic", {
            detail: {
              subtopicId: subtopic.id,
            },
          }),
        );

        document.dispatchEvent(new CustomEvent("app:navigate", { detail: { sectionId: "solve" } }));
        return;
      }

      if (action === "review-subtopic") {
        document.dispatchEvent(new CustomEvent("app:navigate", { detail: { sectionId: "reviews" } }));
        return;
      }

      if (action === "edit-subtopic") {
        openSubtopicEditForm(subtopic);
        return;
      }

      if (action === "delete-subtopic") {
        openDeleteModal({
          type: "subtopic",
          id: subtopic.id,
        });

        return;
      }
    }

    const themeCard = event.target.closest("[data-organization-theme-id]");

    if (themeCard) {
      selectTheme(themeCard.dataset.organizationThemeId);
      return;
    }

    const subtopicCard = event.target.closest("[data-organization-subtopic-id]");

    if (subtopicCard) {
      selectSubtopic(subtopicCard.dataset.organizationSubtopicId);
    }
  }

  function handleSubjectModalOverlayClick(event) {
    if (event.target === subjectModalLayer) {
      closeSubjectModal();
    }
  }

  function handleSubjectModalKeydown(event) {
    if (isDeleteModalOpen) {
      return;
    }

    if (event.key === "Escape" && !subjectModalLayer.hidden) {
      closeSubjectModal();
    }
  }

  function handleDataReset() {
    selectedSubjectId = null;
    selectedThemeId = null;
    selectedSubtopicId = null;

    subjectSearchText = "";
    themeSearchText = "";
    subtopicSearchText = "";

    subjectCardMode = "view";
    themeCardMode = "view";
    isSubtopicFormOpen = false;
    editingSubtopicId = null;

    pendingDeleteTarget = null;
    isDeleteModalOpen = false;

    subjectSearchInput.value = "";
    themeSearchInput.value = "";
    subtopicSearchInput.value = "";

    closeDeleteModal();
    closeSubjectModal();
    renderOrganization();
  }

  subjectSearchForm.addEventListener("submit", handleSubjectSearchSubmit);
  subjectSearchInput.addEventListener("input", handleSubjectSearchInput);

  themeSearchForm.addEventListener("submit", handleThemeSearchSubmit);
  themeSearchInput.addEventListener("input", handleThemeSearchInput);

  subtopicSearchForm.addEventListener("submit", handleSubtopicSearchSubmit);
  subtopicSearchInput.addEventListener("input", handleSubtopicSearchInput);

  subjectGallery.addEventListener("click", handleSubjectGalleryClick);
  subjectGallery.addEventListener("keydown", handleSubjectGalleryKeydown);

  subjectAddCard.addEventListener("click", openSubjectCreateForm);
  themeAddCard.addEventListener("click", openThemeCreateForm);
  subtopicAddCard.addEventListener("click", openSubtopicCreateForm);

  organizationTree.addEventListener("click", handleTreeClick);
  subjectFeatureCard.addEventListener("click", handleFeatureCardAction);

  subjectModalLayer.addEventListener("click", handleSubjectModalClick);
  subjectModalLayer.addEventListener("click", handleSubjectModalOverlayClick);
  document.addEventListener("keydown", handleSubjectModalKeydown);

  deleteModalLayer.addEventListener("click", handleDeleteModalClick);
  deleteModalCloseButton.addEventListener("click", closeDeleteModal);
  deleteModalCancelButton.addEventListener("click", closeDeleteModal);
  deleteModalCheckInput.addEventListener("change", updateDeleteConfirmState);
  deleteModalConfirmButton.addEventListener("click", confirmDeleteModal);
  document.addEventListener("keydown", handleDeleteModalKeydown);

  document.addEventListener("subjects:changed", renderOrganization);
  document.addEventListener("themes:changed", renderOrganization);
  document.addEventListener("subtopics:changed", renderOrganization);
  document.addEventListener("questions:changed", renderOrganization);
  document.addEventListener("attempts:changed", renderOrganization);
  document.addEventListener("errorReviews:changed", renderOrganization);
  document.addEventListener("app:data-reset", handleDataReset);

  renderOrganization();

  console.log("Organização v1.2 carregada.");
}

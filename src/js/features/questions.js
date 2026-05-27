import { getCollection, saveCollection } from "../core/storage.js";
import { openConfirmModal } from "../ui/confirmModal.js";

const SUBJECTS_COLLECTION = "subjects";
const THEMES_COLLECTION = "themes";
const QUESTIONS_COLLECTION = "questions";

export function initQuestions() {
  const questionForm = document.querySelector("#question-form");
  const questionSubjectSelect = document.querySelector("#question-subject");
  const questionThemeSelect = document.querySelector("#question-theme");
  const questionStatementInput = document.querySelector("#question-statement");
  const alternativeAInput = document.querySelector("#alternative-a");
  const alternativeBInput = document.querySelector("#alternative-b");
  const alternativeCInput = document.querySelector("#alternative-c");
  const alternativeDInput = document.querySelector("#alternative-d");
  const alternativeEInput = document.querySelector("#alternative-e");
  const correctAlternativeSelect = document.querySelector(
    "#correct-alternative",
  );
  const questionExplanationInput = document.querySelector(
    "#question-explanation",
  );
  const clearQuestionFormButton = document.querySelector(
    "#clear-question-form",
  );
  const questionFormMessage = document.querySelector("#question-form-message");
  const questionNoSubjectWarning = document.querySelector(
    "#question-no-subject-warning",
  );
  const questionNoThemeWarning = document.querySelector(
    "#question-no-theme-warning",
  );
  const questionsCurrentTheme = document.querySelector(
    "#questions-current-theme",
  );
  const questionsCount = document.querySelector("#questions-count");
  const questionsEmptyState = document.querySelector("#questions-empty-state");
  const questionsList = document.querySelector("#questions-list");

  const questionTabButtons = document.querySelectorAll("[data-question-tab]");
  const questionListTab = document.querySelector("#question-list-tab");
  const questionFormTab = document.querySelector("#question-form-tab");
  const questionFilters = document.querySelector("#question-filters");
  const questionTabPanel = document.querySelector("#question-tab-panel");
  const saveQuestionButton = document.querySelector("#save-question-button");
  const cancelQuestionEditButton = document.querySelector(
    "#cancel-question-edit",
  );
  const moveQuestionModal = document.querySelector("#move-question-modal");
  const moveQuestionCurrent = document.querySelector("#move-question-current");
  const moveQuestionThemeSelect = document.querySelector(
    "#move-question-theme",
  );
  const moveQuestionMessage = document.querySelector("#move-question-message");
  const moveQuestionCancelButton = document.querySelector(
    "#move-question-cancel",
  );
  const moveQuestionConfirmButton = document.querySelector(
    "#move-question-confirm",
  );

  if (
    !moveQuestionModal ||
    !moveQuestionCurrent ||
    !moveQuestionThemeSelect ||
    !moveQuestionMessage ||
    !moveQuestionCancelButton ||
    !moveQuestionConfirmButton ||
    !saveQuestionButton ||
    !cancelQuestionEditButton ||
    !questionTabPanel ||
    !questionFilters ||
    !questionForm ||
    !questionTabButtons.length ||
    !questionListTab ||
    !questionFormTab ||
    !questionSubjectSelect ||
    !questionThemeSelect ||
    !questionStatementInput ||
    !alternativeAInput ||
    !alternativeBInput ||
    !alternativeCInput ||
    !alternativeDInput ||
    !alternativeEInput ||
    !correctAlternativeSelect ||
    !questionExplanationInput ||
    !clearQuestionFormButton ||
    !questionFormMessage ||
    !questionNoSubjectWarning ||
    !questionNoThemeWarning ||
    !questionsCurrentTheme ||
    !questionsCount ||
    !questionsEmptyState ||
    !questionsList
  ) {
    return;
  }

  let editingQuestionId = null;
  let movingQuestionId = null;

  function getSubjects() {
    return getCollection(SUBJECTS_COLLECTION);
  }

  function getThemes() {
    return getCollection(THEMES_COLLECTION);
  }

  function getQuestions() {
    return getCollection(QUESTIONS_COLLECTION);
  }

  function saveQuestions(questions) {
    saveCollection(QUESTIONS_COLLECTION, questions);
  }

  function createQuestion({
    subjectId,
    themeId,
    statement,
    alternatives,
    correctAlternative,
    explanation,
  }) {
    return {
      id: crypto.randomUUID(),
      subjectId,
      themeId,
      statement,
      alternatives,
      correctAlternative,
      explanation,
      shouldShuffleAlternatives: true,
      createdAt: new Date().toISOString(),
    };
  }

  function setQuestionContextFieldsEnabled(isEnabled) {
    questionSubjectSelect.disabled = !isEnabled;
    questionThemeSelect.disabled = !isEnabled;
  }

  function enterEditMode(question) {
    editingQuestionId = question.id;

    questionSubjectSelect.value = question.subjectId;
    renderThemeOptions();

    questionThemeSelect.value = question.themeId;
    renderQuestions();

    setQuestionContextFieldsEnabled(false);

    questionStatementInput.value = question.statement;
    alternativeAInput.value = question.alternatives.A || "";
    alternativeBInput.value = question.alternatives.B || "";
    alternativeCInput.value = question.alternatives.C || "";
    alternativeDInput.value = question.alternatives.D || "";
    alternativeEInput.value = question.alternatives.E || "";
    correctAlternativeSelect.value = question.correctAlternative;
    questionExplanationInput.value = question.explanation || "";

    saveQuestionButton.textContent = "Salvar alterações";
    cancelQuestionEditButton.hidden = false;

    setQuestionFormTabEnabled(true);
    showQuestionTab("form");

    questionForm.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setQuestionFormMessage("Editando questão selecionada.", "success");
  }

  function exitEditMode() {
    editingQuestionId = null;

    saveQuestionButton.textContent = "Adicionar questão";
    cancelQuestionEditButton.hidden = true;

    setQuestionContextFieldsEnabled(true);
    clearQuestionForm();
  }

  function updateQuestion(questionId, updatedQuestionData) {
    const updatedQuestions = getQuestions().map((question) => {
      if (question.id !== questionId) {
        return question;
      }

      return {
        ...question,
        ...updatedQuestionData,
        updatedAt: new Date().toISOString(),
      };
    });

    saveQuestions(updatedQuestions);
    notifyQuestionsChanged();
  }

  function deleteQuestion(questionId) {
    const updatedQuestions = getQuestions().filter((question) => {
      return question.id !== questionId;
    });

    saveQuestions(updatedQuestions);
    notifyQuestionsChanged();

    if (editingQuestionId === questionId) {
      exitEditMode();
    }

    renderQuestions();

    setQuestionFormMessage("Questão excluída com sucesso.", "success");
  }

  function showQuestionTab(tabName) {
    questionTabButtons.forEach((button) => {
      const isSelectedTab = button.dataset.questionTab === tabName;

      button.classList.toggle("is-active", isSelectedTab);
    });

    questionListTab.classList.toggle("is-active", tabName === "list");
    questionFormTab.classList.toggle("is-active", tabName === "form");
  }

  function notifyQuestionsChanged() {
    document.dispatchEvent(new CustomEvent("questions:changed"));
  }

  function setQuestionFormTabEnabled(isEnabled) {
    const formTabButton = Array.from(questionTabButtons).find((button) => {
      return button.dataset.questionTab === "form";
    });

    if (!formTabButton) {
      return;
    }

    formTabButton.disabled = !isEnabled;

    if (!isEnabled) {
      showQuestionTab("list");
    }
  }

  function formatDate(dateValue) {
    const date = new Date(dateValue);

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getShortText(text, maxLength = 170) {
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength).trim()}...`;
  }

  function setQuestionFormMessage(message, type = "default") {
    questionFormMessage.textContent = message;

    questionFormMessage.classList.remove("is-error", "is-success");

    if (type === "error") {
      questionFormMessage.classList.add("is-error");
    }

    if (type === "success") {
      questionFormMessage.classList.add("is-success");
    }
  }

  function updateQuestionsCount(questions) {
    const totalQuestions = questions.length;

    questionsCount.textContent =
      totalQuestions === 1 ? "1 questão" : `${totalQuestions} questões`;
  }

  function getSelectedSubject() {
    const selectedSubjectId = questionSubjectSelect.value;

    return getSubjects().find((subject) => {
      return subject.id === selectedSubjectId;
    });
  }

  function getSelectedTheme() {
    const selectedThemeId = questionThemeSelect.value;

    return getThemes().find((theme) => {
      return theme.id === selectedThemeId;
    });
  }

  function getThemeById(themeId) {
    return getThemes().find((theme) => {
      return theme.id === themeId;
    });
  }

  function getThemeNameById(themeId) {
    const theme = getThemeById(themeId);

    return theme ? theme.name : "Tema não encontrado";
  }

  function getSubjectById(subjectId) {
    return getSubjects().find((subject) => {
      return subject.id === subjectId;
    });
  }

  function getSubjectNameById(subjectId) {
    const subject = getSubjectById(subjectId);

    return subject ? subject.name : "Matéria não encontrada";
  }

  function getQuestionsFromSelectedContext() {
    const selectedSubject = getSelectedSubject();
    const selectedTheme = getSelectedTheme();

    if (!selectedSubject) {
      return [];
    }

    const questionsFromSubject = getQuestions().filter((question) => {
      return question.subjectId === selectedSubject.id;
    });

    if (selectedTheme) {
      return questionsFromSubject.filter((question) => {
        return question.themeId === selectedTheme.id;
      });
    }

    return [...questionsFromSubject].sort((firstQuestion, secondQuestion) => {
      const firstThemeName = getThemeNameById(firstQuestion.themeId);
      const secondThemeName = getThemeNameById(secondQuestion.themeId);

      return firstThemeName.localeCompare(secondThemeName, "pt-BR");
    });
  }

  function getThemesFromSelectedSubject() {
    const selectedSubjectId = questionSubjectSelect.value;

    if (!selectedSubjectId) {
      return [];
    }

    return getThemes().filter((theme) => {
      return theme.subjectId === selectedSubjectId;
    });
  }

  function getQuestionsFromSelectedTheme() {
    const selectedThemeId = questionThemeSelect.value;

    if (!selectedThemeId) {
      return [];
    }

    return getQuestions().filter((question) => {
      return question.themeId === selectedThemeId;
    });
  }

  function setMoveQuestionMessage(message, type = "default") {
    moveQuestionMessage.textContent = message;

    moveQuestionMessage.classList.remove("is-error", "is-success");

    if (type === "error") {
      moveQuestionMessage.classList.add("is-error");
    }

    if (type === "success") {
      moveQuestionMessage.classList.add("is-success");
    }
  }

  function renderMoveThemeOptions(question) {
    const subjects = getSubjects();
    const themes = getThemes().filter((theme) => {
      return theme.id !== question.themeId;
    });

    moveQuestionThemeSelect.innerHTML = `
    <option value="">Selecione um tema</option>
  `;

    subjects.forEach((subject) => {
      const themesFromSubject = themes.filter((theme) => {
        return theme.subjectId === subject.id;
      });

      if (themesFromSubject.length === 0) {
        return;
      }

      const group = document.createElement("optgroup");

      group.label = subject.name;

      themesFromSubject.forEach((theme) => {
        const option = document.createElement("option");

        option.value = theme.id;
        option.textContent = theme.name;

        group.appendChild(option);
      });

      moveQuestionThemeSelect.appendChild(group);
    });

    const hasAvailableThemes = themes.length > 0;

    moveQuestionThemeSelect.disabled = !hasAvailableThemes;
    moveQuestionConfirmButton.disabled = !hasAvailableThemes;

    if (!hasAvailableThemes) {
      setMoveQuestionMessage(
        "Não existe outro tema disponível para mover esta questão.",
        "error",
      );
    } else {
      setMoveQuestionMessage("");
    }
  }

  function openMoveQuestionModal(question) {
    movingQuestionId = question.id;

    const currentSubjectName = getSubjectNameById(question.subjectId);
    const currentThemeName = getThemeNameById(question.themeId);

    moveQuestionCurrent.innerHTML = `
    <span><strong>Matéria atual:</strong> ${escapeHTML(currentSubjectName)}</span>
    <span><strong>Tema atual:</strong> ${escapeHTML(currentThemeName)}</span>
  `;

    renderMoveThemeOptions(question);

    moveQuestionModal.hidden = false;
    moveQuestionThemeSelect.focus();
  }

  function closeMoveQuestionModal() {
    movingQuestionId = null;

    moveQuestionThemeSelect.value = "";
    setMoveQuestionMessage("");

    moveQuestionModal.hidden = true;
  }

  function moveQuestionToTheme(questionId, targetThemeId) {
    const targetTheme = getThemeById(targetThemeId);

    if (!targetTheme) {
      setMoveQuestionMessage(
        "Selecione um tema válido para mover a questão.",
        "error",
      );
      return;
    }

    const updatedQuestions = getQuestions().map((question) => {
      if (question.id !== questionId) {
        return question;
      }

      return {
        ...question,
        subjectId: targetTheme.subjectId,
        themeId: targetTheme.id,
        updatedAt: new Date().toISOString(),
        movedAt: new Date().toISOString(),
      };
    });

    saveQuestions(updatedQuestions);
    notifyQuestionsChanged();

    questionSubjectSelect.value = targetTheme.subjectId;
    renderThemeOptions();

    questionThemeSelect.value = targetTheme.id;
    setQuestionFormTabEnabled(true);
    renderQuestions();

    closeMoveQuestionModal();
    showQuestionTab("list");

    setQuestionFormMessage("Questão movida com sucesso.", "success");
  }

  function confirmMoveQuestion() {
    if (!movingQuestionId) {
      return;
    }

    const targetThemeId = moveQuestionThemeSelect.value;

    if (!targetThemeId) {
      setMoveQuestionMessage("Selecione o novo tema da questão.", "error");
      moveQuestionThemeSelect.focus();
      return;
    }

    moveQuestionToTheme(movingQuestionId, targetThemeId);
  }

  function handleMoveModalOverlayClick(event) {
    if (event.target === moveQuestionModal) {
      closeMoveQuestionModal();
    }
  }

  function handleMoveModalEscapeKey(event) {
    if (event.key === "Escape" && !moveQuestionModal.hidden) {
      closeMoveQuestionModal();
    }
  }

  function handleQuestionMove(event) {
    const moveButton = event.target.closest("[data-move-question]");

    if (!moveButton) {
      return;
    }

    const questionId = moveButton.dataset.moveQuestion;

    const question = getQuestions().find((currentQuestion) => {
      return currentQuestion.id === questionId;
    });

    if (!question) {
      return;
    }

    if (editingQuestionId) {
      exitEditMode();
    }

    openMoveQuestionModal(question);
  }

  function renderSubjectOptions() {
    const subjects = getSubjects();
    const previousSelectedSubjectId = questionSubjectSelect.value;

    questionSubjectSelect.innerHTML = `
      <option value="">Selecione uma matéria</option>
    `;

    subjects.forEach((subject) => {
      const option = document.createElement("option");

      option.value = subject.id;
      option.textContent = subject.name;

      questionSubjectSelect.appendChild(option);
    });

    const hasSubjects = subjects.length > 0;
    const selectedSubjectStillExists = subjects.some((subject) => {
      return subject.id === previousSelectedSubjectId;
    });

    questionNoSubjectWarning.hidden = hasSubjects;

    if (!hasSubjects) {
      questionFilters.hidden = true;
      questionTabPanel.hidden = true;

      questionTabButtons.forEach((button) => {
        button.hidden = true;
      });

      setQuestionFormTabEnabled(false);

      questionThemeSelect.innerHTML = `
    <option value="">Selecione um tema</option>
  `;

      questionNoThemeWarning.hidden = true;

      questionsCurrentTheme.textContent =
        "Cadastre uma matéria antes de criar questões.";

      updateQuestionsCount([]);

      questionsEmptyState.hidden = false;
      questionsEmptyState.innerHTML = `
    <strong>Nenhuma matéria disponível.</strong>
    <span>Cadastre uma matéria antes de criar questões.</span>
  `;

      questionsList.innerHTML = "";
      return;
    }

    questionFilters.hidden = false;
    questionTabPanel.hidden = false;

    questionTabButtons.forEach((button) => {
      button.hidden = false;
    });

    questionListTab.hidden = false;
    questionFormTab.hidden = false;

    if (selectedSubjectStillExists) {
      questionSubjectSelect.value = previousSelectedSubjectId;
    } else {
      questionSubjectSelect.value = "";
    }

    renderThemeOptions();
  }

  function renderThemeOptions() {
    const selectedSubject = getSelectedSubject();
    const themesFromSubject = getThemesFromSelectedSubject();
    const previousSelectedThemeId = questionThemeSelect.value;

    questionThemeSelect.innerHTML = `
      <option value="">Selecione um tema</option>
    `;

    if (!selectedSubject) {
      questionNoThemeWarning.hidden = true;
      setQuestionFormTabEnabled(false);
      renderQuestions();
      return;
    }

    themesFromSubject.forEach((theme) => {
      const option = document.createElement("option");

      option.value = theme.id;
      option.textContent = theme.name;

      questionThemeSelect.appendChild(option);
    });

    const hasThemes = themesFromSubject.length > 0;
    const selectedThemeStillExists = themesFromSubject.some((theme) => {
      return theme.id === previousSelectedThemeId;
    });

    questionNoThemeWarning.hidden = !selectedSubject || hasThemes;

    if (selectedThemeStillExists) {
      questionThemeSelect.value = previousSelectedThemeId;
    } else {
      questionThemeSelect.value = "";
    }

    setQuestionFormTabEnabled(Boolean(questionThemeSelect.value));

    renderQuestions();
  }

  function renderQuestions() {
    const selectedSubject = getSelectedSubject();
    const selectedTheme = getSelectedTheme();
    const themesFromSubject = getThemesFromSelectedSubject();
    const questionsFromContext = getQuestionsFromSelectedContext();

    questionsList.innerHTML = "";

    updateQuestionsCount(questionsFromContext);

    if (!selectedSubject) {
      questionsCurrentTheme.textContent =
        "Selecione uma matéria para carregar os temas.";

      questionsEmptyState.hidden = false;
      questionsEmptyState.innerHTML = `
      <strong>Nenhuma matéria selecionada.</strong>
      <span>Escolha uma matéria para visualizar os temas disponíveis.</span>
    `;

      return;
    }

    if (themesFromSubject.length === 0) {
      questionsCurrentTheme.innerHTML = `
      Questões da matéria <strong class="highlighted-subject-name">${escapeHTML(selectedSubject.name)}</strong>
    `;

      questionsEmptyState.hidden = false;
      questionsEmptyState.innerHTML = `
      <strong>Esta matéria ainda não possui temas.</strong>
      <span>Cadastre um tema antes de adicionar questões.</span>
    `;

      return;
    }

    if (selectedTheme) {
      questionsCurrentTheme.innerHTML = `
      Questões da matéria <strong class="highlighted-subject-name">${escapeHTML(selectedSubject.name)}</strong>
      com o tema <strong class="highlighted-theme-name">${escapeHTML(selectedTheme.name)}</strong>
    `;
    } else {
      questionsCurrentTheme.innerHTML = `
      Questões da matéria <strong class="highlighted-subject-name">${escapeHTML(selectedSubject.name)}</strong>
    `;
    }

    if (questionsFromContext.length === 0) {
      questionsEmptyState.hidden = false;

      if (selectedTheme) {
        questionsEmptyState.innerHTML = `
        <strong>Nenhuma questão cadastrada neste tema ainda.</strong>
        <span>Use a aba Cadastro para adicionar a primeira questão deste tema.</span>
      `;
      } else {
        questionsEmptyState.innerHTML = `
        <strong>Nenhuma questão cadastrada nesta matéria ainda.</strong>
        <span>Selecione um tema para liberar o cadastro de novas questões.</span>
      `;
      }

      return;
    }

    questionsEmptyState.hidden = true;

    questionsFromContext.forEach((question, index) => {
      const questionCard = document.createElement("article");
      const questionThemeName = getThemeNameById(question.themeId);

      questionCard.classList.add("question-card");
      questionCard.dataset.questionId = question.id;

      questionCard.innerHTML = `
      <div class="question-card__content">
        <div class="question-card__top">
          <h3>Questão ${String(index + 1).padStart(2, "0")}</h3>

          <span class="question-card__answer">
            Correta: <u>${escapeHTML(question.correctAlternative)}</u>
          </span>
        </div>

        <p class="question-card__statement">
          ${escapeHTML(getShortText(question.statement))}
        </p>

        <div class="question-card__meta">
          <span class="question-card__theme">
            Tema: <u>${escapeHTML(questionThemeName)}</u>
          </span>
          <span>Criada em ${formatDate(question.createdAt)}</span>
          <span>${question.shouldShuffleAlternatives ? "Alternativas serão embaralhadas" : "Ordem fixa das alternativas"}</span>
        </div>
      </div>

      <div class="question-card__actions">
        <button
          class="button button--secondary"
          type="button"
          data-edit-question="${question.id}"
        >
          Editar
        </button>

        <button
          class="button button--secondary"
          type="button"
          data-move-question="${question.id}"
        >
          Mover
        </button>

        <button
          class="button button--danger"
          type="button"
          data-delete-question="${question.id}"
        >
          Excluir
        </button>
      </div>
      `;

      questionsList.appendChild(questionCard);
    });
  }

  function clearQuestionForm() {
    questionStatementInput.value = "";
    alternativeAInput.value = "";
    alternativeBInput.value = "";
    alternativeCInput.value = "";
    alternativeDInput.value = "";
    alternativeEInput.value = "";
    correctAlternativeSelect.value = "";
    questionExplanationInput.value = "";
    setQuestionFormMessage("");
    questionStatementInput.focus();
  }

  function validateQuestionForm({
    selectedSubjectId,
    selectedThemeId,
    statement,
    alternatives,
    correctAlternative,
  }) {
    if (!selectedSubjectId) {
      setQuestionFormMessage(
        "Selecione uma matéria antes de cadastrar a questão.",
        "error",
      );
      questionSubjectSelect.focus();
      return false;
    }

    if (!selectedThemeId) {
      setQuestionFormMessage(
        "Selecione um tema antes de cadastrar a questão.",
        "error",
      );
      questionThemeSelect.focus();
      return false;
    }

    if (!statement) {
      setQuestionFormMessage("Informe o enunciado da questão.", "error");
      questionStatementInput.focus();
      return false;
    }

    if (!correctAlternative) {
      setQuestionFormMessage(
        "Selecione a alternativa correta da questão.",
        "error",
      );
      correctAlternativeSelect.focus();
      return false;
    }

    const correctAlternativeText = alternatives[correctAlternative];

    if (!correctAlternativeText) {
      setQuestionFormMessage(
        `Preencha o texto da alternativa ${correctAlternative}.`,
        "error",
      );

      const alternativeInputs = {
        A: alternativeAInput,
        B: alternativeBInput,
        C: alternativeCInput,
        D: alternativeDInput,
        E: alternativeEInput,
      };

      alternativeInputs[correctAlternative].focus();
      return false;
    }

    return true;
  }

  function handleQuestionSubmit(event) {
    event.preventDefault();

    const selectedSubjectId = questionSubjectSelect.value;
    const selectedThemeId = questionThemeSelect.value;
    const statement = questionStatementInput.value.trim();

    const alternatives = {
      A: alternativeAInput.value.trim(),
      B: alternativeBInput.value.trim(),
      C: alternativeCInput.value.trim(),
      D: alternativeDInput.value.trim(),
      E: alternativeEInput.value.trim(),
    };

    const correctAlternative = correctAlternativeSelect.value;
    const explanation = questionExplanationInput.value.trim();

    const isValidQuestion = validateQuestionForm({
      selectedSubjectId,
      selectedThemeId,
      statement,
      alternatives,
      correctAlternative,
    });

    if (!isValidQuestion) {
      return;
    }

    if (editingQuestionId) {
      updateQuestion(editingQuestionId, {
        subjectId: selectedSubjectId,
        themeId: selectedThemeId,
        statement,
        alternatives,
        correctAlternative,
        explanation,
      });

      renderQuestions();
      exitEditMode();
      showQuestionTab("list");

      setQuestionFormMessage("Questão atualizada com sucesso.", "success");
    } else {
      const questions = getQuestions();

      const newQuestion = createQuestion({
        subjectId: selectedSubjectId,
        themeId: selectedThemeId,
        statement,
        alternatives,
        correctAlternative,
        explanation,
      });

      questions.push(newQuestion);

      saveQuestions(questions);
      notifyQuestionsChanged();
      renderQuestions();
      clearQuestionForm();
      showQuestionTab("list");

      setQuestionFormMessage("Questão cadastrada com sucesso.", "success");
    }

    questionsList.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function handleQuestionDelete(event) {
    const deleteButton = event.target.closest("[data-delete-question]");

    if (!deleteButton) {
      return;
    }

    const questionId = deleteButton.dataset.deleteQuestion;

    const question = getQuestions().find((currentQuestion) => {
      return currentQuestion.id === questionId;
    });

    if (!question) {
      return;
    }

    openConfirmModal({
      tag: "⚠️ Confirmação",
      title: "Excluir questão",
      message: "Tem certeza que deseja excluir esta questão?",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      onConfirm: () => {
        deleteQuestion(question.id);
      },
    });
  }

  function handleQuestionEdit(event) {
    const editButton = event.target.closest("[data-edit-question]");

    if (!editButton) {
      return;
    }

    const questionId = editButton.dataset.editQuestion;

    const question = getQuestions().find((currentQuestion) => {
      return currentQuestion.id === questionId;
    });

    if (!question) {
      return;
    }

    enterEditMode(question);
  }

  function handleSubjectChange() {
    setQuestionFormMessage("");
    questionThemeSelect.value = "";
    renderThemeOptions();
  }

  function handleThemeChange() {
    setQuestionFormMessage("");
    setQuestionFormTabEnabled(Boolean(questionThemeSelect.value));
    renderQuestions();
  }

  questionForm.addEventListener("submit", handleQuestionSubmit);
  questionSubjectSelect.addEventListener("change", handleSubjectChange);
  questionThemeSelect.addEventListener("change", handleThemeChange);
  clearQuestionFormButton.addEventListener("click", clearQuestionForm);
  cancelQuestionEditButton.addEventListener("click", exitEditMode);

  questionsList.addEventListener("click", handleQuestionEdit);
  questionsList.addEventListener("click", handleQuestionMove);
  questionsList.addEventListener("click", handleQuestionDelete);

  moveQuestionCancelButton.addEventListener("click", closeMoveQuestionModal);
  moveQuestionConfirmButton.addEventListener("click", confirmMoveQuestion);
  moveQuestionModal.addEventListener("click", handleMoveModalOverlayClick);
  document.addEventListener("keydown", handleMoveModalEscapeKey);

  questionTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) {
        return;
      }

      showQuestionTab(button.dataset.questionTab);
    });
  });

  document.addEventListener("subjects:changed", renderSubjectOptions);
  document.addEventListener("themes:changed", renderThemeOptions);

  renderSubjectOptions();

  console.log("Sistema de questões carregado.");
}

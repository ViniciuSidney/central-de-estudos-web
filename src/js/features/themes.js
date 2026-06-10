import { getCollection, saveCollection } from "../core/storage.js";
import { openConfirmModal } from "../ui/confirmModal.js";
import { compareNames, parseItemsFromListText } from "../systems/listTextImport.js";
import { removeQuestionsAndRelatedDataByThemeIds, removeSubtopicsQuestionsAndRelatedDataByThemeIds } from "../systems/dataIntegrity.js";
import { addSubtopic, deleteSubtopic, getSubtopics, getSubtopicsByThemeId } from "../features/subtopics.js";

const SUBJECTS_COLLECTION = "subjects";
const THEMES_COLLECTION = "themes";
const QUESTIONS_COLLECTION = "questions";

export function initThemes() {
  const themeForm = document.querySelector("#theme-form");
  const themeSubjectSelect = document.querySelector("#theme-subject");
  const themeNameInput = document.querySelector("#theme-name");
  const themeDescriptionInput = document.querySelector("#theme-description");
  const clearThemeFormButton = document.querySelector("#clear-theme-form");
  const themeFormMessage = document.querySelector("#theme-form-message");
  const themeNoSubjectWarning = document.querySelector("#theme-no-subject-warning");
  const themesCurrentSubject = document.querySelector("#themes-current-subject");
  const themesCount = document.querySelector("#themes-count");
  const themesEmptyState = document.querySelector("#themes-empty-state");
  const themesList = document.querySelector("#themes-list");
  const themeTabButtons = document.querySelectorAll("[data-theme-tab]");
  const themeListTab = document.querySelector("#theme-list-tab");
  const themeImportTab = document.querySelector("#theme-import-tab");
  const themeImportAddedList = document.querySelector("#theme-import-added-list");
  const themeImportAddedCount = document.querySelector("#theme-import-added-count");
  const themeImportAddedEmpty = document.querySelector("#theme-import-added-empty");
  const themeImportTextInput = document.querySelector("#theme-import-text");
  const validateThemeImportButton = document.querySelector("#validate-theme-import");
  const clearThemeImportButton = document.querySelector("#clear-theme-import");
  const importValidatedThemesButton = document.querySelector("#import-validated-themes");
  const themeImportSummary = document.querySelector("#theme-import-summary");
  const themeImportList = document.querySelector("#theme-import-list");
  const themeImportErrors = document.querySelector("#theme-import-errors");
  const subtopicImportTab = document.querySelector("#subtopic-import-tab");
  const subtopicImportThemeSelect = document.querySelector("#subtopic-import-theme");
  const subtopicImportAddedList = document.querySelector("#subtopic-import-added-list");
  const subtopicImportAddedCount = document.querySelector("#subtopic-import-added-count");
  const subtopicImportAddedEmpty = document.querySelector("#subtopic-import-added-empty");
  const subtopicImportTextInput = document.querySelector("#subtopic-import-text");
  const validateSubtopicImportButton = document.querySelector("#validate-subtopic-import");
  const clearSubtopicImportButton = document.querySelector("#clear-subtopic-import");
  const importValidatedSubtopicsButton = document.querySelector("#import-validated-subtopics");
  const subtopicImportSummary = document.querySelector("#subtopic-import-summary");
  const subtopicImportList = document.querySelector("#subtopic-import-list");
  const subtopicImportErrors = document.querySelector("#subtopic-import-errors");

  if (
    !subtopicImportTab ||
    !subtopicImportThemeSelect ||
    !subtopicImportAddedList ||
    !subtopicImportAddedCount ||
    !subtopicImportAddedEmpty ||
    !subtopicImportTextInput ||
    !validateSubtopicImportButton ||
    !clearSubtopicImportButton ||
    !importValidatedSubtopicsButton ||
    !subtopicImportSummary ||
    !subtopicImportList ||
    !subtopicImportErrors ||
    !themeImportTextInput ||
    !validateThemeImportButton ||
    !clearThemeImportButton ||
    !importValidatedThemesButton ||
    !themeImportSummary ||
    !themeImportList ||
    !themeImportErrors ||
    !themeImportAddedList ||
    !themeImportAddedCount ||
    !themeImportAddedEmpty ||
    !themeTabButtons.length ||
    !themeListTab ||
    !themeImportTab ||
    !themeForm ||
    !themeSubjectSelect ||
    !themeNameInput ||
    !themeDescriptionInput ||
    !clearThemeFormButton ||
    !themeFormMessage ||
    !themeNoSubjectWarning ||
    !themesCurrentSubject ||
    !themesCount ||
    !themesEmptyState ||
    !themesList
  ) {
    return;
  }

  let importedThemesPreview = [];
  let importedSubtopicsPreview = [];
  let expandedThemeId = null;
  let activeSubtopicFormThemeId = null;

  function getSubjects() {
    return getCollection(SUBJECTS_COLLECTION);
  }

  function getThemes() {
    return getCollection(THEMES_COLLECTION);
  }

  function getQuestions() {
    return getCollection(QUESTIONS_COLLECTION);
  }

  function getThemeQuestionsCount(themeId) {
    return getQuestions().filter((question) => {
      return question.themeId === themeId;
    }).length;
  }

  function formatThemeQuestionsCount(total) {
    return total === 1 ? "1 questão cadastrada" : `${total} questões cadastradas`;
  }

  function saveThemes(themes) {
    saveCollection(THEMES_COLLECTION, themes);
  }

  function createTheme(subjectId, name, description) {
    return {
      id: crypto.randomUUID(),
      subjectId,
      name,
      description,
      createdAt: new Date().toISOString(),
    };
  }

  function notifyThemesChanged() {
    document.dispatchEvent(new CustomEvent("themes:changed"));
  }

  function formatDate(dateValue) {
    const date = new Date(dateValue);

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatCount(total, singular, plural) {
    return total === 1 ? `1 ${singular}` : `${total} ${plural}`;
  }

  function escapeHTML(value) {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function setThemeFormMessage(message, type = "default") {
    themeFormMessage.textContent = message;

    themeFormMessage.classList.remove("is-error", "is-success");

    if (type === "error") {
      themeFormMessage.classList.add("is-error");
    }

    if (type === "success") {
      themeFormMessage.classList.add("is-success");
    }
  }

  function updateThemesCount(themes) {
    const totalThemes = themes.length;

    themesCount.textContent = totalThemes === 1 ? "1 tema" : `${totalThemes} temas`;
  }

  function getSelectedSubject() {
    const selectedSubjectId = themeSubjectSelect.value;
    const subjects = getSubjects();

    return subjects.find((subject) => {
      return subject.id === selectedSubjectId;
    });
  }

  function getThemesFromSelectedSubject() {
    const selectedSubjectId = themeSubjectSelect.value;

    if (!selectedSubjectId) {
      return [];
    }

    return getThemes().filter((theme) => {
      return theme.subjectId === selectedSubjectId;
    });
  }

  function getSubtopicImportSelectedTheme() {
    const selectedThemeId = subtopicImportThemeSelect.value;

    return getThemes().find((theme) => {
      return theme.id === selectedThemeId;
    });
  }

  function getFirstSubjectWithThemes() {
    const subjects = getSubjects();
    const themes = getThemes();

    return subjects.find((subject) => {
      return themes.some((theme) => {
        return theme.subjectId === subject.id;
      });
    });
  }

  function selectInitialSubjectWithThemes() {
    // Evita abrir a seção de temas em estado vazio quando já existem temas cadastrados.
    if (themeSubjectSelect.value) {
      return;
    }

    const firstSubjectWithThemes = getFirstSubjectWithThemes();

    if (!firstSubjectWithThemes) {
      return;
    }

    themeSubjectSelect.value = firstSubjectWithThemes.id;
  }

  function getSubtopicsFromSelectedImportTheme() {
    const selectedTheme = getSubtopicImportSelectedTheme();

    if (!selectedTheme) {
      return [];
    }

    return getSubtopicsByThemeId(selectedTheme.id);
  }

  function renderSubtopicImportThemeOptions() {
    const selectedSubjectThemes = getThemesFromSelectedSubject();
    const previousSelectedThemeId = subtopicImportThemeSelect.value;

    subtopicImportThemeSelect.innerHTML = `
		<option value="">Selecione um tema</option>
	`;

    selectedSubjectThemes.forEach((theme) => {
      const option = document.createElement("option");

      option.value = theme.id;
      option.textContent = theme.name;

      subtopicImportThemeSelect.appendChild(option);
    });

    const selectedThemeStillExists = selectedSubjectThemes.some((theme) => {
      return theme.id === previousSelectedThemeId;
    });

    subtopicImportThemeSelect.value = selectedThemeStillExists ? previousSelectedThemeId : "";

    renderSubtopicImportAddedList();
  }

  function renderSubtopicImportAddedList() {
    const subtopics = getSubtopicsFromSelectedImportTheme();

    subtopicImportAddedList.innerHTML = "";
    subtopicImportAddedCount.textContent = formatCount(subtopics.length, "assunto", "assuntos");

    if (subtopics.length === 0) {
      subtopicImportAddedEmpty.hidden = false;
      return;
    }

    subtopicImportAddedEmpty.hidden = true;

    subtopics.forEach((subtopic) => {
      const item = document.createElement("li");

      item.classList.add("theme-import-added-item");

      item.innerHTML = `
			<strong class="theme-import-added-item__title">
				${escapeHTML(subtopic.name)}
			</strong>

			<button
				class="management-icon-button management-icon-button--danger"
				type="button"
				data-delete-import-subtopic="${subtopic.id}"
				aria-label="Excluir assunto ${escapeHTML(subtopic.name)}"
				title="Excluir assunto"
			>
				🗑️
			</button>
		`;

      subtopicImportAddedList.appendChild(item);
    });
  }

  function setSubtopicImportSummary({
    title = "Aguardando validação.",
    description = "Selecione uma matéria, um tema, cole a lista e clique em Validar assuntos.",
    type = "default",
  } = {}) {
    subtopicImportSummary.innerHTML = `
		<strong>${escapeHTML(title)}</strong>
		<span>${escapeHTML(description)}</span>
	`;

    subtopicImportSummary.classList.remove("is-success", "is-error");

    if (type === "success") {
      subtopicImportSummary.classList.add("is-success");
    }

    if (type === "error") {
      subtopicImportSummary.classList.add("is-error");
    }
  }

  function renderSubtopicImportList(items = []) {
    subtopicImportList.innerHTML = "";

    items.forEach((item) => {
      const listItem = document.createElement("li");

      listItem.textContent = item;

      subtopicImportList.appendChild(listItem);
    });
  }

  function renderSubtopicImportErrors(errors = []) {
    subtopicImportErrors.innerHTML = "";

    errors.forEach((error) => {
      const errorItem = document.createElement("li");

      errorItem.textContent = error;

      subtopicImportErrors.appendChild(errorItem);
    });
  }

  function clearSubtopicImport() {
    importedSubtopicsPreview = [];

    subtopicImportTextInput.value = "";
    importValidatedSubtopicsButton.disabled = true;

    setSubtopicImportSummary();
    renderSubtopicImportList();
    renderSubtopicImportErrors();

    subtopicImportTextInput.focus();
  }

  function validateSubtopicImport() {
    const selectedSubjectId = themeSubjectSelect.value;
    const selectedTheme = getSubtopicImportSelectedTheme();

    if (!selectedSubjectId) {
      importedSubtopicsPreview = [];
      importValidatedSubtopicsButton.disabled = true;

      setSubtopicImportSummary({
        title: "Matéria não selecionada.",
        description: "Selecione uma matéria antes de validar a importação.",
        type: "error",
      });

      renderSubtopicImportList();
      renderSubtopicImportErrors();
      themeSubjectSelect.focus();
      return;
    }

    if (!selectedTheme) {
      importedSubtopicsPreview = [];
      importValidatedSubtopicsButton.disabled = true;

      setSubtopicImportSummary({
        title: "Tema não selecionado.",
        description: "Selecione um tema antes de validar a importação.",
        type: "error",
      });

      renderSubtopicImportList();
      renderSubtopicImportErrors();
      subtopicImportThemeSelect.focus();
      return;
    }

    const result = parseItemsFromListText(subtopicImportTextInput.value);
    const currentSubtopics = getSubtopicsByThemeId(selectedTheme.id);

    const duplicatedInStorage = [];
    const validSubtopics = [];

    result.items.forEach((subtopicName) => {
      const alreadyExists = currentSubtopics.some((subtopic) => {
        return compareNames(subtopic.name, subtopicName);
      });

      if (alreadyExists) {
        duplicatedInStorage.push(subtopicName);
        return;
      }

      validSubtopics.push(subtopicName);
    });

    importedSubtopicsPreview = validSubtopics;

    const errors = [...result.errors];

    result.duplicatedItems.forEach((item) => {
      errors.push(`"${item}" aparece repetido na lista e será ignorado.`);
    });

    duplicatedInStorage.forEach((item) => {
      errors.push(`"${item}" já está cadastrado neste tema e será ignorado.`);
    });

    renderSubtopicImportList(validSubtopics);
    renderSubtopicImportErrors(errors);

    importValidatedSubtopicsButton.disabled = validSubtopics.length === 0;

    if (validSubtopics.length === 0 && errors.length > 0) {
      setSubtopicImportSummary({
        title: "Nenhum assunto novo encontrado.",
        description: `${formatCount(errors.length, "aviso encontrado", "avisos encontrados")}. Ajuste a lista e valide novamente.`,
        type: "error",
      });

      return;
    }

    if (validSubtopics.length > 0 && errors.length > 0) {
      setSubtopicImportSummary({
        title: `${formatCount(validSubtopics.length, "assunto pronto", "assuntos prontos")} para importação.`,
        description: `${formatCount(errors.length, "item será ignorado", "itens serão ignorados")} por repetição ou duplicidade.`,
        type: "success",
      });

      return;
    }

    setSubtopicImportSummary({
      title: `${formatCount(validSubtopics.length, "assunto pronto", "assuntos prontos")} para importação.`,
      description: "Nenhum problema encontrado. Você já pode importar os assuntos.",
      type: "success",
    });
  }

  function importValidatedSubtopics() {
    const selectedSubjectId = themeSubjectSelect.value;
    const selectedTheme = getSubtopicImportSelectedTheme();

    if (!selectedSubjectId) {
      setSubtopicImportSummary({
        title: "Matéria não selecionada.",
        description: "Selecione uma matéria antes de importar os assuntos.",
        type: "error",
      });

      return;
    }

    if (!selectedTheme) {
      setSubtopicImportSummary({
        title: "Tema não selecionado.",
        description: "Selecione um tema antes de importar os assuntos.",
        type: "error",
      });

      return;
    }

    if (importedSubtopicsPreview.length === 0) {
      setSubtopicImportSummary({
        title: "Nenhum assunto validado.",
        description: "Valide uma lista antes de importar.",
        type: "error",
      });

      return;
    }

    let importedCount = 0;

    importedSubtopicsPreview.forEach((subtopicName) => {
      const result = addSubtopic({
        subjectId: selectedSubjectId,
        themeId: selectedTheme.id,
        name: subtopicName,
      });

      if (result.ok) {
        importedCount += 1;
      }
    });

    importedSubtopicsPreview = [];
    subtopicImportTextInput.value = "";
    importValidatedSubtopicsButton.disabled = true;

    setSubtopicImportSummary({
      title: `${formatCount(importedCount, "assunto importado", "assuntos importados")} com sucesso.`,
      description: `Os assuntos foram adicionados ao tema "${selectedTheme.name}".`,
      type: "success",
    });

    renderSubtopicImportList();
    renderSubtopicImportErrors();
    renderSubtopicImportAddedList();
    renderThemes();
  }

  function renderSubtopicsPanel(theme) {
    const subtopics = getSubtopicsByThemeId(theme.id);
    const isFormActive = activeSubtopicFormThemeId === theme.id;

    const subtopicFormHTML = isFormActive
      ? `
			<form class="subtopic-inline-form" data-subtopic-form="${escapeHTML(theme.id)}">
				<input
					type="text"
					name="subtopicName"
					placeholder="Nome do assunto"
					autocomplete="off"
					required
				/>

				<button class="button button--primary" type="submit">
					Adicionar
				</button>

				<button
					class="button button--secondary"
					type="button"
					data-cancel-subtopic-form="${escapeHTML(theme.id)}"
				>
					Cancelar
				</button>
			</form>
		`
      : `
			<button
				class="button button--secondary subtopics-panel__add-button"
				type="button"
				data-show-subtopic-form="${escapeHTML(theme.id)}"
			>
				+ Adicionar assunto
			</button>
		`;

    const subtopicsHTML =
      subtopics.length === 0
        ? `
				<div class="empty-state subtopics-panel__empty">
					<strong>Nenhum assunto cadastrado.</strong>
					<span>Use o botão acima para dividir este tema em assuntos menores.</span>
				</div>
			`
        : subtopics
            .map((subtopic) => {
              const questionsCount = getSubtopicQuestionsCount(subtopic.id);
              const hasQuestions = questionsCount > 0;

              return `
							<article class="subtopic-card" data-subtopic-id="${escapeHTML(subtopic.id)}">
								<div class="subtopic-card__content">
									<strong>${escapeHTML(subtopic.name)}</strong>

									<span>${formatSubtopicQuestionsCount(questionsCount)}</span>
								</div>

								<div class="subtopic-card__actions">
									<button
										class="button button--secondary subtopic-card__study-action"
										type="button"
										data-${hasQuestions ? "study" : "create"}-subtopic="${escapeHTML(subtopic.id)}"
									>
										${hasQuestions ? "Estudar 🧠" : "Cadastrar ✏️"}
									</button>

									<button
										class="management-icon-button management-icon-button--danger"
										type="button"
										data-delete-subtopic="${escapeHTML(subtopic.id)}"
										aria-label="Excluir assunto ${escapeHTML(subtopic.name)}"
										title="Excluir assunto"
									>
										🗑️
									</button>
								</div>
							</article>
						`;
            })
            .join("");

    return `
		<section class="subtopics-panel" data-subtopics-panel="${escapeHTML(theme.id)}">
			<header class="subtopics-panel__header">
				<div>
					<strong>Assuntos de ${escapeHTML(theme.name)}</strong>
					<span>Organize este tema em partes menores para estudar com mais precisão.</span>
				</div>

				<span>${formatSubtopicsCount(subtopics.length)}</span>
			</header>

			<div class="subtopics-panel__actions">
				${subtopicFormHTML}
			</div>

			<div class="subtopics-gallery">
				${subtopicsHTML}
			</div>
		</section>
	`;
  }

  function renderThemes() {
    const selectedSubject = getSelectedSubject();
    const selectedSubjectThemes = getThemesFromSelectedSubject();

    themesList.innerHTML = "";

    updateThemesCount(selectedSubjectThemes);
    renderThemeImportAddedList(selectedSubjectThemes);

    if (!selectedSubject) {
      themesCurrentSubject.textContent = "Selecione uma matéria para visualizar seus temas.";

      themesEmptyState.hidden = false;
      themesEmptyState.innerHTML = `
			<strong>Nenhum tema selecionado.</strong>
			<span>Escolha uma matéria para visualizar ou cadastrar seus temas.</span>
			`;

      return;
    }

    themesCurrentSubject.innerHTML = `
	Temas de <strong class="highlighted-subject-name">${escapeHTML(selectedSubject.name)}</strong>
	`;

    if (selectedSubjectThemes.length === 0) {
      themesEmptyState.hidden = false;
      themesEmptyState.innerHTML = `
			<strong>Nenhum tema cadastrado ainda.</strong>
			<span>Use o formulário acima para adicionar o primeiro tema desta matéria.</span>
			`;

      return;
    }

    themesEmptyState.hidden = true;

    selectedSubjectThemes.forEach((theme) => {
      const themeCard = document.createElement("article");
      const questionsCount = getThemeQuestionsCount(theme.id);
      const subtopicsCount = getSubtopicsByThemeId(theme.id).length;
      const isExpanded = expandedThemeId === theme.id;

      themeCard.classList.add("theme-card");

      if (isExpanded) {
        themeCard.classList.add("is-expanded");
      }

      themeCard.dataset.themeId = theme.id;

      themeCard.innerHTML = `
		<div class="theme-card__content">
			<strong>${escapeHTML(theme.name)}</strong>

			<span>${escapeHTML(theme.description || "Sem descrição adicionada.")}</span>

			<span class="theme-card__questions-count ${questionsCount === 0 ? "is-empty" : ""}">
				${formatThemeQuestionsCount(questionsCount)}
			</span>

			<span class="theme-card__subtopics-count ${subtopicsCount === 0 ? "is-empty" : ""}">
				${formatSubtopicsCount(subtopicsCount)}
			</span>

			<small>Criado em ${formatDate(theme.createdAt)}</small>
		</div>

		<div class="theme-card__actions">
			<button
				class="button button--secondary theme-card__subtopics-button"
				type="button"
				data-toggle-subtopics="${theme.id}"
				aria-label="Ver assuntos de ${escapeHTML(theme.name)}"
				title="Assuntos"
			>
				${isExpanded ? "Ocultar assuntos ▲" : "Assuntos ▾"}
			</button>

			<button
				class="management-icon-button management-icon-button--danger"
				type="button"
				data-delete-theme="${theme.id}"
				aria-label="Excluir tema ${escapeHTML(theme.name)}"
				title="Excluir tema"
			>
				🗑️
			</button>
		</div>
	`;

      if (isExpanded) {
        const expandedRow = document.createElement("div");
        const subtopicsPanelWrapper = document.createElement("div");

        expandedRow.classList.add("theme-expanded-row");
        subtopicsPanelWrapper.classList.add("subtopics-panel-wrapper");

        subtopicsPanelWrapper.innerHTML = renderSubtopicsPanel(theme);

        expandedRow.appendChild(themeCard);
        expandedRow.appendChild(subtopicsPanelWrapper);

        themesList.appendChild(expandedRow);

        return;
      }

      themesList.appendChild(themeCard);
    });
  }

  function renderSubjectOptions() {
    const subjects = getSubjects();
    const previousSelectedSubjectId = themeSubjectSelect.value;

    themeSubjectSelect.innerHTML = `
      <option value="">Selecione uma matéria</option>
    `;

    subjects.forEach((subject) => {
      const option = document.createElement("option");

      option.value = subject.id;
      option.textContent = subject.name;

      themeSubjectSelect.appendChild(option);
    });

    const hasSubjects = subjects.length > 0;
    const selectedSubjectStillExists = subjects.some((subject) => {
      return subject.id === previousSelectedSubjectId;
    });

    themeNoSubjectWarning.hidden = hasSubjects;
    themeForm.hidden = !hasSubjects;

    if (!hasSubjects) {
      themeSubjectSelect.value = "";
      themesCurrentSubject.textContent = "Cadastre uma matéria antes de criar temas.";

      themesCount.textContent = "0 temas";

      themesEmptyState.hidden = false;
      themesEmptyState.innerHTML = `
        <strong>Nenhuma matéria disponível.</strong>
        <span>Cadastre uma matéria antes de criar temas.</span>
      `;

      themesList.innerHTML = "";

      return;
    }

    if (selectedSubjectStillExists) {
      themeSubjectSelect.value = previousSelectedSubjectId;
    } else {
      themeSubjectSelect.value = "";
    }

    selectInitialSubjectWithThemes();

    renderThemes();
  }

  function clearThemeForm() {
    themeNameInput.value = "";
    themeDescriptionInput.value = "";
    setThemeFormMessage("");
    themeNameInput.focus();
  }

  function handleThemeSubmit(event) {
    event.preventDefault();

    const selectedSubjectId = themeSubjectSelect.value;
    const themeName = themeNameInput.value.trim();
    const themeDescription = themeDescriptionInput.value.trim();

    if (!selectedSubjectId) {
      setThemeFormMessage("Selecione uma matéria antes de cadastrar o tema.", "error");
      themeSubjectSelect.focus();
      return;
    }

    if (!themeName) {
      setThemeFormMessage("Informe o nome do tema antes de cadastrar.", "error");
      themeNameInput.focus();
      return;
    }

    const selectedSubjectThemes = getThemesFromSelectedSubject();

    const duplicatedTheme = selectedSubjectThemes.find((theme) => {
      return compareNames(theme.name, themeName);
    });

    if (duplicatedTheme) {
      setThemeFormMessage(`O tema "${duplicatedTheme.name}" já está cadastrado nesta matéria.`, "error");

      themeNameInput.focus();
      return;
    }

    const themes = getThemes();
    const newTheme = createTheme(selectedSubjectId, themeName, themeDescription);

    themes.push(newTheme);

    saveThemes(themes);
    renderThemes();
    notifyThemesChanged();

    themeNameInput.value = "";
    themeDescriptionInput.value = "";
    themeNameInput.focus();

    setThemeFormMessage("Tema cadastrado com sucesso.", "success");
  }

  function handleThemeDelete(event) {
    const deleteButton = event.target.closest("[data-delete-theme]");

    if (!deleteButton) {
      return;
    }

    const themeId = deleteButton.dataset.deleteTheme;

    const theme = getThemes().find((currentTheme) => {
      return currentTheme.id === themeId;
    });

    if (!theme) {
      return;
    }

    openConfirmModal({
      tag: "⚠️ Confirmação",
      title: "Excluir tema",
      message: `Tem certeza que deseja excluir o tema "${theme.name}"?`,
      confirmText: "Excluir",
      cancelText: "Cancelar",
      onConfirm: () => {
        deleteTheme(theme.id);
      },
    });
  }

  function deleteTheme(themeId) {
    const updatedThemes = getThemes().filter((theme) => {
      return theme.id !== themeId;
    });

    saveThemes(updatedThemes);

    removeSubtopicsQuestionsAndRelatedDataByThemeIds([themeId]);
    removeQuestionsAndRelatedDataByThemeIds([themeId]);

    if (expandedThemeId === themeId) {
      expandedThemeId = null;
      activeSubtopicFormThemeId = null;
    }

    renderThemes();
    notifyThemesChanged();

    setThemeFormMessage("Tema, assuntos e questões relacionadas excluídos com sucesso.", "success");
  }

  function handleSubjectChange() {
    expandedThemeId = null;
    activeSubtopicFormThemeId = null;

    setThemeFormMessage("");
    clearThemeImport();
    clearSubtopicImport();
    renderSubtopicImportThemeOptions();
    renderThemes();
  }

  function handleExternalThemeCreate(event) {
    const subjectId = event.detail?.subjectId;

    if (!subjectId) {
      return;
    }

    const subjectExists = getSubjects().some((subject) => {
      return subject.id === subjectId;
    });

    if (!subjectExists) {
      return;
    }

    themeSubjectSelect.value = subjectId;
    renderThemes();

    themeNameInput.focus();

    setThemeFormMessage("Cadastre um tema para completar esta matéria.", "success");
  }

  function showThemeTab(tabName) {
    themeTabButtons.forEach((button) => {
      const isActive = button.dataset.themeTab === tabName;

      button.classList.toggle("is-active", isActive);
    });

    themeListTab.classList.toggle("is-active", tabName === "list");
    themeImportTab.classList.toggle("is-active", tabName === "import");
    subtopicImportTab.classList.toggle("is-active", tabName === "subtopic-import");

    if (tabName === "subtopic-import") {
      renderSubtopicImportThemeOptions();
      renderSubtopicImportAddedList();
    }
  }

  function renderThemeImportAddedList(themes) {
    themeImportAddedList.innerHTML = "";

    themeImportAddedCount.textContent = formatCount(themes.length, "tema", "temas");

    if (themes.length === 0) {
      themeImportAddedEmpty.hidden = false;
      return;
    }

    themeImportAddedEmpty.hidden = true;

    themes.forEach((theme) => {
      const item = document.createElement("li");

      item.classList.add("theme-import-added-item");

      item.innerHTML = `
        <strong class="theme-import-added-item__title">
          ${escapeHTML(theme.name)}
        </strong>

        <button
          class="management-icon-button management-icon-button--danger"
          type="button"
          data-delete-theme="${theme.id}"
          aria-label="Excluir tema ${escapeHTML(theme.name)}"
          title="Excluir tema"
        >
          🗑️
        </button>
      `;

      themeImportAddedList.appendChild(item);
    });
  }

  function setThemeImportSummary({
    title = "Aguardando validação.",
    description = "Selecione uma matéria, cole a lista e clique em Validar temas.",
    type = "default",
  } = {}) {
    themeImportSummary.innerHTML = `
    <strong>${escapeHTML(title)}</strong>
    <span>${escapeHTML(description)}</span>
  `;

    themeImportSummary.classList.remove("is-success", "is-error");

    if (type === "success") {
      themeImportSummary.classList.add("is-success");
    }

    if (type === "error") {
      themeImportSummary.classList.add("is-error");
    }
  }

  function renderThemeImportList(items = []) {
    themeImportList.innerHTML = "";

    items.forEach((item) => {
      const listItem = document.createElement("li");

      listItem.textContent = item;

      themeImportList.appendChild(listItem);
    });
  }

  function renderThemeImportErrors(errors = []) {
    themeImportErrors.innerHTML = "";

    errors.forEach((error) => {
      const errorItem = document.createElement("li");

      errorItem.textContent = error;

      themeImportErrors.appendChild(errorItem);
    });
  }

  function clearThemeImport() {
    importedThemesPreview = [];

    themeImportTextInput.value = "";
    importValidatedThemesButton.disabled = true;

    setThemeImportSummary();
    renderThemeImportList();
    renderThemeImportErrors();

    themeImportTextInput.focus();
  }

  function validateThemeImport() {
    const selectedSubjectId = themeSubjectSelect.value;

    if (!selectedSubjectId) {
      importedThemesPreview = [];
      importValidatedThemesButton.disabled = true;

      setThemeImportSummary({
        title: "Matéria não selecionada.",
        description: "Selecione uma matéria antes de validar a importação.",
        type: "error",
      });

      renderThemeImportList();
      renderThemeImportErrors();
      themeSubjectSelect.focus();
      return;
    }

    const result = parseItemsFromListText(themeImportTextInput.value);
    const currentThemes = getThemesFromSelectedSubject();

    const duplicatedInStorage = [];
    const validThemes = [];

    result.items.forEach((themeName) => {
      const alreadyExists = currentThemes.some((theme) => {
        return compareNames(theme.name, themeName);
      });

      if (alreadyExists) {
        duplicatedInStorage.push(themeName);
        return;
      }

      validThemes.push(themeName);
    });

    importedThemesPreview = validThemes;

    const errors = [...result.errors];

    result.duplicatedItems.forEach((item) => {
      errors.push(`"${item}" aparece repetido na lista e será ignorado.`);
    });

    duplicatedInStorage.forEach((item) => {
      errors.push(`"${item}" já está cadastrado nesta matéria e será ignorado.`);
    });

    renderThemeImportList(validThemes);
    renderThemeImportErrors(errors);

    importValidatedThemesButton.disabled = validThemes.length === 0;

    if (validThemes.length === 0 && errors.length > 0) {
      setThemeImportSummary({
        title: "Nenhum tema novo encontrado.",
        description: `${formatCount(errors.length, "aviso encontrado", "avisos encontrados")}. Ajuste a lista e valide novamente.`,
        type: "error",
      });

      return;
    }

    if (validThemes.length > 0 && errors.length > 0) {
      setThemeImportSummary({
        title: `${formatCount(validThemes.length, "tema pronto", "temas prontos")} para importação.`,
        description: `${formatCount(errors.length, "item será ignorado", "itens serão ignorados")} por repetição ou duplicidade.`,
        type: "success",
      });

      return;
    }

    setThemeImportSummary({
      title: `${formatCount(validThemes.length, "tema pronto", "temas prontos")} para importação.`,
      description: "Nenhum problema encontrado. Você já pode importar os temas.",
      type: "success",
    });
  }

  function importValidatedThemes() {
    const selectedSubjectId = themeSubjectSelect.value;

    if (!selectedSubjectId) {
      setThemeImportSummary({
        title: "Matéria não selecionada.",
        description: "Selecione uma matéria antes de importar os temas.",
        type: "error",
      });

      return;
    }

    if (importedThemesPreview.length === 0) {
      setThemeImportSummary({
        title: "Nenhum tema validado.",
        description: "Valide uma lista antes de importar.",
        type: "error",
      });

      return;
    }

    const themes = getThemes();

    const newThemes = importedThemesPreview.map((themeName) => {
      return createTheme(selectedSubjectId, themeName, "");
    });

    saveThemes([...themes, ...newThemes]);
    notifyThemesChanged();

    importedThemesPreview = [];
    themeImportTextInput.value = "";
    importValidatedThemesButton.disabled = true;

    setThemeImportSummary({
      title: `${formatCount(newThemes.length, "tema importado", "temas importados")} com sucesso.`,
      description: "Os temas foram adicionados à matéria selecionada.",
      type: "success",
    });

    renderThemeImportList();
    renderThemeImportErrors();
    renderThemes();

    showThemeTab("list");
  }

  function getSubtopicQuestionsCount(subtopicId) {
    return getQuestions().filter((question) => {
      return question.subtopicId === subtopicId;
    }).length;
  }

  function getSubtopicById(subtopicId) {
    return getSubtopics().find((subtopic) => {
      return subtopic.id === subtopicId;
    });
  }

  function formatSubtopicsCount(total) {
    return total === 1 ? "1 assunto" : `${total} assuntos`;
  }

  function formatSubtopicQuestionsCount(total) {
    return total === 1 ? "1 questão" : `${total} questões`;
  }

  function renderSubtopicsPanel(theme) {
    const subtopics = getSubtopicsByThemeId(theme.id);
    const isFormActive = activeSubtopicFormThemeId === theme.id;

    const subtopicFormHTML = isFormActive
      ? `
			<form class="subtopic-inline-form" data-subtopic-form="${escapeHTML(theme.id)}">
				<input
					type="text"
					name="subtopicName"
					placeholder="Nome do assunto"
					autocomplete="off"
					required
				/>

				<button class="button button--primary" type="submit">
					Adicionar
				</button>

				<button
					class="button button--secondary"
					type="button"
					data-cancel-subtopic-form="${escapeHTML(theme.id)}"
				>
					Cancelar
				</button>
			</form>
		`
      : `
			<button
				class="button button--secondary subtopics-panel__add-button"
				type="button"
				data-show-subtopic-form="${escapeHTML(theme.id)}"
			>
				+ Adicionar assunto
			</button>
		`;

    const subtopicsHTML =
      subtopics.length === 0
        ? `
				<div class="empty-state subtopics-panel__empty">
					<strong>Nenhum assunto cadastrado.</strong>
					<span>Adicione assuntos para dividir este tema em partes menores.</span>
				</div>
			`
        : subtopics
            .map((subtopic) => {
              const questionsCount = getSubtopicQuestionsCount(subtopic.id);
              const hasQuestions = questionsCount > 0;

              return `
							<article class="subtopic-card" data-subtopic-id="${escapeHTML(subtopic.id)}">
								<div class="subtopic-card__content">
									<strong>${escapeHTML(subtopic.name)}</strong>

									<span>${formatSubtopicQuestionsCount(questionsCount)}</span>
								</div>

								<div class="subtopic-card__actions">
									<button
										class="button button--secondary subtopic-card__study-action"
										type="button"
										data-${hasQuestions ? "study" : "create"}-subtopic="${escapeHTML(subtopic.id)}"
										title="${hasQuestions ? "Estudar assunto" : "Cadastrar questão"}"
									>
										${hasQuestions ? "Estudar 🧠" : "Cadastrar ✏️"}
									</button>

									<button
										class="management-icon-button management-icon-button--danger"
										type="button"
										data-delete-subtopic="${escapeHTML(subtopic.id)}"
										aria-label="Excluir assunto ${escapeHTML(subtopic.name)}"
										title="Excluir assunto"
									>
										🗑️
									</button>
								</div>
							</article>
						`;
            })
            .join("");

    return `
		<section class="subtopics-panel">
			<header class="subtopics-panel__header">
				<div>
					<strong>Assuntos de ${escapeHTML(theme.name)}</strong>
					<span>Organize este tema em partes menores.</span>
				</div>

				<span>${formatSubtopicsCount(subtopics.length)}</span>
			</header>

			<div class="subtopics-panel__actions">
				${subtopicFormHTML}
			</div>

			<div class="subtopics-gallery">
				${subtopicsHTML}
			</div>
		</section>
	`;
  }

  function handleSubtopicsToggle(event) {
    const toggleButton = event.target.closest("[data-toggle-subtopics]");

    if (!toggleButton) {
      return;
    }

    const themeId = toggleButton.dataset.toggleSubtopics;
    const isClosingCurrentPanel = expandedThemeId === themeId;

    expandedThemeId = isClosingCurrentPanel ? null : themeId;
    activeSubtopicFormThemeId = null;

    renderThemes();

    if (isClosingCurrentPanel) {
      return;
    }

    requestAnimationFrame(() => {
      const expandedRow = themesList.querySelector(".theme-expanded-row");

      if (!expandedRow) {
        return;
      }

      expandedRow.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    });
  }

  function handleShowSubtopicForm(event) {
    const button = event.target.closest("[data-show-subtopic-form]");

    if (!button) {
      return;
    }

    activeSubtopicFormThemeId = button.dataset.showSubtopicForm;
    renderThemes();

    const input = themesList.querySelector(`[data-subtopic-form="${activeSubtopicFormThemeId}"] input`);

    if (input) {
      input.focus();
    }
  }

  function handleCancelSubtopicForm(event) {
    const button = event.target.closest("[data-cancel-subtopic-form]");

    if (!button) {
      return;
    }

    activeSubtopicFormThemeId = null;
    renderThemes();
  }

  function handleSubtopicSubmit(event) {
    const form = event.target.closest("[data-subtopic-form]");

    if (!form) {
      return;
    }

    event.preventDefault();

    const themeId = form.dataset.subtopicForm;
    const nameInput = form.elements.subtopicName;
    const name = nameInput.value.trim();

    const theme = getThemes().find((currentTheme) => {
      return currentTheme.id === themeId;
    });

    if (!theme) {
      return;
    }

    const result = addSubtopic({
      subjectId: theme.subjectId,
      themeId: theme.id,
      name,
    });

    if (!result.ok) {
      setThemeFormMessage(result.message, "error");
      nameInput.focus();
      return;
    }

    activeSubtopicFormThemeId = null;
    setThemeFormMessage(result.message, "success");
    renderThemes();
  }

  function handleSubtopicDelete(event) {
    const deleteButton = event.target.closest("[data-delete-subtopic]");

    if (!deleteButton) {
      return;
    }

    const subtopicId = deleteButton.dataset.deleteSubtopic;
    const subtopic = getSubtopicsByThemeId(expandedThemeId || "").find((currentSubtopic) => {
      return currentSubtopic.id === subtopicId;
    });

    if (!subtopic) {
      return;
    }

    openConfirmModal({
      tag: "⚠️ Confirmação",
      title: "Excluir assunto",
      message: `Tem certeza que deseja excluir o assunto "${subtopic.name}"?`,
      confirmText: "Excluir",
      cancelText: "Cancelar",
      onConfirm: () => {
        unlinkQuestionsFromSubtopic(subtopic.id);
        deleteSubtopic(subtopic.id);

        setThemeFormMessage("Assunto excluído com sucesso. As questões vinculadas foram mantidas no tema.", "success");

        renderThemes();
      },
    });
  }

  function handleSubtopicCreateQuestion(event) {
    const button = event.target.closest("[data-create-subtopic]");

    if (!button) {
      return;
    }

    const subtopicId = button.dataset.createSubtopic;
    const subtopic = getSubtopicsByThemeId(expandedThemeId || "").find((currentSubtopic) => {
      return currentSubtopic.id === subtopicId;
    });

    if (!subtopic) {
      return;
    }

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

  function handleSubtopicStudy(event) {
    const button = event.target.closest("[data-study-subtopic]");

    if (!button) {
      return;
    }

    const subtopicId = button.dataset.studySubtopic;

    document.dispatchEvent(
      new CustomEvent("solve:prepare-subtopic", {
        detail: {
          subtopicId,
        },
      }),
    );

    document.dispatchEvent(
      new CustomEvent("app:navigate", {
        detail: {
          sectionId: "solve",
        },
      }),
    );
  }

  function handleSubtopicImportAddedDelete(event) {
    const deleteButton = event.target.closest("[data-delete-import-subtopic]");

    if (!deleteButton) {
      return;
    }

    const subtopicId = deleteButton.dataset.deleteImportSubtopic;
    const subtopic = getSubtopics().find((currentSubtopic) => {
      return currentSubtopic.id === subtopicId;
    });

    if (!subtopic) {
      return;
    }

    openConfirmModal({
      tag: "⚠️ Confirmação",
      title: "Excluir assunto",
      message: `Tem certeza que deseja excluir o assunto "${subtopic.name}"?`,
      confirmText: "Excluir",
      cancelText: "Cancelar",
      onConfirm: () => {
        unlinkQuestionsFromSubtopic(subtopic.id);
        deleteSubtopic(subtopic.id);

        setThemeFormMessage("Assunto excluído com sucesso. As questões vinculadas foram mantidas no tema.", "success");

        renderSubtopicImportAddedList();
        renderThemes();
      },
    });
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

    saveCollection(QUESTIONS_COLLECTION, updatedQuestions);

    document.dispatchEvent(new CustomEvent("questions:changed"));
  }

  //-----------------------------------------------------

  themeForm.addEventListener("submit", handleThemeSubmit);
  themeSubjectSelect.addEventListener("change", handleSubjectChange);
  subtopicImportThemeSelect.addEventListener("change", () => {
    clearSubtopicImport();
    renderSubtopicImportAddedList();
  });

  clearThemeFormButton.addEventListener("click", clearThemeForm);
  themesList.addEventListener("click", handleThemeDelete);
  themesList.addEventListener("click", handleSubtopicsToggle);
  themesList.addEventListener("click", handleShowSubtopicForm);
  themesList.addEventListener("click", handleCancelSubtopicForm);
  themesList.addEventListener("submit", handleSubtopicSubmit);
  themesList.addEventListener("click", handleSubtopicDelete);
  themesList.addEventListener("click", handleSubtopicCreateQuestion);
  themesList.addEventListener("click", handleSubtopicStudy);

  themeImportAddedList.addEventListener("click", handleThemeDelete);
  validateThemeImportButton.addEventListener("click", validateThemeImport);
  clearThemeImportButton.addEventListener("click", clearThemeImport);
  importValidatedThemesButton.addEventListener("click", importValidatedThemes);
  validateSubtopicImportButton.addEventListener("click", validateSubtopicImport);
  clearSubtopicImportButton.addEventListener("click", clearSubtopicImport);
  importValidatedSubtopicsButton.addEventListener("click", importValidatedSubtopics);
  subtopicImportAddedList.addEventListener("click", handleSubtopicImportAddedDelete);

  document.addEventListener("questions:changed", renderThemes);
  document.addEventListener("subjects:changed", renderSubjectOptions);
  document.addEventListener("themes:prepare-create", handleExternalThemeCreate);
  document.addEventListener("subtopics:changed", () => {
    renderSubtopicImportAddedList();
    renderThemes();
  });

  themeTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showThemeTab(button.dataset.themeTab);
    });
  });

  renderSubjectOptions();
  showThemeTab("list");

  console.log("Sistema de temas carregado.");
}

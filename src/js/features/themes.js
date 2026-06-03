import {getCollection, saveCollection} from '../core/storage.js';
import {openConfirmModal} from '../ui/confirmModal.js';
import {compareNames, parseItemsFromListText} from '../systems/listTextImport.js';
import {removeQuestionsAndRelatedDataByThemeIds} from '../systems/dataIntegrity.js';

const SUBJECTS_COLLECTION = 'subjects';
const THEMES_COLLECTION = 'themes';
const QUESTIONS_COLLECTION = 'questions';

export function initThemes() {
	const themeForm = document.querySelector('#theme-form');
	const themeSubjectSelect = document.querySelector('#theme-subject');
	const themeNameInput = document.querySelector('#theme-name');
	const themeDescriptionInput = document.querySelector('#theme-description');
	const clearThemeFormButton = document.querySelector('#clear-theme-form');
	const themeFormMessage = document.querySelector('#theme-form-message');
	const themeNoSubjectWarning = document.querySelector('#theme-no-subject-warning');
	const themesCurrentSubject = document.querySelector('#themes-current-subject');
	const themesCount = document.querySelector('#themes-count');
	const themesEmptyState = document.querySelector('#themes-empty-state');
	const themesList = document.querySelector('#themes-list');
	const themeTabButtons = document.querySelectorAll('[data-theme-tab]');
	const themeListTab = document.querySelector('#theme-list-tab');
	const themeImportTab = document.querySelector('#theme-import-tab');
	const themeImportAddedList = document.querySelector('#theme-import-added-list');
	const themeImportAddedCount = document.querySelector('#theme-import-added-count');
	const themeImportAddedEmpty = document.querySelector('#theme-import-added-empty');
	const themeImportTextInput = document.querySelector('#theme-import-text');
	const validateThemeImportButton = document.querySelector('#validate-theme-import');
	const clearThemeImportButton = document.querySelector('#clear-theme-import');
	const importValidatedThemesButton = document.querySelector('#import-validated-themes');
	const themeImportSummary = document.querySelector('#theme-import-summary');
	const themeImportList = document.querySelector('#theme-import-list');
	const themeImportErrors = document.querySelector('#theme-import-errors');

	if (
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
		return total === 1 ? '1 questão cadastrada' : `${total} questões cadastradas`;
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
			createdAt: new Date().toISOString()
		};
	}

	function notifyThemesChanged() {
		document.dispatchEvent(new CustomEvent('themes:changed'));
	}

	function formatDate(dateValue) {
		const date = new Date(dateValue);

		return date.toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	function formatCount(total, singular, plural) {
		return total === 1 ? `1 ${singular}` : `${total} ${plural}`;
	}

	function escapeHTML(value) {
		return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
	}

	function setThemeFormMessage(message, type = 'default') {
		themeFormMessage.textContent = message;

		themeFormMessage.classList.remove('is-error', 'is-success');

		if (type === 'error') {
			themeFormMessage.classList.add('is-error');
		}

		if (type === 'success') {
			themeFormMessage.classList.add('is-success');
		}
	}

	function updateThemesCount(themes) {
		const totalThemes = themes.length;

		themesCount.textContent = totalThemes === 1 ? '1 tema' : `${totalThemes} temas`;
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

	function renderThemes() {
		const selectedSubject = getSelectedSubject();
		const selectedSubjectThemes = getThemesFromSelectedSubject();

		themesList.innerHTML = '';

		updateThemesCount(selectedSubjectThemes);
		renderThemeImportAddedList(selectedSubjectThemes);

		if (!selectedSubject) {
			themesCurrentSubject.textContent = 'Selecione uma matéria para visualizar seus temas.';

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
			const themeCard = document.createElement('article');

			themeCard.classList.add('theme-card');
			themeCard.dataset.themeId = theme.id;

			const questionsCount = getThemeQuestionsCount(theme.id);

			themeCard.innerHTML = `
        <div class="theme-card__content">
          <strong>${escapeHTML(theme.name)}</strong>

          <span>${escapeHTML(theme.description || 'Sem descrição adicionada.')}</span>

          <span class="theme-card__questions-count ${questionsCount === 0 ? 'is-empty' : ''}">
            ${formatThemeQuestionsCount(questionsCount)}
          </span>

          <small>Criado em ${formatDate(theme.createdAt)}</small>
        </div>

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
			const option = document.createElement('option');

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
			themeSubjectSelect.value = '';
			themesCurrentSubject.textContent = 'Cadastre uma matéria antes de criar temas.';

			themesCount.textContent = '0 temas';

			themesEmptyState.hidden = false;
			themesEmptyState.innerHTML = `
        <strong>Nenhuma matéria disponível.</strong>
        <span>Cadastre uma matéria antes de criar temas.</span>
      `;

			themesList.innerHTML = '';

			return;
		}

		if (selectedSubjectStillExists) {
			themeSubjectSelect.value = previousSelectedSubjectId;
		} else {
			themeSubjectSelect.value = '';
		}

		renderThemes();
	}

	function clearThemeForm() {
		themeNameInput.value = '';
		themeDescriptionInput.value = '';
		setThemeFormMessage('');
		themeNameInput.focus();
	}

	function handleThemeSubmit(event) {
		event.preventDefault();

		const selectedSubjectId = themeSubjectSelect.value;
		const themeName = themeNameInput.value.trim();
		const themeDescription = themeDescriptionInput.value.trim();

		if (!selectedSubjectId) {
			setThemeFormMessage('Selecione uma matéria antes de cadastrar o tema.', 'error');
			themeSubjectSelect.focus();
			return;
		}

		if (!themeName) {
			setThemeFormMessage('Informe o nome do tema antes de cadastrar.', 'error');
			themeNameInput.focus();
			return;
		}

		const selectedSubjectThemes = getThemesFromSelectedSubject();

		const duplicatedTheme = selectedSubjectThemes.find((theme) => {
			return compareNames(theme.name, themeName);
		});

		if (duplicatedTheme) {
			setThemeFormMessage(`O tema "${duplicatedTheme.name}" já está cadastrado nesta matéria.`, 'error');

			themeNameInput.focus();
			return;
		}

		const themes = getThemes();
		const newTheme = createTheme(selectedSubjectId, themeName, themeDescription);

		themes.push(newTheme);

		saveThemes(themes);
		renderThemes();
		notifyThemesChanged();

		themeNameInput.value = '';
		themeDescriptionInput.value = '';
		themeNameInput.focus();

		setThemeFormMessage('Tema cadastrado com sucesso.', 'success');
	}

	function handleThemeDelete(event) {
		const deleteButton = event.target.closest('[data-delete-theme]');

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
			tag: '⚠️ Confirmação',
			title: 'Excluir tema',
			message: `Tem certeza que deseja excluir o tema "${theme.name}"?`,
			confirmText: 'Excluir',
			cancelText: 'Cancelar',
			onConfirm: () => {
				deleteTheme(theme.id);
			}
		});
	}

	function deleteTheme(themeId) {
		const updatedThemes = getThemes().filter((theme) => {
			return theme.id !== themeId;
		});

		saveThemes(updatedThemes);
		removeQuestionsAndRelatedDataByThemeIds([themeId]);

		renderThemes();
		notifyThemesChanged();

		setThemeFormMessage('Tema e questões relacionadas excluídos com sucesso.', 'success');
	}

	function handleSubjectChange() {
		setThemeFormMessage('');
		clearThemeImport();
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

		setThemeFormMessage('Cadastre um tema para completar esta matéria.', 'success');
	}

	function showThemeTab(tabName) {
		themeTabButtons.forEach((button) => {
			const isActive = button.dataset.themeTab === tabName;

			button.classList.toggle('is-active', isActive);
		});

		themeListTab.classList.toggle('is-active', tabName === 'list');
		themeImportTab.classList.toggle('is-active', tabName === 'import');
	}

	function renderThemeImportAddedList(themes) {
		themeImportAddedList.innerHTML = '';

		themeImportAddedCount.textContent = formatCount(themes.length, 'tema', 'temas');

		if (themes.length === 0) {
			themeImportAddedEmpty.hidden = false;
			return;
		}

		themeImportAddedEmpty.hidden = true;

		themes.forEach((theme) => {
			const item = document.createElement('li');

			item.classList.add('theme-import-added-item');

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

	function setThemeImportSummary({title = 'Aguardando validação.', description = 'Selecione uma matéria, cole a lista e clique em Validar temas.', type = 'default'} = {}) {
		themeImportSummary.innerHTML = `
    <strong>${escapeHTML(title)}</strong>
    <span>${escapeHTML(description)}</span>
  `;

		themeImportSummary.classList.remove('is-success', 'is-error');

		if (type === 'success') {
			themeImportSummary.classList.add('is-success');
		}

		if (type === 'error') {
			themeImportSummary.classList.add('is-error');
		}
	}

	function renderThemeImportList(items = []) {
		themeImportList.innerHTML = '';

		items.forEach((item) => {
			const listItem = document.createElement('li');

			listItem.textContent = item;

			themeImportList.appendChild(listItem);
		});
	}

	function renderThemeImportErrors(errors = []) {
		themeImportErrors.innerHTML = '';

		errors.forEach((error) => {
			const errorItem = document.createElement('li');

			errorItem.textContent = error;

			themeImportErrors.appendChild(errorItem);
		});
	}

	function clearThemeImport() {
		importedThemesPreview = [];

		themeImportTextInput.value = '';
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
				title: 'Matéria não selecionada.',
				description: 'Selecione uma matéria antes de validar a importação.',
				type: 'error'
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
				title: 'Nenhum tema novo encontrado.',
				description: `${formatCount(errors.length, 'aviso encontrado', 'avisos encontrados')}. Ajuste a lista e valide novamente.`,
				type: 'error'
			});

			return;
		}

		if (validThemes.length > 0 && errors.length > 0) {
			setThemeImportSummary({
				title: `${formatCount(validThemes.length, 'tema pronto', 'temas prontos')} para importação.`,
				description: `${formatCount(errors.length, 'item será ignorado', 'itens serão ignorados')} por repetição ou duplicidade.`,
				type: 'success'
			});

			return;
		}

		setThemeImportSummary({
			title: `${formatCount(validThemes.length, 'tema pronto', 'temas prontos')} para importação.`,
			description: 'Nenhum problema encontrado. Você já pode importar os temas.',
			type: 'success'
		});
	}

	function importValidatedThemes() {
		const selectedSubjectId = themeSubjectSelect.value;

		if (!selectedSubjectId) {
			setThemeImportSummary({
				title: 'Matéria não selecionada.',
				description: 'Selecione uma matéria antes de importar os temas.',
				type: 'error'
			});

			return;
		}

		if (importedThemesPreview.length === 0) {
			setThemeImportSummary({
				title: 'Nenhum tema validado.',
				description: 'Valide uma lista antes de importar.',
				type: 'error'
			});

			return;
		}

		const themes = getThemes();

		const newThemes = importedThemesPreview.map((themeName) => {
			return createTheme(selectedSubjectId, themeName, '');
		});

		saveThemes([...themes, ...newThemes]);
		notifyThemesChanged();

		importedThemesPreview = [];
		themeImportTextInput.value = '';
		importValidatedThemesButton.disabled = true;

		setThemeImportSummary({
			title: `${formatCount(newThemes.length, 'tema importado', 'temas importados')} com sucesso.`,
			description: 'Os temas foram adicionados à matéria selecionada.',
			type: 'success'
		});

		renderThemeImportList();
		renderThemeImportErrors();
		renderThemes();

		showThemeTab('list');
	}

	//-----------------------------------------------------

	themeForm.addEventListener('submit', handleThemeSubmit);
	themeSubjectSelect.addEventListener('change', handleSubjectChange);
	clearThemeFormButton.addEventListener('click', clearThemeForm);
	themesList.addEventListener('click', handleThemeDelete);
	themeImportAddedList.addEventListener('click', handleThemeDelete);

	validateThemeImportButton.addEventListener('click', validateThemeImport);
	clearThemeImportButton.addEventListener('click', clearThemeImport);
	importValidatedThemesButton.addEventListener('click', importValidatedThemes);

	document.addEventListener('questions:changed', renderThemes);
	document.addEventListener('subjects:changed', renderSubjectOptions);
	document.addEventListener('themes:prepare-create', handleExternalThemeCreate);
	themeTabButtons.forEach((button) => {
		button.addEventListener('click', () => {
			showThemeTab(button.dataset.themeTab);
		});
	});

	renderSubjectOptions();
	showThemeTab('list');

	console.log('Sistema de temas carregado.');
}

import { getCollection, saveCollection } from '../core/storage.js';
import { openConfirmModal } from '../ui/confirmModal.js';

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
	const themeNoSubjectWarning = document.querySelector(
		'#theme-no-subject-warning',
	);
	const themesCurrentSubject = document.querySelector(
		'#themes-current-subject',
	);
	const themesCount = document.querySelector('#themes-count');
	const themesEmptyState = document.querySelector('#themes-empty-state');
	const themesList = document.querySelector('#themes-list');
	const dashboardThemesCount = document.querySelector(
		'#dashboard-themes-count',
	);

	if (
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
		!themesList ||
		!dashboardThemesCount
	) {
		return;
	}

	function getSubjects() {
		return getCollection(SUBJECTS_COLLECTION);
	}

	function getThemes() {
		return getCollection(THEMES_COLLECTION);
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
		document.dispatchEvent(new CustomEvent('themes:changed'));
	}

	function formatDate(dateValue) {
		const date = new Date(dateValue);

		return date.toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	function escapeHTML(value) {
		return value
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#039;');
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

	function deleteQuestionsFromTheme(themeId) {
		const updatedQuestions = getCollection(QUESTIONS_COLLECTION).filter(
			(question) => {
				return question.themeId !== themeId;
			},
		);

		saveCollection(QUESTIONS_COLLECTION, updatedQuestions);
	}

	function updateDashboardThemesCount() {
		const totalThemes = getThemes().length;

		dashboardThemesCount.textContent = totalThemes;
	}

	function updateThemesCount(themes) {
		const totalThemes = themes.length;

		themesCount.textContent =
			totalThemes === 1 ? '1 tema' : `${totalThemes} temas`;
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

		updateDashboardThemesCount();
		updateThemesCount(selectedSubjectThemes);

		if (!selectedSubject) {
			themesCurrentSubject.textContent =
				'Selecione uma matéria para visualizar seus temas.';

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

			themeCard.innerHTML = `
        <div class="theme-card__content">
          <h3>${escapeHTML(theme.name)}</h3>
          <p>${escapeHTML(theme.description || 'Sem descrição adicionada.')}</p>
          <span class="theme-card__date">
            Criado em ${formatDate(theme.createdAt)}
          </span>
        </div>

        <div class="theme-card__actions">
          <button
            class="button button--danger"
            type="button"
            data-delete-theme="${theme.id}"
          >
            Excluir
          </button>
        </div>
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
			themesCurrentSubject.textContent =
				'Cadastre uma matéria antes de criar temas.';

			themesCount.textContent = '0 temas';
			updateDashboardThemesCount();

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
			setThemeFormMessage(
				'Selecione uma matéria antes de cadastrar o tema.',
				'error',
			);
			themeSubjectSelect.focus();
			return;
		}

		if (!themeName) {
			setThemeFormMessage(
				'Informe o nome do tema antes de cadastrar.',
				'error',
			);
			themeNameInput.focus();
			return;
		}

		const themes = getThemes();
		const newTheme = createTheme(
			selectedSubjectId,
			themeName,
			themeDescription,
		);

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
			},
		});
	}

	function deleteTheme(themeId) {
		const updatedThemes = getThemes().filter((theme) => {
			return theme.id !== themeId;
		});

		deleteQuestionsFromTheme(themeId);
		saveThemes(updatedThemes);
		renderThemes();
		notifyThemesChanged();

		setThemeFormMessage(
			'Tema e questões relacionadas excluídos com sucesso.',
			'success',
		);
	}

	function handleSubjectChange() {
		setThemeFormMessage('');
		renderThemes();
	}

	themeForm.addEventListener('submit', handleThemeSubmit);
	themeSubjectSelect.addEventListener('change', handleSubjectChange);
	clearThemeFormButton.addEventListener('click', clearThemeForm);
	themesList.addEventListener('click', handleThemeDelete);
	document.addEventListener('subjects:changed', renderSubjectOptions);
	document.addEventListener('themes:changed', updateDashboardThemesCount);

	renderSubjectOptions();
	updateDashboardThemesCount();

	console.log('Sistema de temas carregado.');
}

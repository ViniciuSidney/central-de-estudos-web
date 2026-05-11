import { getCollection } from '../core/storage.js';

const SUBJECTS_COLLECTION = 'subjects';
const THEMES_COLLECTION = 'themes';
const QUESTIONS_COLLECTION = 'questions';

export function initQuestions() {
	const questionForm = document.querySelector('#question-form');
	const questionSubjectSelect = document.querySelector('#question-subject');
	const questionThemeSelect = document.querySelector('#question-theme');
	const questionStatementInput = document.querySelector('#question-statement');
	const alternativeAInput = document.querySelector('#alternative-a');
	const alternativeBInput = document.querySelector('#alternative-b');
	const alternativeCInput = document.querySelector('#alternative-c');
	const alternativeDInput = document.querySelector('#alternative-d');
	const alternativeEInput = document.querySelector('#alternative-e');
	const correctAlternativeSelect = document.querySelector(
		'#correct-alternative',
	);
	const questionExplanationInput = document.querySelector(
		'#question-explanation',
	);
	const clearQuestionFormButton = document.querySelector(
		'#clear-question-form',
	);
	const questionFormMessage = document.querySelector('#question-form-message');
	const questionNoSubjectWarning = document.querySelector(
		'#question-no-subject-warning',
	);
	const questionNoThemeWarning = document.querySelector(
		'#question-no-theme-warning',
	);
	const questionsCurrentTheme = document.querySelector(
		'#questions-current-theme',
	);
	const questionsCount = document.querySelector('#questions-count');
	const questionsEmptyState = document.querySelector('#questions-empty-state');
	const questionsList = document.querySelector('#questions-list');
	const dashboardQuestionsCount = document.querySelector(
		'#dashboard-questions-count',
	);

	if (
		!questionForm ||
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
		!questionsList ||
		!dashboardQuestionsCount
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

	function escapeHTML(value) {
		return value
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#039;');
	}

	function setQuestionFormMessage(message, type = 'default') {
		questionFormMessage.textContent = message;

		questionFormMessage.classList.remove('is-error', 'is-success');

		if (type === 'error') {
			questionFormMessage.classList.add('is-error');
		}

		if (type === 'success') {
			questionFormMessage.classList.add('is-success');
		}
	}

	function updateDashboardQuestionsCount() {
		dashboardQuestionsCount.textContent = getQuestions().length;
	}

	function updateQuestionsCount(questions) {
		const totalQuestions = questions.length;

		questionsCount.textContent =
			totalQuestions === 1 ? '1 questão' : `${totalQuestions} questões`;
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

	function renderSubjectOptions() {
		const subjects = getSubjects();
		const previousSelectedSubjectId = questionSubjectSelect.value;

		questionSubjectSelect.innerHTML = `
      <option value="">Selecione uma matéria</option>
    `;

		subjects.forEach((subject) => {
			const option = document.createElement('option');

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
			questionForm.hidden = true;
			questionThemeSelect.innerHTML = `
        <option value="">Selecione um tema</option>
      `;
			questionNoThemeWarning.hidden = true;

			questionsCurrentTheme.textContent =
				'Cadastre uma matéria antes de criar questões.';

			updateQuestionsCount([]);
			updateDashboardQuestionsCount();

			questionsEmptyState.hidden = false;
			questionsEmptyState.innerHTML = `
        <strong>Nenhuma matéria disponível.</strong>
        <span>Cadastre uma matéria antes de criar questões.</span>
      `;

			questionsList.innerHTML = '';
			return;
		}

		questionForm.hidden = false;

		if (selectedSubjectStillExists) {
			questionSubjectSelect.value = previousSelectedSubjectId;
		} else {
			questionSubjectSelect.value = '';
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
			renderQuestions();
			return;
		}

		themesFromSubject.forEach((theme) => {
			const option = document.createElement('option');

			option.value = theme.id;
			option.textContent = theme.name;

			questionThemeSelect.appendChild(option);
		});

		const hasThemes = themesFromSubject.length > 0;
		const selectedThemeStillExists = themesFromSubject.some((theme) => {
			return theme.id === previousSelectedThemeId;
		});

		questionNoThemeWarning.hidden = hasThemes;

		if (selectedThemeStillExists) {
			questionThemeSelect.value = previousSelectedThemeId;
		} else {
			questionThemeSelect.value = '';
		}

		renderQuestions();
	}

	function renderQuestions() {
		const selectedSubject = getSelectedSubject();
		const selectedTheme = getSelectedTheme();
		const questionsFromTheme = getQuestionsFromSelectedTheme();

		questionsList.innerHTML = '';

		updateDashboardQuestionsCount();
		updateQuestionsCount(questionsFromTheme);

		if (!selectedSubject) {
			questionsCurrentTheme.textContent =
				'Selecione uma matéria para carregar os temas.';

			questionsEmptyState.hidden = false;
			questionsEmptyState.innerHTML = `
        <strong>Nenhuma matéria selecionada.</strong>
        <span>Escolha uma matéria para visualizar os temas disponíveis.</span>
      `;

			return;
		}

		if (!selectedTheme) {
			questionsCurrentTheme.textContent =
				'Selecione um tema para visualizar suas questões.';

			questionsEmptyState.hidden = false;
			questionsEmptyState.innerHTML = `
        <strong>Nenhum tema selecionado.</strong>
        <span>Escolha um tema para visualizar ou cadastrar questões.</span>
      `;

			return;
		}

		questionsCurrentTheme.innerHTML = `
      Questões de <strong class="highlighted-theme-name">${escapeHTML(selectedTheme.name)}</strong>
    `;

		if (questionsFromTheme.length === 0) {
			questionsEmptyState.hidden = false;
			questionsEmptyState.innerHTML = `
        <strong>Nenhuma questão cadastrada ainda.</strong>
        <span>Use o formulário acima para adicionar a primeira questão deste tema.</span>
      `;

			return;
		}

		questionsEmptyState.hidden = true;

		questionsFromTheme.forEach((question, index) => {
			const questionCard = document.createElement('article');

			questionCard.classList.add('question-card');
			questionCard.dataset.questionId = question.id;

			questionCard.innerHTML = `
        <div class="question-card__content">
          <h3>Questão ${String(index + 1).padStart(2, '0')}</h3>
          <p>${escapeHTML(question.statement || 'Enunciado da questão.')}</p>

          <div class="question-card__meta">
            <span>Correta: ${escapeHTML(question.correctAlternative || '-')}</span>
            <span>Cadastro em breve</span>
          </div>
        </div>

        <div class="question-card__actions">
          <button class="button button--secondary" type="button" disabled>
            Resolver em breve
          </button>
        </div>
      `;

			questionsList.appendChild(questionCard);
		});
	}

	function clearQuestionForm() {
		questionStatementInput.value = '';
		alternativeAInput.value = '';
		alternativeBInput.value = '';
		alternativeCInput.value = '';
		alternativeDInput.value = '';
		alternativeEInput.value = '';
		correctAlternativeSelect.value = '';
		questionExplanationInput.value = '';
		setQuestionFormMessage('');
		questionStatementInput.focus();
	}

	function handleQuestionSubmit(event) {
		event.preventDefault();

		setQuestionFormMessage(
			'O cadastro real de questões será implementado na próxima etapa.',
			'success',
		);
	}

	function handleSubjectChange() {
		setQuestionFormMessage('');
		questionThemeSelect.value = '';
		renderThemeOptions();
	}

	function handleThemeChange() {
		setQuestionFormMessage('');
		renderQuestions();
	}

	questionForm.addEventListener('submit', handleQuestionSubmit);
	questionSubjectSelect.addEventListener('change', handleSubjectChange);
	questionThemeSelect.addEventListener('change', handleThemeChange);
	clearQuestionFormButton.addEventListener('click', clearQuestionForm);

	document.addEventListener('subjects:changed', renderSubjectOptions);
	document.addEventListener('themes:changed', renderThemeOptions);

	renderSubjectOptions();
	updateDashboardQuestionsCount();

	console.log('Sistema de questões carregado.');
}

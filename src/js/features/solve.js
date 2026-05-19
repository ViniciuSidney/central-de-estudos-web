import {getCollection} from '../core/storage.js';

const SUBJECTS_COLLECTION = 'subjects';
const THEMES_COLLECTION = 'themes';
const QUESTIONS_COLLECTION = 'questions';

export function initSolve() {
	const solveSubjectSelect = document.querySelector('#solve-subject');
	const solveThemeSelect = document.querySelector('#solve-theme');
	const solveQuestionSelect = document.querySelector('#solve-question');
	const solveNoQuestionWarning = document.querySelector('#solve-no-question-warning');
	const solveFilters = document.querySelector('#solve-filters');
	const solveEmptyState = document.querySelector('#solve-empty-state');
	const solveCard = document.querySelector('#solve-card');
	const solveQuestionContext = document.querySelector('#solve-question-context');
	const solveQuestionStatus = document.querySelector('#solve-question-status');
	const solveQuestionStatement = document.querySelector('#solve-question-statement');
	const solveAlternatives = document.querySelector('#solve-alternatives');
	const confirmAnswerButton = document.querySelector('#confirm-answer');
	const nextQuestionButton = document.querySelector('#next-question');
	const solveFeedback = document.querySelector('#solve-feedback');

	if (
		!solveSubjectSelect ||
		!solveThemeSelect ||
		!solveQuestionSelect ||
		!solveNoQuestionWarning ||
		!solveFilters ||
		!solveEmptyState ||
		!solveCard ||
		!solveQuestionContext ||
		!solveQuestionStatus ||
		!solveQuestionStatement ||
		!solveAlternatives ||
		!confirmAnswerButton ||
		!nextQuestionButton ||
		!solveFeedback
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

	function getSelectedSubject() {
		const selectedSubjectId = solveSubjectSelect.value;

		return getSubjects().find((subject) => {
			return subject.id === selectedSubjectId;
		});
	}

	function getSelectedTheme() {
		const selectedThemeId = solveThemeSelect.value;

		return getThemes().find((theme) => {
			return theme.id === selectedThemeId;
		});
	}

	function getSelectedQuestion() {
		const selectedQuestionId = solveQuestionSelect.value;

		return getQuestions().find((question) => {
			return question.id === selectedQuestionId;
		});
	}

	function getThemesFromSelectedSubject() {
		const selectedSubject = getSelectedSubject();

		if (!selectedSubject) {
			return [];
		}

		return getThemes().filter((theme) => {
			return theme.subjectId === selectedSubject.id;
		});
	}

	function getQuestionsFromSelectedTheme() {
		const selectedTheme = getSelectedTheme();

		if (!selectedTheme) {
			return [];
		}

		return getQuestions().filter((question) => {
			return question.themeId === selectedTheme.id;
		});
	}

	function escapeHTML(value) {
		return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
	}

	function resetSolveCard() {
		solveCard.hidden = true;
		solveEmptyState.hidden = false;
		solveAlternatives.innerHTML = '';
		solveQuestionStatement.textContent = '';
		solveQuestionStatus.textContent = 'Aguardando resposta';
		solveFeedback.hidden = true;
		solveFeedback.innerHTML = '';
		confirmAnswerButton.disabled = false;
		nextQuestionButton.disabled = true;
	}

	function renderSubjectOptions() {
		const subjects = getSubjects();
		const hasQuestions = getQuestions().length > 0;

		solveSubjectSelect.innerHTML = `
      <option value="">Selecione uma matéria</option>
    `;

		subjects.forEach((subject) => {
			const option = document.createElement('option');

			option.value = subject.id;
			option.textContent = subject.name;

			solveSubjectSelect.appendChild(option);
		});

		solveNoQuestionWarning.hidden = hasQuestions;
		solveFilters.hidden = !hasQuestions;

		if (!hasQuestions) {
			resetSolveCard();
			return;
		}

		renderThemeOptions();
	}

	function renderThemeOptions() {
		const themes = getThemesFromSelectedSubject();

		solveThemeSelect.innerHTML = `
      <option value="">Selecione um tema</option>
    `;

		themes.forEach((theme) => {
			const option = document.createElement('option');

			option.value = theme.id;
			option.textContent = theme.name;

			solveThemeSelect.appendChild(option);
		});

		renderQuestionOptions();
	}

	function renderQuestionOptions() {
		const questions = getQuestionsFromSelectedTheme();

		solveQuestionSelect.innerHTML = `
      <option value="">Selecione uma questão</option>
    `;

		questions.forEach((question, index) => {
			const option = document.createElement('option');

			option.value = question.id;
			option.textContent = `Questão ${String(index + 1).padStart(2, '0')}`;

			solveQuestionSelect.appendChild(option);
		});

		resetSolveCard();
	}

	function renderSelectedQuestion() {
		const selectedSubject = getSelectedSubject();
		const selectedTheme = getSelectedTheme();
		const selectedQuestion = getSelectedQuestion();

		if (!selectedSubject || !selectedTheme || !selectedQuestion) {
			resetSolveCard();
			return;
		}

		solveEmptyState.hidden = true;
		solveCard.hidden = false;

		solveQuestionContext.textContent = `${selectedSubject.name} • ${selectedTheme.name}`;

		solveQuestionStatus.textContent = 'Aguardando resposta';
		solveQuestionStatement.textContent = selectedQuestion.statement;

		solveAlternatives.innerHTML = '';

		Object.entries(selectedQuestion.alternatives).forEach(([letter, text]) => {
			if (!text) {
				return;
			}

			const alternativeButton = document.createElement('button');

			alternativeButton.classList.add('solve-alternative');
			alternativeButton.type = 'button';
			alternativeButton.dataset.alternative = letter;
			alternativeButton.innerHTML = `
        <strong>${escapeHTML(letter)})</strong> ${escapeHTML(text)}
      `;

			alternativeButton.addEventListener('click', () => {
				document.querySelectorAll('.solve-alternative').forEach((button) => {
					button.classList.remove('is-selected');
				});

				alternativeButton.classList.add('is-selected');
			});

			solveAlternatives.appendChild(alternativeButton);
		});

		solveFeedback.hidden = true;
		solveFeedback.innerHTML = '';
		confirmAnswerButton.disabled = false;
		nextQuestionButton.disabled = true;
	}

	solveSubjectSelect.addEventListener('change', () => {
		solveThemeSelect.value = '';
		solveQuestionSelect.value = '';
		renderThemeOptions();
	});

	solveThemeSelect.addEventListener('change', () => {
		solveQuestionSelect.value = '';
		renderQuestionOptions();
	});

	solveQuestionSelect.addEventListener('change', renderSelectedQuestion);

	document.addEventListener('subjects:changed', renderSubjectOptions);
	document.addEventListener('themes:changed', renderSubjectOptions);

	renderSubjectOptions();

	console.log('Modo de resolução carregado.');
}

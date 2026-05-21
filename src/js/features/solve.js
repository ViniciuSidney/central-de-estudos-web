import {getCollection, saveCollection} from '../core/storage.js';

const SUBJECTS_COLLECTION = 'subjects';
const THEMES_COLLECTION = 'themes';
const QUESTIONS_COLLECTION = 'questions';
const ATTEMPTS_COLLECTION = 'attempts';

const VISUAL_ALTERNATIVE_LABELS = ['A', 'B', 'C', 'D', 'E'];

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
	const retryQuestionButton = document.querySelector('#retry-question');
	const solveHistoryCount = document.querySelector('#solve-history-count');
	const solveHistoryEmpty = document.querySelector('#solve-history-empty');
	const solveHistoryList = document.querySelector('#solve-history-list');

	if (
		!solveHistoryCount ||
		!solveHistoryEmpty ||
		!solveHistoryList ||
		!retryQuestionButton ||
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

	let selectedOriginalAlternative = null;
	let selectedVisualAlternative = null;
	let hasAnsweredCurrentQuestion = false;

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

	function saveAttempts(attempts) {
		saveCollection(ATTEMPTS_COLLECTION, attempts);
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

		return date.toLocaleString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getQuestionIndexWithinTheme(question) {
		const questionsFromTheme = getQuestions().filter((currentQuestion) => {
			return currentQuestion.themeId === question.themeId;
		});

		const questionIndex = questionsFromTheme.findIndex((currentQuestion) => {
			return currentQuestion.id === question.id;
		});

		return questionIndex === -1 ? '-' : String(questionIndex + 1).padStart(2, '0');
	}

	function renderSolveHistory() {
		const allAttempts = getAttempts().sort((firstAttempt, secondAttempt) => {
			return new Date(secondAttempt.answeredAt) - new Date(firstAttempt.answeredAt);
		});

		const recentAttempts = allAttempts.slice(0, 3);

		solveHistoryList.innerHTML = '';

		solveHistoryCount.textContent = allAttempts.length === 1 ? '1 registro' : `${allAttempts.length} registros`;

		if (allAttempts.length === 0) {
			solveHistoryEmpty.hidden = false;
			return;
		}

		solveHistoryEmpty.hidden = true;

		recentAttempts.forEach((attempt) => {
			const subject = getSubjectById(attempt.subjectId);
			const theme = getThemeById(attempt.themeId);
			const question = getQuestionById(attempt.questionId);

			const subjectName = subject ? subject.name : 'Matéria removida';
			const themeName = theme ? theme.name : 'Tema removido';
			const questionNumber = question ? getQuestionIndexWithinTheme(question) : '-';

			const attemptCard = document.createElement('article');

			attemptCard.classList.add('review-card');

			attemptCard.innerHTML = `
				<div class="review-card__content">
				<strong>Questão ${escapeHTML(questionNumber)}</strong>
				<span>${escapeHTML(subjectName)} • ${escapeHTML(themeName)}</span>
				<span>Resolvida em ${escapeHTML(formatDateTime(attempt.answeredAt))}</span>
				</div>

				<span class="review-card__status ${attempt.isCorrect ? 'is-correct' : 'is-wrong'}">
				${attempt.isCorrect ? 'Acertou' : 'Errou'}
				</span>
			`;

			solveHistoryList.appendChild(attemptCard);
		});
	}

	function escapeHTML(value) {
		return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
	}

	function shuffleArray(items) {
		const shuffledItems = [...items];

		for (let index = shuffledItems.length - 1; index > 0; index--) {
			const randomIndex = Math.floor(Math.random() * (index + 1));

			const currentItem = shuffledItems[index];
			shuffledItems[index] = shuffledItems[randomIndex];
			shuffledItems[randomIndex] = currentItem;
		}

		return shuffledItems;
	}

	function getRenderableAlternatives(question) {
		const alternatives = Object.entries(question.alternatives)
			.filter(([, text]) => {
				return text.trim() !== '';
			})
			.map(([originalLetter, text]) => {
				return {
					originalLetter,
					text
				};
			});

		if (question.shouldShuffleAlternatives) {
			return shuffleArray(alternatives);
		}

		return alternatives;
	}

	function createAttempt({question, selectedOriginalAlternative, selectedVisualAlternative, correctVisualAlternative, isCorrect}) {
		return {
			id: crypto.randomUUID(),
			questionId: question.id,
			subjectId: question.subjectId,
			themeId: question.themeId,
			selectedOriginalAlternative,
			selectedVisualAlternative,
			correctAlternative: question.correctAlternative,
			correctVisualAlternative,
			isCorrect,
			answeredAt: new Date().toISOString()
		};
	}

	function saveAttempt(attempt) {
		const attempts = getAttempts();

		attempts.push(attempt);

		saveAttempts(attempts);
		document.dispatchEvent(new CustomEvent('attempts:changed'));

		renderSolveHistory();
	}

	function resetSelectedAlternative() {
		selectedOriginalAlternative = null;
		selectedVisualAlternative = null;

		document.querySelectorAll('.solve-alternative').forEach((button) => {
			button.classList.remove('is-selected');
		});
	}

	function resetSolveCard() {
		selectedOriginalAlternative = null;
		selectedVisualAlternative = null;
		hasAnsweredCurrentQuestion = false;

		solveCard.hidden = true;
		solveEmptyState.hidden = false;
		solveAlternatives.innerHTML = '';
		solveQuestionStatement.textContent = '';
		solveQuestionStatus.textContent = 'Aguardando resposta';
		solveQuestionStatus.className = '';
		solveFeedback.hidden = true;
		solveFeedback.className = 'solve-feedback';
		solveFeedback.innerHTML = '';
		confirmAnswerButton.disabled = false;
		retryQuestionButton.disabled = true;
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

		updateNextQuestionButtonText();
		resetSolveCard();
	}

	function renderAlternativeButtons(question) {
		const renderableAlternatives = getRenderableAlternatives(question);

		solveAlternatives.innerHTML = '';

		renderableAlternatives.forEach((alternative, index) => {
			const visualLetter = VISUAL_ALTERNATIVE_LABELS[index];
			const alternativeButton = document.createElement('button');

			alternativeButton.classList.add('solve-alternative');
			alternativeButton.type = 'button';

			alternativeButton.dataset.originalAlternative = alternative.originalLetter;
			alternativeButton.dataset.visualAlternative = visualLetter;

			alternativeButton.innerHTML = `
        <strong>${escapeHTML(visualLetter)})</strong> ${escapeHTML(alternative.text)}
      `;

			alternativeButton.addEventListener('click', () => {
				if (hasAnsweredCurrentQuestion) {
					return;
				}

				resetSelectedAlternative();

				selectedOriginalAlternative = alternative.originalLetter;
				selectedVisualAlternative = visualLetter;

				alternativeButton.classList.add('is-selected');
			});

			solveAlternatives.appendChild(alternativeButton);
		});
	}

	function renderSelectedQuestion() {
		const selectedSubject = getSelectedSubject();
		const selectedTheme = getSelectedTheme();
		const selectedQuestion = getSelectedQuestion();

		if (!selectedSubject || !selectedTheme || !selectedQuestion) {
			resetSolveCard();
			return;
		}

		selectedOriginalAlternative = null;
		selectedVisualAlternative = null;
		hasAnsweredCurrentQuestion = false;

		solveEmptyState.hidden = true;
		solveCard.hidden = false;

		solveQuestionContext.textContent = `${selectedSubject.name} • ${selectedTheme.name}`;

		solveQuestionStatus.textContent = 'Aguardando resposta';
		solveQuestionStatus.className = '';
		solveQuestionStatement.textContent = selectedQuestion.statement;

		renderAlternativeButtons(selectedQuestion);

		solveFeedback.hidden = true;
		solveFeedback.className = 'solve-feedback';
		solveFeedback.innerHTML = '';
		confirmAnswerButton.disabled = false;
		retryQuestionButton.disabled = true;
		nextQuestionButton.disabled = true;
	}

	function revealCorrection(question) {
		document.querySelectorAll('.solve-alternative').forEach((button) => {
			const originalAlternative = button.dataset.originalAlternative;

			button.disabled = true;

			if (originalAlternative === question.correctAlternative) {
				button.classList.add('is-correct');
			}

			if (originalAlternative === selectedOriginalAlternative && selectedOriginalAlternative !== question.correctAlternative) {
				button.classList.add('is-wrong');
			}
		});
	}

	function confirmAnswer() {
		const selectedQuestion = getSelectedQuestion();

		if (!selectedQuestion || hasAnsweredCurrentQuestion) {
			return;
		}

		if (!selectedOriginalAlternative) {
			solveFeedback.hidden = false;
			solveFeedback.className = 'solve-feedback is-warning';
			solveFeedback.innerHTML = `
        <strong>Selecione uma alternativa antes de confirmar.</strong>
      `;
			return;
		}

		const isCorrect = selectedOriginalAlternative === selectedQuestion.correctAlternative;

		const correctAlternativeButton = document.querySelector(`[data-original-alternative="${selectedQuestion.correctAlternative}"]`);

		const correctVisualAlternative = correctAlternativeButton?.dataset.visualAlternative || selectedQuestion.correctAlternative;

		const attempt = createAttempt({
			question: selectedQuestion,
			selectedOriginalAlternative,
			selectedVisualAlternative,
			correctVisualAlternative,
			isCorrect
		});

		saveAttempt(attempt);

		hasAnsweredCurrentQuestion = true;

		revealCorrection(selectedQuestion);

		solveQuestionStatus.textContent = isCorrect ? 'Acertou' : 'Errou';
		solveQuestionStatus.className = isCorrect ? 'is-correct' : 'is-wrong';

		solveFeedback.hidden = false;
		solveFeedback.className = isCorrect ? 'solve-feedback is-correct' : 'solve-feedback is-wrong';

		const selectedAlternativeText = selectedQuestion.alternatives[selectedOriginalAlternative];
		const correctAlternativeText = selectedQuestion.alternatives[selectedQuestion.correctAlternative];

		const feedbackTitle = isCorrect ? 'Resposta correta!' : 'Resposta incorreta.';

		solveFeedback.innerHTML = `
		<div class="solve-feedback__header">
			<strong>${feedbackTitle}</strong>
			<span>${isCorrect ? 'Você acertou esta questão.' : 'Compare sua resposta com o gabarito abaixo.'}</span>
		</div>

		<div class="solve-feedback__grid">
			<div class="solve-feedback__item ${isCorrect ? 'is-correct' : 'is-wrong'}">
				<small>Sua resposta</small>
				<strong>
				${escapeHTML(selectedVisualAlternative)}) ${escapeHTML(selectedAlternativeText)}
				</strong>
			</div>

			<div class="solve-feedback__item is-correct">
			<small>Resposta correta</small>
			<strong>
				${escapeHTML(correctVisualAlternative)}) ${escapeHTML(correctAlternativeText)}
			</strong>
			</div>
		</div>

		<div class="solve-feedback__explanation">
			<small>Explicação da Questão</small>
			<p>
				${escapeHTML(selectedQuestion.explanation || 'Nenhuma explicação foi cadastrada para esta questão.')}
			</p>
		</div>
		`;

		confirmAnswerButton.disabled = true;
		retryQuestionButton.disabled = false;
		nextQuestionButton.disabled = false;
	}

	function goToNextQuestion() {
		const questionOptions = Array.from(solveQuestionSelect.options).filter((option) => {
			return option.value !== '';
		});

		if (questionOptions.length === 0) {
			return;
		}

		const currentQuestionIndex = questionOptions.findIndex((option) => {
			return option.value === solveQuestionSelect.value;
		});

		const nextQuestionIndex = currentQuestionIndex === -1 || currentQuestionIndex === questionOptions.length - 1 ? 0 : currentQuestionIndex + 1;

		const nextQuestion = questionOptions[nextQuestionIndex];

		solveQuestionSelect.value = nextQuestion.value;
		renderSelectedQuestion();
	}

	function updateNextQuestionButtonText() {
		const questionOptions = Array.from(solveQuestionSelect.options).filter((option) => {
			return option.value !== '';
		});

		nextQuestionButton.textContent = questionOptions.length === 1 ? 'Recarregar questão' : 'Próxima questão';
	}

	function retryQuestion() {
		const selectedQuestion = getSelectedQuestion();

		if (!selectedQuestion) {
			return;
		}

		selectedOriginalAlternative = null;
		selectedVisualAlternative = null;
		hasAnsweredCurrentQuestion = false;

		solveQuestionStatus.textContent = 'Aguardando resposta';
		solveQuestionStatus.className = '';

		renderAlternativeButtons(selectedQuestion);

		solveFeedback.hidden = true;
		solveFeedback.className = 'solve-feedback';
		solveFeedback.innerHTML = '';

		confirmAnswerButton.disabled = false;
		retryQuestionButton.disabled = true;
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

	confirmAnswerButton.addEventListener('click', confirmAnswer);
	retryQuestionButton.addEventListener('click', retryQuestion);
	nextQuestionButton.addEventListener('click', goToNextQuestion);

	document.addEventListener('subjects:changed', renderSubjectOptions);
	document.addEventListener('themes:changed', renderSubjectOptions);

	document.addEventListener('questions:changed', () => {
		renderSubjectOptions();
		renderSolveHistory();
	});

	document.addEventListener('attempts:changed', renderSolveHistory);

	renderSubjectOptions();
	renderSolveHistory();

	console.log('Modo de resolução carregado.');
}

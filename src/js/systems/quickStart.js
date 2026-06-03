import {getCollection} from '../core/storage.js';

export function initQuickStart() {
	const startStudyButton = document.querySelector('#start-study-button');

	if (!startStudyButton) {
		return;
	}

	function navigateTo(sectionId) {
		document.dispatchEvent(
			new CustomEvent('app:navigate', {
				detail: {
					sectionId
				}
			})
		);
	}

	function openQuestionFormTab() {
		document.dispatchEvent(
			new CustomEvent('questions:set-tab', {
				detail: {
					tabName: 'form'
				}
			})
		);
	}

	function getValidQuestions() {
		const subjects = getCollection('subjects');
		const themes = getCollection('themes');
		const questions = getCollection('questions');

		const subjectIds = new Set(subjects.map((subject) => subject.id));
		const themeIds = new Set(themes.map((theme) => theme.id));

		return questions.filter((question) => {
			return subjectIds.has(question.subjectId) && themeIds.has(question.themeId);
		});
	}

	function pickRandomItem(items) {
		const randomIndex = Math.floor(Math.random() * items.length);

		return items[randomIndex];
	}

	function findThemeWithoutQuestions() {
		const subjects = getCollection('subjects');
		const themes = getCollection('themes');
		const questions = getCollection('questions');

		const subjectIds = new Set(subjects.map((subject) => subject.id));

		return themes.find((theme) => {
			const themeHasValidSubject = subjectIds.has(theme.subjectId);

			const themeHasQuestions = questions.some((question) => {
				return question.themeId === theme.id;
			});

			return themeHasValidSubject && !themeHasQuestions;
		});
	}

	function startStudy() {
		const subjects = getCollection('subjects');
		const themes = getCollection('themes');
		const questions = getValidQuestions();

		if (subjects.length === 0) {
			navigateTo('subjects');
			return;
		}

		if (themes.length === 0) {
			navigateTo('themes');
			return;
		}

		if (questions.length === 0) {
			const emptyTheme = findThemeWithoutQuestions();

			navigateTo('questions');

			window.setTimeout(() => {
				document.dispatchEvent(
					new CustomEvent('questions:prepare-create', {
						detail: {
							subjectId: emptyTheme?.subjectId || '',
							themeId: emptyTheme?.id || ''
						}
					})
				);
			}, 150);

			return;
		}

		const randomQuestion = pickRandomItem(questions);

		navigateTo('solve');

		window.setTimeout(() => {
			document.dispatchEvent(
				new CustomEvent('solve:select-question', {
					detail: {
						questionId: randomQuestion.id
					}
				})
			);
		}, 150);
	}

	startStudyButton.addEventListener('click', startStudy);

	console.log('Início inteligente de estudos carregado.');
}

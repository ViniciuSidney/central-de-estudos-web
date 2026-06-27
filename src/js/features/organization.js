import {getCollection} from '../core/storage.js';

const SUBJECTS_COLLECTION = 'subjects';
const THEMES_COLLECTION = 'themes';
const SUBTOPICS_COLLECTION = 'subtopics';
const QUESTIONS_COLLECTION = 'questions';
const ATTEMPTS_COLLECTION = 'attempts';
const ERROR_REVIEWS_COLLECTION = 'errorReviews';

export function initOrganization() {
	const organizationSection = document.querySelector('#organization');

	if (!organizationSection) {
		return;
	}

	const organizationTree = organizationSection.querySelector('.organization-tree');
	const organizationMainPanel = organizationSection.querySelector('.organization-main-panel');
	const subjectSearchForm = organizationMainPanel?.querySelector('.organization-search');
	const subjectSearchInput = organizationMainPanel?.querySelector('.organization-search input[type="search"]');
	const subjectGallery = organizationMainPanel?.querySelector('.organization-gallery');
	const subjectFeatureCard = organizationMainPanel?.querySelector('.organization-feature-card--active, .organization-feature-card--empty');
	const emptySubjectsState = organizationSection.querySelector('#organization-empty-subjects');
	const noSubjectResultsState = organizationSection.querySelector('#organization-no-subject-results');

	if (!organizationTree || !organizationMainPanel || !subjectSearchForm || !subjectSearchInput || !subjectGallery || !subjectFeatureCard || !emptySubjectsState || !noSubjectResultsState) {
		console.warn('Organização v1.2 não iniciada: elementos não encontrados.');
		return;
	}

	let selectedSubjectId = null;
	let selectedThemeId = null;
	let selectedSubtopicId = null;
	let subjectSearchText = '';

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

	function getThemesBySubjectId(subjectId) {
		return getThemes().filter((theme) => {
			return theme.subjectId === subjectId;
		});
	}

	function getSubtopicsBySubjectId(subjectId) {
		return getSubtopics().filter((subtopic) => {
			return subtopic.subjectId === subjectId;
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

	function escapeHTML(value) {
		return String(value ?? '')
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#039;');
	}

	function normalizeText(value) {
		return String(value ?? '')
			.toLowerCase()
			.normalize('NFD')
			.replaceAll(/[\u0300-\u036f]/g, '')
			.trim();
	}

	function formatCount(total, singular, plural) {
		return total === 1 ? `1 ${singular}` : `${total} ${plural}`;
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
				})
		);

		return Array.from(lastWrongAttemptByQuestion.values()).filter((attempt) => {
			return !reviewedAttemptIds.has(attempt.id);
		});
	}

	function getPendingErrorsBySubjectId(subjectId) {
		return getPendingErrorAttempts().filter((attempt) => {
			return attempt.subjectId === subjectId;
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

	function selectSubject(subjectId) {
		const subject = getSubjectById(subjectId);

		if (!subject) {
			return;
		}

		selectedSubjectId = subject.id;
		selectedThemeId = null;
		selectedSubtopicId = null;

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

		renderOrganization();
	}

	function renderOrganizationTree() {
		const subjects = getSubjects();

		organizationTree.innerHTML = '';

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

			const group = document.createElement('div');

			group.classList.add('organization-tree__group', 'is-open');

			const themesHTML = subjectThemes
				.map((theme) => {
					const themeSubtopics = getSubtopicsByThemeId(theme.id);
					const isSelectedTheme = selectedThemeId === theme.id;

					const subtopicsHTML = themeSubtopics
						.map((subtopic) => {
							const isSelectedSubtopic = selectedSubtopicId === subtopic.id;

							return `
								<button
									class="organization-tree__item organization-tree__item--subtopic ${isSelectedSubtopic ? 'is-active' : ''}"
									type="button"
									data-organization-tree-subtopic="${escapeHTML(subtopic.id)}"
								>
									${escapeHTML(subtopic.name)}
								</button>
							`;
						})
						.join('');

					return `
						<button
							class="organization-tree__item organization-tree__item--theme ${isSelectedTheme ? 'is-active' : ''}"
							type="button"
							data-organization-tree-theme="${escapeHTML(theme.id)}"
						>
							<span>${escapeHTML(theme.name)}</span>
							<span aria-hidden="true">${themeSubtopics.length > 0 ? '▾' : '•'}</span>
						</button>

						${
							themeSubtopics.length > 0
								? `
									<div class="organization-tree__children organization-tree__children--subtopics">
										${subtopicsHTML}
									</div>
								`
								: ''
						}
					`;
				})
				.join('');

			group.innerHTML = `
				<button
					class="organization-tree__item organization-tree__item--subject ${isSelectedSubject ? 'is-active' : ''}"
					type="button"
					data-organization-tree-subject="${escapeHTML(subject.id)}"
				>
					<span>${escapeHTML(subject.name)}</span>
					<span aria-hidden="true">${subjectThemes.length > 0 ? '▾' : '•'}</span>
				</button>

				${
					subjectThemes.length > 0
						? `
							<div class="organization-tree__children">
								${themesHTML}
							</div>
						`
						: ''
				}
			`;

			organizationTree.appendChild(group);
		});
	}

	function renderSubjectGallery() {
		const allSubjects = getSubjects();
		const filteredSubjects = getFilteredSubjects();

		subjectGallery.innerHTML = '';

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

			const subjectCard = document.createElement('article');

			subjectCard.classList.add('organization-card', 'organization-card--clickable');

			if (subject.id === selectedSubjectId) {
				subjectCard.classList.add('is-active');
			}

			subjectCard.setAttribute('role', 'button');
			subjectCard.setAttribute('tabindex', '0');
			subjectCard.setAttribute('aria-label', `Selecionar matéria ${subject.name}`);
			subjectCard.dataset.organizationSubjectId = subject.id;

			subjectCard.innerHTML = `
				<div class="organization-card__name" title="${escapeHTML(subject.name)}">
					${escapeHTML(subject.name)}
				</div>

				<div class="organization-card__meta">
					<span><strong>${themesCount}</strong> ${themesCount === 1 ? 'tema' : 'temas'}</span>
					<span><strong>${questionsCount}</strong> ${questionsCount === 1 ? 'questão' : 'questões'}</span>
				</div>
			`;

			subjectGallery.appendChild(subjectCard);
		});
	}

	function renderSubjectFeatureCard() {
		const subject = getSubjectById(selectedSubjectId);

		if (!subject) {
			subjectFeatureCard.className = 'organization-feature-card organization-feature-card--empty';

			subjectFeatureCard.innerHTML = `
				<p>Primeiro selecione uma matéria para editá-la ou acessar suas ações.</p>
			`;

			return;
		}

		const themesCount = getThemesBySubjectId(subject.id).length;
		const questionsCount = getQuestionsBySubjectId(subject.id).length;
		const errorsCount = getPendingErrorsBySubjectId(subject.id).length;

		subjectFeatureCard.className = 'organization-feature-card organization-feature-card--active';

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
					<span><strong>${themesCount}</strong> ${themesCount === 1 ? 'Tema' : 'Temas'}</span>
					<span><strong>${questionsCount}</strong> ${questionsCount === 1 ? 'Questão' : 'Questões'}</span>
					<span><strong>${errorsCount}</strong> ${errorsCount === 1 ? 'Erro' : 'Erros'}</span>
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
						${questionsCount === 0 ? 'disabled title="Cadastre uma questão para resolver."' : ''}
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
						${errorsCount === 0 ? 'disabled title="Nenhum erro pendente para revisar."' : ''}
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

	function renderOrganization() {
		ensureSelectedSubject();
		renderOrganizationTree();
		renderSubjectGallery();
		renderSubjectFeatureCard();
	}

	function openQuestionCreationFromSubject(subject) {
		const subjectThemes = getThemesBySubjectId(subject.id);

		if (subjectThemes.length === 0) {
			document.dispatchEvent(
				new CustomEvent('themes:prepare-create', {
					detail: {
						subjectId: subject.id
					}
				})
			);

			document.dispatchEvent(
				new CustomEvent('app:navigate', {
					detail: {
						sectionId: 'themes'
					}
				})
			);

			return;
		}

		if (subjectThemes.length === 1) {
			document.dispatchEvent(
				new CustomEvent('questions:prepare-create', {
					detail: {
						subjectId: subject.id,
						themeId: subjectThemes[0].id
					}
				})
			);
		}

		document.dispatchEvent(
			new CustomEvent('app:navigate', {
				detail: {
					sectionId: 'questions'
				}
			})
		);
	}

	function openNoteCreationFromSubject(subject) {
		document.dispatchEvent(
			new CustomEvent('notes:prepare-create', {
				detail: {
					subjectId: subject.id
				}
			})
		);

		document.dispatchEvent(
			new CustomEvent('app:navigate', {
				detail: {
					sectionId: 'notes'
				}
			})
		);
	}

	function handleSubjectGalleryClick(event) {
		const subjectCard = event.target.closest('[data-organization-subject-id]');

		if (!subjectCard) {
			return;
		}

		selectSubject(subjectCard.dataset.organizationSubjectId);
	}

	function handleSubjectGalleryKeydown(event) {
		if (!['Enter', ' '].includes(event.key)) {
			return;
		}

		const subjectCard = event.target.closest('[data-organization-subject-id]');

		if (!subjectCard) {
			return;
		}

		event.preventDefault();
		selectSubject(subjectCard.dataset.organizationSubjectId);
	}

	function handleTreeClick(event) {
		const subjectButton = event.target.closest('[data-organization-tree-subject]');
		const themeButton = event.target.closest('[data-organization-tree-theme]');
		const subtopicButton = event.target.closest('[data-organization-tree-subtopic]');

		if (subtopicButton) {
			selectSubtopic(subtopicButton.dataset.organizationTreeSubtopic);
			return;
		}

		if (themeButton) {
			selectTheme(themeButton.dataset.organizationTreeTheme);
			return;
		}

		if (subjectButton) {
			selectSubject(subjectButton.dataset.organizationTreeSubject);
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

	function handleFeatureCardAction(event) {
		const actionButton = event.target.closest('[data-organization-action]');

		if (!actionButton || actionButton.disabled) {
			return;
		}

		const action = actionButton.dataset.organizationAction;
		const subject = getSubjectById(selectedSubjectId);

		if (!subject) {
			return;
		}

		if (action === 'resolve-subject') {
			document.dispatchEvent(
				new CustomEvent('app:navigate', {
					detail: {
						sectionId: 'solve'
					}
				})
			);

			return;
		}

		if (action === 'review-subject') {
			document.dispatchEvent(
				new CustomEvent('app:navigate', {
					detail: {
						sectionId: 'reviews'
					}
				})
			);

			return;
		}

		if (action === 'create-question') {
			openQuestionCreationFromSubject(subject);
			return;
		}

		if (action === 'create-note') {
			openNoteCreationFromSubject(subject);
			return;
		}

		if (action === 'edit-subject') {
			console.log('Edição de matéria será implementada na próxima fase.', subject);
			return;
		}

		if (action === 'delete-subject') {
			console.log('Exclusão de matéria será implementada na próxima fase.', subject);
		}
	}

	function handleDataReset() {
		selectedSubjectId = null;
		selectedThemeId = null;
		selectedSubtopicId = null;
		subjectSearchText = '';
		subjectSearchInput.value = '';

		renderOrganization();
	}

	subjectSearchForm.addEventListener('submit', handleSubjectSearchSubmit);
	subjectSearchInput.addEventListener('input', handleSubjectSearchInput);

	subjectGallery.addEventListener('click', handleSubjectGalleryClick);
	subjectGallery.addEventListener('keydown', handleSubjectGalleryKeydown);

	organizationTree.addEventListener('click', handleTreeClick);
	subjectFeatureCard.addEventListener('click', handleFeatureCardAction);

	document.addEventListener('subjects:changed', renderOrganization);
	document.addEventListener('themes:changed', renderOrganization);
	document.addEventListener('subtopics:changed', renderOrganization);
	document.addEventListener('questions:changed', renderOrganization);
	document.addEventListener('attempts:changed', renderOrganization);
	document.addEventListener('errorReviews:changed', renderOrganization);
	document.addEventListener('app:data-reset', handleDataReset);

	renderOrganization();

	console.log('Organização v1.2 carregada.');
}

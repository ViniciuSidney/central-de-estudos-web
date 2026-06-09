import {getCollection, saveCollection} from '../core/storage.js';

const THEMES_COLLECTION = 'themes';
const SUBTOPICS_COLLECTION = 'subtopics';
const QUESTIONS_COLLECTION = 'questions';
const ATTEMPTS_COLLECTION = 'attempts';
const ERROR_REVIEWS_COLLECTION = 'errorReviews';

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

function getReviewQuestionId(review) {
	return review.questionId || review.sourceQuestionId || review.idQuestion || null;
}

function dispatchIntegrityEvents() {
	document.dispatchEvent(new CustomEvent('themes:changed'));
	document.dispatchEvent(new CustomEvent('subtopics:changed'));
	document.dispatchEvent(new CustomEvent('questions:changed'));
	document.dispatchEvent(new CustomEvent('attempts:changed'));
	document.dispatchEvent(new CustomEvent('errorReviews:changed'));
}

export function removeAttemptsAndReviewsByQuestionIds(questionIds = []) {
	const questionIdSet = new Set(questionIds);

	if (questionIdSet.size === 0) {
		return;
	}

	const attempts = getAttempts();

	const removedAttempts = attempts.filter((attempt) => {
		return questionIdSet.has(attempt.questionId);
	});

	const removedAttemptIds = new Set(
		removedAttempts.map((attempt) => {
			return attempt.id;
		})
	);

	const updatedAttempts = attempts.filter((attempt) => {
		return !questionIdSet.has(attempt.questionId);
	});

	const updatedErrorReviews = getErrorReviews().filter((review) => {
		const reviewQuestionId = getReviewQuestionId(review);
		const isLinkedToRemovedQuestion = reviewQuestionId && questionIdSet.has(reviewQuestionId);
		const isLinkedToRemovedAttempt = review.attemptId && removedAttemptIds.has(review.attemptId);

		return !isLinkedToRemovedQuestion && !isLinkedToRemovedAttempt;
	});

	saveCollection(ATTEMPTS_COLLECTION, updatedAttempts);
	saveCollection(ERROR_REVIEWS_COLLECTION, updatedErrorReviews);

	document.dispatchEvent(new CustomEvent('attempts:changed'));
	document.dispatchEvent(new CustomEvent('errorReviews:changed'));
}

export function removeQuestionsAndRelatedDataBySubtopicIds(subtopicIds = []) {
	const subtopicIdSet = new Set(subtopicIds);

	if (subtopicIdSet.size === 0) {
		return;
	}

	const questions = getQuestions();

	const removedQuestions = questions.filter((question) => {
		return subtopicIdSet.has(question.subtopicId);
	});

	const removedQuestionIds = removedQuestions.map((question) => {
		return question.id;
	});

	const updatedQuestions = questions.filter((question) => {
		return !subtopicIdSet.has(question.subtopicId);
	});

	saveCollection(QUESTIONS_COLLECTION, updatedQuestions);
	removeAttemptsAndReviewsByQuestionIds(removedQuestionIds);

	document.dispatchEvent(new CustomEvent('questions:changed'));
}

export function removeSubtopicsQuestionsAndRelatedDataByThemeIds(themeIds = []) {
	const themeIdSet = new Set(themeIds);

	if (themeIdSet.size === 0) {
		return;
	}

	const subtopics = getSubtopics();

	const removedSubtopics = subtopics.filter((subtopic) => {
		return themeIdSet.has(subtopic.themeId);
	});

	const removedSubtopicIds = removedSubtopics.map((subtopic) => {
		return subtopic.id;
	});

	const updatedSubtopics = subtopics.filter((subtopic) => {
		return !themeIdSet.has(subtopic.themeId);
	});

	saveCollection(SUBTOPICS_COLLECTION, updatedSubtopics);
	removeQuestionsAndRelatedDataBySubtopicIds(removedSubtopicIds);

	document.dispatchEvent(new CustomEvent('subtopics:changed'));
}

export function removeQuestionsAndRelatedDataByThemeIds(themeIds = []) {
	const themeIdSet = new Set(themeIds);

	if (themeIdSet.size === 0) {
		return;
	}

	const questions = getQuestions();

	const removedQuestions = questions.filter((question) => {
		return themeIdSet.has(question.themeId);
	});

	const removedQuestionIds = removedQuestions.map((question) => {
		return question.id;
	});

	const updatedQuestions = questions.filter((question) => {
		return !themeIdSet.has(question.themeId);
	});

	saveCollection(QUESTIONS_COLLECTION, updatedQuestions);
	removeAttemptsAndReviewsByQuestionIds(removedQuestionIds);

	document.dispatchEvent(new CustomEvent('questions:changed'));
}

export function removeSubtopicsQuestionsAndRelatedDataBySubjectIds(subjectIds = []) {
	const subjectIdSet = new Set(subjectIds);

	if (subjectIdSet.size === 0) {
		return;
	}

	const subtopics = getSubtopics();

	const removedSubtopics = subtopics.filter((subtopic) => {
		return subjectIdSet.has(subtopic.subjectId);
	});

	const removedSubtopicIds = removedSubtopics.map((subtopic) => {
		return subtopic.id;
	});

	const updatedSubtopics = subtopics.filter((subtopic) => {
		return !subjectIdSet.has(subtopic.subjectId);
	});

	saveCollection(SUBTOPICS_COLLECTION, updatedSubtopics);
	removeQuestionsAndRelatedDataBySubtopicIds(removedSubtopicIds);

	document.dispatchEvent(new CustomEvent('subtopics:changed'));
}

export function removeThemesQuestionsAndRelatedDataBySubjectIds(subjectIds = []) {
	const subjectIdSet = new Set(subjectIds);

	if (subjectIdSet.size === 0) {
		return;
	}

	const themes = getThemes();
	const questions = getQuestions();

	const removedThemes = themes.filter((theme) => {
		return subjectIdSet.has(theme.subjectId);
	});

	const removedThemeIds = new Set(
		removedThemes.map((theme) => {
			return theme.id;
		})
	);

	const removedQuestions = questions.filter((question) => {
		return subjectIdSet.has(question.subjectId) || removedThemeIds.has(question.themeId);
	});

	const removedQuestionIds = removedQuestions.map((question) => {
		return question.id;
	});

	const updatedThemes = themes.filter((theme) => {
		return !subjectIdSet.has(theme.subjectId);
	});

	const updatedQuestions = questions.filter((question) => {
		return !removedQuestionIds.includes(question.id);
	});

	saveCollection(THEMES_COLLECTION, updatedThemes);
	saveCollection(QUESTIONS_COLLECTION, updatedQuestions);

	removeSubtopicsQuestionsAndRelatedDataBySubjectIds(subjectIds);
	removeAttemptsAndReviewsByQuestionIds(removedQuestionIds);

	dispatchIntegrityEvents();
}

export function purgeOrphanStudyRecords() {
	const existingThemeIds = new Set(
		getThemes().map((theme) => {
			return theme.id;
		})
	);

	const existingSubtopicIds = new Set(
		getSubtopics().map((subtopic) => {
			return subtopic.id;
		})
	);

	const existingQuestionIds = new Set(
		getQuestions().map((question) => {
			return question.id;
		})
	);

	const subtopics = getSubtopics();

	const validSubtopics = subtopics.filter((subtopic) => {
		return existingThemeIds.has(subtopic.themeId);
	});

	const validSubtopicIds = new Set(
		validSubtopics.map((subtopic) => {
			return subtopic.id;
		})
	);

	const questions = getQuestions();

	const validQuestions = questions.filter((question) => {
		if (!existingQuestionIds.has(question.id)) {
			return false;
		}

		if (!question.subtopicId) {
			return true;
		}

		return existingSubtopicIds.has(question.subtopicId) || validSubtopicIds.has(question.subtopicId);
	});

	const validQuestionIds = new Set(
		validQuestions.map((question) => {
			return question.id;
		})
	);

	const attempts = getAttempts();

	const validAttempts = attempts.filter((attempt) => {
		return validQuestionIds.has(attempt.questionId);
	});

	const validAttemptIds = new Set(
		validAttempts.map((attempt) => {
			return attempt.id;
		})
	);

	const validErrorReviews = getErrorReviews().filter((review) => {
		const reviewQuestionId = getReviewQuestionId(review);

		const hasValidQuestion = !reviewQuestionId || validQuestionIds.has(reviewQuestionId);

		const hasValidAttempt = !review.attemptId || validAttemptIds.has(review.attemptId);

		return hasValidQuestion && hasValidAttempt;
	});

	const changed =
		validSubtopics.length !== subtopics.length || validQuestions.length !== questions.length || validAttempts.length !== attempts.length || validErrorReviews.length !== getErrorReviews().length;

	if (!changed) {
		return;
	}

	saveCollection(SUBTOPICS_COLLECTION, validSubtopics);
	saveCollection(QUESTIONS_COLLECTION, validQuestions);
	saveCollection(ATTEMPTS_COLLECTION, validAttempts);
	saveCollection(ERROR_REVIEWS_COLLECTION, validErrorReviews);

	document.dispatchEvent(new CustomEvent('subtopics:changed'));
	document.dispatchEvent(new CustomEvent('questions:changed'));
	document.dispatchEvent(new CustomEvent('attempts:changed'));
	document.dispatchEvent(new CustomEvent('errorReviews:changed'));
}

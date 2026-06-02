import { getCollection, saveCollection } from "../core/storage.js";

const THEMES_COLLECTION = "themes";
const QUESTIONS_COLLECTION = "questions";
const ATTEMPTS_COLLECTION = "attempts";
const ERROR_REVIEWS_COLLECTION = "errorReviews";

function getThemes() {
  return getCollection(THEMES_COLLECTION);
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
  document.dispatchEvent(new CustomEvent("themes:changed"));
  document.dispatchEvent(new CustomEvent("questions:changed"));
  document.dispatchEvent(new CustomEvent("attempts:changed"));
  document.dispatchEvent(new CustomEvent("errorReviews:changed"));
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
    }),
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

  document.dispatchEvent(new CustomEvent("attempts:changed"));
  document.dispatchEvent(new CustomEvent("errorReviews:changed"));
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

  document.dispatchEvent(new CustomEvent("questions:changed"));
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
    }),
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
  removeAttemptsAndReviewsByQuestionIds(removedQuestionIds);

  dispatchIntegrityEvents();
}

export function purgeOrphanStudyRecords() {
  const existingQuestionIds = new Set(
    getQuestions().map((question) => {
      return question.id;
    }),
  );

  const attempts = getAttempts();

  const validAttempts = attempts.filter((attempt) => {
    return existingQuestionIds.has(attempt.questionId);
  });

  const validAttemptIds = new Set(
    validAttempts.map((attempt) => {
      return attempt.id;
    }),
  );

  const validErrorReviews = getErrorReviews().filter((review) => {
    const reviewQuestionId = getReviewQuestionId(review);

    const hasValidQuestion = !reviewQuestionId || existingQuestionIds.has(reviewQuestionId);

    const hasValidAttempt = !review.attemptId || validAttemptIds.has(review.attemptId);

    return hasValidQuestion && hasValidAttempt;
  });

  const changed = validAttempts.length !== attempts.length || validErrorReviews.length !== getErrorReviews().length;

  if (!changed) {
    return;
  }

  saveCollection(ATTEMPTS_COLLECTION, validAttempts);
  saveCollection(ERROR_REVIEWS_COLLECTION, validErrorReviews);

  document.dispatchEvent(new CustomEvent("attempts:changed"));
  document.dispatchEvent(new CustomEvent("errorReviews:changed"));
}

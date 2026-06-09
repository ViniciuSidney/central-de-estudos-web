import {getCollection, saveCollection} from '../core/storage.js';
import {compareNames} from '../systems/listTextImport.js';

const SUBTOPICS_COLLECTION = 'subtopics';

export function getSubtopics() {
	return getCollection(SUBTOPICS_COLLECTION);
}

export function saveSubtopics(subtopics) {
	saveCollection(SUBTOPICS_COLLECTION, subtopics);
}

export function getSubtopicsByThemeId(themeId) {
	return getSubtopics().filter((subtopic) => {
		return subtopic.themeId === themeId;
	});
}

export function getSubtopicsBySubjectId(subjectId) {
	return getSubtopics().filter((subtopic) => {
		return subtopic.subjectId === subjectId;
	});
}

export function findDuplicatedSubtopic({subjectId, themeId, name}) {
	return getSubtopics().find((subtopic) => {
		return subtopic.subjectId === subjectId && subtopic.themeId === themeId && compareNames(subtopic.name, name);
	});
}

export function createSubtopic({subjectId, themeId, name, description = ''}) {
	return {
		id: crypto.randomUUID(),
		subjectId,
		themeId,
		name,
		description,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
}

export function addSubtopic({subjectId, themeId, name, description = ''}) {
	const cleanName = name.trim();
	const cleanDescription = description.trim();

	if (!subjectId || !themeId || !cleanName) {
		return {
			ok: false,
			message: 'Informe matéria, tema e nome do assunto.'
		};
	}

	const duplicatedSubtopic = findDuplicatedSubtopic({
		subjectId,
		themeId,
		name: cleanName
	});

	if (duplicatedSubtopic) {
		return {
			ok: false,
			message: `O assunto "${duplicatedSubtopic.name}" já está cadastrado neste tema.`
		};
	}

	const subtopics = getSubtopics();

	const newSubtopic = createSubtopic({
		subjectId,
		themeId,
		name: cleanName,
		description: cleanDescription
	});

	subtopics.push(newSubtopic);
	saveSubtopics(subtopics);

	document.dispatchEvent(new CustomEvent('subtopics:changed'));

	return {
		ok: true,
		message: 'Assunto cadastrado com sucesso.',
		subtopic: newSubtopic
	};
}

export function deleteSubtopic(subtopicId) {
	const updatedSubtopics = getSubtopics().filter((subtopic) => {
		return subtopic.id !== subtopicId;
	});

	saveSubtopics(updatedSubtopics);

	document.dispatchEvent(new CustomEvent('subtopics:changed'));

	return {
		ok: true,
		message: 'Assunto excluído com sucesso.'
	};
}

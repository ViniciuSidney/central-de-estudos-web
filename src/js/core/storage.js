const STORAGE_KEY = "central-estudos-web-data";

const defaultAppData = {
	subjects: [],
	themes: [],
	subtopics: [],
	questions: [],
	notes: [],
	attempts: [],
	reviews: [],
	errorReviews: []
};

export function loadAppData() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    return { ...defaultAppData };
  }

  try {
    return {
      ...defaultAppData,
      ...JSON.parse(savedData)
    };
  } catch (error) {
    console.error("Erro ao carregar dados do localStorage:", error);

    return { ...defaultAppData };
  }
}

export function saveAppData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getCollection(collectionName) {
  const appData = loadAppData();

  return appData[collectionName] || [];
}

export function saveCollection(collectionName, collectionData) {
  const appData = loadAppData();

  appData[collectionName] = collectionData;

  saveAppData(appData);
}
const STORAGE_KEY = "central-estudos-web-data";

const defaultAppData = {
  subjects: [],
  themes: [],
  questions: [],
  notes: [],
  attempts: [],
  reviews: []
};

function loadAppData() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    return defaultAppData;
  }

  try {
    return JSON.parse(savedData);
  } catch (error) {
    console.error("Erro ao carregar dados do localStorage:", error);
    return defaultAppData;
  }
}

function saveAppData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getCollection(collectionName) {
  const appData = loadAppData();

  return appData[collectionName] || [];
}

function saveCollection(collectionName, collectionData) {
  const appData = loadAppData();

  appData[collectionName] = collectionData;

  saveAppData(appData);
}
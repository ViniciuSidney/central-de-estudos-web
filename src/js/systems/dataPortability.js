import { getCollection, saveCollection } from "../core/storage.js";

const APP_BACKUP_NAME = "central-de-estudos-web";
const APP_VERSION = "1.0";
const SCHEMA_VERSION = 1;

const BACKUP_COLLECTIONS = [
  "subjects",
  "themes",
  "questions",
  "attempts",
  "errorReviews",
  "notes",
];

export function initDataPortability() {
  const exportButton = document.querySelector("#export-data-button");
  const importInput = document.querySelector("#import-data-input");
  const importButton = document.querySelector("#import-data-button");
  const message = document.querySelector("#data-portability-message");

  if (!exportButton || !importInput || !importButton || !message) {
    return;
  }

  let messageTimeoutId = null;
  let selectedBackupPayload = null;

  function setMessage(text, type = "default") {
    if (messageTimeoutId) {
      clearTimeout(messageTimeoutId);
    }

    message.textContent = text;
    message.classList.remove("is-error", "is-success", "is-visible");

    if (!text) {
      return;
    }

    message.classList.add("is-visible");

    if (type === "error") {
      message.classList.add("is-error");
    }

    if (type === "success") {
      message.classList.add("is-success");
    }

    messageTimeoutId = setTimeout(() => {
      message.textContent = "";
      message.classList.remove("is-error", "is-success", "is-visible");
      messageTimeoutId = null;
    }, 3500);
  }

  function createBackupPayload() {
    const data = {};

    BACKUP_COLLECTIONS.forEach((collectionName) => {
      data[collectionName] = getCollection(collectionName);
    });

    return {
      app: APP_BACKUP_NAME,
      version: APP_VERSION,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data,
    };
  }

  function createBackupFileName() {
    const date = new Date().toISOString().slice(0, 10);

    return `central-de-estudos-backup-${date}.json`;
  }

  function downloadJSONFile(payload) {
    const json = JSON.stringify(payload, null, 2);

    const blob = new Blob([json], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = createBackupFileName();

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  function exportData() {
    try {
      const backupPayload = createBackupPayload();

      downloadJSONFile(backupPayload);

      setMessage("Backup exportado com sucesso.", "success");
    } catch (error) {
      console.error(error);
      setMessage("Não foi possível exportar os dados.", "error");
    }
  }

  function validateBackupPayload(payload) {
    if (!payload || typeof payload !== "object") {
      return "Arquivo inválido.";
    }

    if (payload.app !== APP_BACKUP_NAME) {
      return "Este arquivo não pertence à Central de Estudos Web.";
    }

    if (!payload.data || typeof payload.data !== "object") {
      return "O arquivo não contém dados válidos.";
    }

    if (payload.schemaVersion !== SCHEMA_VERSION) {
      return "A versão da estrutura do backup não é compatível.";
    }

    const missingCollection = BACKUP_COLLECTIONS.find((collectionName) => {
      return !Array.isArray(payload.data[collectionName]);
    });

    if (missingCollection) {
      return `A coleção "${missingCollection}" está ausente ou inválida.`;
    }

    return null;
  }

  function dispatchDataImportedEvents() {
    document.dispatchEvent(new CustomEvent("subjects:changed"));
    document.dispatchEvent(new CustomEvent("themes:changed"));
    document.dispatchEvent(new CustomEvent("questions:changed"));
    document.dispatchEvent(new CustomEvent("attempts:changed"));
    document.dispatchEvent(new CustomEvent("errorReviews:changed"));
    document.dispatchEvent(new CustomEvent("notes:changed"));

    document.dispatchEvent(new CustomEvent("app:data-imported"));
  }

  function restoreBackupPayload(payload) {
    BACKUP_COLLECTIONS.forEach((collectionName) => {
      saveCollection(collectionName, payload.data[collectionName]);
    });

    dispatchDataImportedEvents();

    document.dispatchEvent(
      new CustomEvent("app:navigate", {
        detail: {
          sectionId: "dashboard",
        },
      }),
    );

    selectedBackupPayload = null;
    importInput.value = "";
    importButton.disabled = true;

    setMessage("Backup importado com sucesso.", "success");
  }

  function confirmImportBackup() {
    return window.confirm(
      "Importar este backup substituirá os dados atuais da aplicação. Deseja continuar?",
    );
  }

  function importSelectedBackup() {
    if (!selectedBackupPayload) {
      setMessage("Selecione um backup válido antes de importar.", "error");
      return;
    }

    const confirmed = confirmImportBackup();

    if (!confirmed) {
      setMessage("Importação cancelada.");
      return;
    }

    try {
      restoreBackupPayload(selectedBackupPayload);
    } catch (error) {
      console.error(error);
      setMessage("Não foi possível importar o backup.", "error");
    }
  }

  function handleBackupFileSelection() {
    const file = importInput.files[0];

    selectedBackupPayload = null;
    importButton.disabled = true;

    if (!file) {
      setMessage("");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".json")) {
      importInput.value = "";
      setMessage("Selecione um arquivo JSON válido.", "error");
      return;
    }

    const reader = new FileReader();

    reader.addEventListener("load", () => {
      try {
        const payload = JSON.parse(reader.result);
        const validationError = validateBackupPayload(payload);

        if (validationError) {
          importInput.value = "";
          setMessage(validationError, "error");
          return;
        }

        selectedBackupPayload = payload;
        importButton.disabled = false;

        setMessage("Backup válido selecionado.", "success");
      } catch (error) {
        console.error(error);

        importInput.value = "";
        setMessage("Não foi possível ler o arquivo JSON.", "error");
      }
    });

    reader.addEventListener("error", () => {
      importInput.value = "";
      setMessage("Erro ao ler o arquivo selecionado.", "error");
    });

    reader.readAsText(file);
  }

  exportButton.addEventListener("click", exportData);
  importInput.addEventListener("change", handleBackupFileSelection);
  importButton.addEventListener("click", importSelectedBackup);

  console.log("Sistema de exportação/importação carregado.");
}

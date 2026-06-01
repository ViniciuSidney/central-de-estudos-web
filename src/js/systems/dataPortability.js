import { getCollection } from "../core/storage.js";

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
  const message = document.querySelector("#data-portability-message");

  if (!exportButton || !message) {
    return;
  }

  function setMessage(text, type = "default") {
    message.textContent = text;

    message.classList.remove("is-error", "is-success");

    if (type === "error") {
      message.classList.add("is-error");
    }

    if (type === "success") {
      message.classList.add("is-success");
    }
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

  exportButton.addEventListener("click", exportData);

  console.log("Sistema de exportação/importação carregado.");
}
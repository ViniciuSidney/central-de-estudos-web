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
  const clearImportButton = document.querySelector("#clear-import-data-button");
  const selectedBackupName = document.querySelector("#selected-backup-name");
  const selectedBackupStatus = document.querySelector(
    "#selected-backup-status",
  );
  const backupFileStatus = document.querySelector(".backup-file-status");
  const message = document.querySelector("#data-portability-message");
  const selectImportButton = document.querySelector(
    "#select-import-data-button",
  );

  if (
    !exportButton ||
    !importInput ||
    !importButton ||
    !selectImportButton ||
    !clearImportButton ||
    !selectedBackupName ||
    !selectedBackupStatus ||
    !backupFileStatus ||
    !message
  ) {
    return;
  }

  let messageTimeoutId = null;
  let selectedBackupPayload = null;

  function getSelectedBackupFileName() {
    return selectedBackupName.textContent || "backup selecionado";
  }

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

  function setBackupSelectionState({
    fileName = "Nenhum arquivo selecionado.",
    status = "Selecione um backup JSON para liberar a importação.",
    isValid = false,
    isInvalid = false,
  } = {}) {
    const hasSelectedFile = fileName !== "Nenhum arquivo selecionado.";

    selectedBackupName.textContent = fileName;
    selectedBackupStatus.textContent = status;

    backupFileStatus.classList.toggle("is-valid", isValid);
    backupFileStatus.classList.toggle("is-invalid", isInvalid);

    importButton.disabled = !isValid;
    clearImportButton.disabled = !hasSelectedFile;

    selectImportButton.classList.toggle("is-disabled", isValid);
    selectImportButton.setAttribute("aria-disabled", String(isValid));
  }

  function clearSelectedBackup() {
    selectedBackupPayload = null;
    importInput.value = "";

    setBackupSelectionState();
    setMessage("");
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

    clearSelectedBackup();
    setMessage("Backup importado com sucesso.", "success");
  }

  function openAppConfirmModal({
    tag = "⚠️ Confirmação",
    title = "Confirmar ação",
    description = "Tem certeza que deseja continuar?",
    descriptionHTML = "",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    confirmButtonClass = "button button--primary",
  } = {}) {
    const modal = document.querySelector("#app-confirm-modal");
    const modalTag = document.querySelector("#app-confirm-tag");
    const modalTitle = document.querySelector("#app-confirm-title");
    const modalDescription = document.querySelector("#app-confirm-description");
    const cancelButton = document.querySelector("#app-confirm-cancel");
    const confirmButton = document.querySelector("#app-confirm-confirm");

    if (
      !modal ||
      !modalTag ||
      !modalTitle ||
      !modalDescription ||
      !cancelButton ||
      !confirmButton
    ) {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      function closeModal(result) {
        modal.hidden = true;
        document.body.style.overflow = "";

        cancelButton.removeEventListener("click", handleCancel);
        confirmButton.removeEventListener("click", handleConfirm);
        modal.removeEventListener("click", handleOverlayClick);
        document.removeEventListener("keydown", handleEscape);

        resolve(result);
      }

      function handleCancel() {
        closeModal(false);
      }

      function handleConfirm() {
        closeModal(true);
      }

      function handleOverlayClick(event) {
        if (event.target === modal) {
          closeModal(false);
        }
      }

      function handleEscape(event) {
        if (event.key === "Escape") {
          closeModal(false);
        }
      }

      modalTag.textContent = tag;
      modalTitle.textContent = title;
      if (descriptionHTML) {
        modalDescription.innerHTML = descriptionHTML;
      } else {
        modalDescription.textContent = description;
      }

      cancelButton.textContent = cancelText;
      confirmButton.textContent = confirmText;

      confirmButton.className = confirmButtonClass;

      modal.hidden = false;
      document.body.style.overflow = "hidden";

      cancelButton.addEventListener("click", handleCancel);
      confirmButton.addEventListener("click", handleConfirm);
      modal.addEventListener("click", handleOverlayClick);
      document.addEventListener("keydown", handleEscape);

      cancelButton.focus();
    });
  }

  function escapeHTML(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function confirmImportBackup() {
    const fileName = escapeHTML(getSelectedBackupFileName());

    return openAppConfirmModal({
      tag: "⚠️ Importação de dados",
      title: "Substituir dados atuais?",
      descriptionHTML: `
      <strong>Arquivo selecionado:</strong>
      <strong class="modal-file-name">${fileName}</strong>

      <span class="modal-description-spacer"></span>

      Ao continuar, os dados atuais serão substituídos pelos dados deste backup.
      Exporte um backup atual antes de prosseguir se quiser preservar as informações existentes.
    `,
      confirmText: "Substituir dados",
      cancelText: "Cancelar",
      confirmButtonClass: "button button--danger",
    });
  }

  async function importSelectedBackup() {
    if (!selectedBackupPayload) {
      setMessage("Selecione um backup válido antes de importar.", "error");
      return;
    }

    const confirmed = await confirmImportBackup();

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
      clearSelectedBackup();
      return;
    }

    if (!file.name.toLowerCase().endsWith(".json")) {
      setBackupSelectionState({
        fileName: file.name,
        status: "Selecione um arquivo JSON válido.",
        isInvalid: true,
      });

      setMessage("Arquivo inválido.", "error");
      return;
    }

    const reader = new FileReader();

    reader.addEventListener("load", () => {
      try {
        const payload = JSON.parse(reader.result);
        const validationError = validateBackupPayload(payload);

        if (validationError) {
          selectedBackupPayload = null;

          setBackupSelectionState({
            fileName: file.name,
            status: validationError,
            isInvalid: true,
          });

          setMessage("Backup inválido.", "error");
          return;
        }

        selectedBackupPayload = payload;

        setBackupSelectionState({
          fileName: file.name,
          status: "Backup válido. A importação está liberada.",
          isValid: true,
        });

        setMessage("Backup válido selecionado.", "success");
      } catch (error) {
        console.error(error);

        selectedBackupPayload = null;

        setBackupSelectionState({
          fileName: file.name,
          status: "Não foi possível ler o arquivo JSON.",
          isInvalid: true,
        });

        setMessage("Erro ao ler o arquivo.", "error");
      }
    });

    reader.addEventListener("error", () => {
      selectedBackupPayload = null;

      setBackupSelectionState({
        fileName: file.name,
        status: "Erro ao ler o arquivo selecionado.",
        isInvalid: true,
      });

      setMessage("Erro ao ler o arquivo.", "error");
    });

    reader.readAsText(file);
  }

  exportButton.addEventListener("click", exportData);
  importInput.addEventListener("change", handleBackupFileSelection);
  importButton.addEventListener("click", importSelectedBackup);
  clearImportButton.addEventListener("click", clearSelectedBackup);

  setBackupSelectionState();

  console.log("Sistema de exportação/importação carregado.");
}

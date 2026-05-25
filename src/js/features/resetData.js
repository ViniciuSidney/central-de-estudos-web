import { saveCollection } from "../core/storage.js";

const COLLECTIONS_TO_RESET = [
  "subjects",
  "themes",
  "questions",
  "attempts",
  "errorReviews",
  "notes",
];

export function initResetData() {
  const openResetButton = document.querySelector("#open-reset-data-modal");
  const resetModal = document.querySelector("#reset-data-modal");
  const firstConfirmInput = document.querySelector("#reset-data-first-confirm");
  const finalGroup = document.querySelector("#reset-data-final-group");
  const finalInput = document.querySelector("#reset-data-final-input");
  const resetMessage = document.querySelector("#reset-data-message");
  const cancelResetButton = document.querySelector("#cancel-reset-data");
  const confirmResetButton = document.querySelector("#confirm-reset-data");

  if (
    !openResetButton ||
    !resetModal ||
    !firstConfirmInput ||
    !finalGroup ||
    !finalInput ||
    !resetMessage ||
    !cancelResetButton ||
    !confirmResetButton
  ) {
    return;
  }

  function setResetMessage(message, type = "default") {
    resetMessage.textContent = message;

    resetMessage.classList.remove("is-error", "is-success");

    if (type === "error") {
      resetMessage.classList.add("is-error");
    }

    if (type === "success") {
      resetMessage.classList.add("is-success");
    }
  }

  function resetModalState() {
    firstConfirmInput.checked = false;
    finalInput.value = "";
    finalGroup.hidden = true;
    confirmResetButton.disabled = true;
    setResetMessage("");
  }

  function openResetModal() {
    resetModalState();

    resetModal.hidden = false;
    document.body.style.overflow = "hidden";
    firstConfirmInput.focus();
  }

  function closeResetModal() {
    resetModal.hidden = true;
    document.body.style.overflow = "";
    resetModalState();
  }

  function updateConfirmState() {
    const firstConfirmed = firstConfirmInput.checked;
    const finalConfirmed = finalInput.value.trim().toUpperCase() === "APAGAR";

    finalGroup.hidden = !firstConfirmed;
    confirmResetButton.disabled = !(firstConfirmed && finalConfirmed);

    if (firstConfirmed && !finalConfirmed) {
      setResetMessage(
        "Digite APAGAR para liberar a exclusão definitiva.",
        "error",
      );
    } else {
      setResetMessage("");
    }
  }

  function dispatchDataResetEvents() {
    document.dispatchEvent(new CustomEvent("subjects:changed"));
    document.dispatchEvent(new CustomEvent("themes:changed"));
    document.dispatchEvent(new CustomEvent("questions:changed"));
    document.dispatchEvent(new CustomEvent("attempts:changed"));
    document.dispatchEvent(new CustomEvent("errorReviews:changed"));
    document.dispatchEvent(new CustomEvent("notes:changed"));
  }

  function resetAllData() {
    COLLECTIONS_TO_RESET.forEach((collectionName) => {
      saveCollection(collectionName, []);
    });

    dispatchDataResetEvents();
    closeResetModal();
  }

  openResetButton.addEventListener("click", openResetModal);
  cancelResetButton.addEventListener("click", closeResetModal);

  firstConfirmInput.addEventListener("change", updateConfirmState);
  finalInput.addEventListener("input", updateConfirmState);

  confirmResetButton.addEventListener("click", () => {
    if (confirmResetButton.disabled) {
      return;
    }

    resetAllData();
  });

  resetModal.addEventListener("click", (event) => {
    if (event.target === resetModal) {
      closeResetModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !resetModal.hidden) {
      closeResetModal();
    }
  });

  console.log("Controle de reset carregado.");
}

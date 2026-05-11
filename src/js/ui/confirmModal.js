let confirmCallback = null;

export function initConfirmModal() {
  const modal = document.querySelector("#app-confirm-modal");
  const cancelButton = document.querySelector("#app-confirm-cancel");
  const confirmButton = document.querySelector("#app-confirm-confirm");

  if (!modal || !cancelButton || !confirmButton) {
    return;
  }

  function closeModal() {
    closeConfirmModal();
  }

  function confirmAction() {
    if (typeof confirmCallback === "function") {
      confirmCallback();
    }

    closeConfirmModal();
  }

  function handleOverlayClick(event) {
    if (event.target === modal) {
      closeConfirmModal();
    }
  }

  function handleEscapeKey(event) {
    if (event.key === "Escape" && !modal.hidden) {
      closeConfirmModal();
    }
  }

  cancelButton.addEventListener("click", closeModal);
  confirmButton.addEventListener("click", confirmAction);
  modal.addEventListener("click", handleOverlayClick);
  document.addEventListener("keydown", handleEscapeKey);
}

export function openConfirmModal({
  tag = "⚠️ Confirmação",
  title = "Confirmar ação",
  message = "Tem certeza que deseja continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm
}) {
  const modal = document.querySelector("#app-confirm-modal");
  const tagElement = document.querySelector("#app-confirm-tag");
  const titleElement = document.querySelector("#app-confirm-title");
  const descriptionElement = document.querySelector("#app-confirm-description");
  const cancelButton = document.querySelector("#app-confirm-cancel");
  const confirmButton = document.querySelector("#app-confirm-confirm");

  if (
    !modal ||
    !tagElement ||
    !titleElement ||
    !descriptionElement ||
    !cancelButton ||
    !confirmButton
  ) {
    return;
  }

  confirmCallback = onConfirm;

  tagElement.textContent = tag;
  titleElement.textContent = title;
  descriptionElement.textContent = message;
  cancelButton.textContent = cancelText;
  confirmButton.textContent = confirmText;

  modal.hidden = false;
  confirmButton.focus();
}

export function closeConfirmModal() {
  const modal = document.querySelector("#app-confirm-modal");

  if (!modal) {
    return;
  }

  confirmCallback = null;
  modal.hidden = true;
}
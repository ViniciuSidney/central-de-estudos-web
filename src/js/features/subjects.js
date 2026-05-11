import { getCollection, saveCollection } from "../core/storage.js";

const SUBJECTS_COLLECTION = "subjects";

export function initSubjects() {
  const subjectForm = document.querySelector("#subject-form");
  const subjectNameInput = document.querySelector("#subject-name");
  const subjectDescriptionInput = document.querySelector(
    "#subject-description",
  );
  const clearSubjectFormButton = document.querySelector("#clear-subject-form");
  const subjectFormMessage = document.querySelector("#subject-form-message");
  const subjectsList = document.querySelector("#subjects-list");
  const subjectsEmptyState = document.querySelector("#subjects-empty-state");
  const subjectsCount = document.querySelector("#subjects-count");
  const dashboardSubjectsCount = document.querySelector(
    "#dashboard-subjects-count",
  );

  const confirmDeleteModal = document.querySelector("#confirm-delete-modal");
  const confirmDeleteDescription = document.querySelector(
    "#confirm-delete-description",
  );
  const confirmDeleteCancelButton = document.querySelector(
    "#confirm-delete-cancel",
  );
  const confirmDeleteConfirmButton = document.querySelector(
    "#confirm-delete-confirm",
  );

  if (
    !subjectForm ||
    !subjectNameInput ||
    !subjectDescriptionInput ||
    !clearSubjectFormButton ||
    !subjectFormMessage ||
    !subjectsList ||
    !subjectsEmptyState ||
    !subjectsCount ||
    !dashboardSubjectsCount ||
    !confirmDeleteModal ||
    !confirmDeleteDescription ||
    !confirmDeleteCancelButton ||
    !confirmDeleteConfirmButton
  ) {
    return;
  }

  let subjectIdPendingDeletion = null;

  function getSubjects() {
    return getCollection(SUBJECTS_COLLECTION);
  }

  function saveSubjects(subjects) {
    saveCollection(SUBJECTS_COLLECTION, subjects);
  }

  function createSubject(name, description) {
    return {
      id: crypto.randomUUID(),
      name,
      description,
      createdAt: new Date().toISOString(),
    };
  }

  function formatDate(dateValue) {
    const date = new Date(dateValue);

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function setFormMessage(message, type = "default") {
    subjectFormMessage.textContent = message;

    subjectFormMessage.classList.remove("is-error", "is-success");

    if (type === "error") {
      subjectFormMessage.classList.add("is-error");
    }

    if (type === "success") {
      subjectFormMessage.classList.add("is-success");
    }
  }

  function updateSubjectsCount(subjects) {
    const totalSubjects = subjects.length;

    subjectsCount.textContent =
      totalSubjects === 1 ? "1 matéria" : `${totalSubjects} matérias`;

    dashboardSubjectsCount.textContent = totalSubjects;
  }

  function renderSubjects() {
    const subjects = getSubjects();

    subjectsList.innerHTML = "";

    updateSubjectsCount(subjects);

    if (subjects.length === 0) {
      subjectsEmptyState.hidden = false;
      return;
    }

    subjectsEmptyState.hidden = true;

    subjects.forEach((subject) => {
      const subjectCard = document.createElement("article");

      subjectCard.classList.add("subject-card");
      subjectCard.dataset.subjectId = subject.id;

      subjectCard.innerHTML = `
        <div class="subject-card__content">
          <h3>${subject.name}</h3>
          <p>${subject.description || "Sem descrição adicionada."}</p>
          <span class="subject-card__date">
            Criada em ${formatDate(subject.createdAt)}
          </span>
        </div>

        <div class="subject-card__actions">
          <button
            class="button button--danger"
            type="button"
            data-delete-subject="${subject.id}"
          >
            Excluir
          </button>
        </div>
      `;

      subjectsList.appendChild(subjectCard);
    });
  }

  function clearForm() {
    subjectNameInput.value = "";
    subjectDescriptionInput.value = "";
    setFormMessage("");
    subjectNameInput.focus();
  }

  function openDeleteModal(subject) {
    subjectIdPendingDeletion = subject.id;

    confirmDeleteDescription.textContent = `Tem certeza que deseja excluir a matéria "${subject.name}"?`;

    confirmDeleteModal.hidden = false;
    confirmDeleteConfirmButton.focus();
  }

  function closeDeleteModal() {
    subjectIdPendingDeletion = null;
    confirmDeleteModal.hidden = true;
  }

  function handleSubjectSubmit(event) {
    event.preventDefault();

    const subjectName = subjectNameInput.value.trim();
    const subjectDescription = subjectDescriptionInput.value.trim();

    if (!subjectName) {
      setFormMessage("Informe o nome da matéria antes de cadastrar.", "error");
      subjectNameInput.focus();
      return;
    }

    const subjects = getSubjects();
    const newSubject = createSubject(subjectName, subjectDescription);

    subjects.push(newSubject);

    saveSubjects(subjects);
    renderSubjects();
    clearForm();
    notifySubjectsChanged();

    setFormMessage("Matéria cadastrada com sucesso.", "success");
  }

  function handleSubjectDelete(event) {
    const deleteButton = event.target.closest("[data-delete-subject]");

    if (!deleteButton) {
      return;
    }

    const subjectId = deleteButton.dataset.deleteSubject;

    const subject = getSubjects().find((currentSubject) => {
      return currentSubject.id === subjectId;
    });

    if (!subject) {
      return;
    }

    openDeleteModal(subject);
  }

  function confirmSubjectDeletion() {
    if (!subjectIdPendingDeletion) {
      return;
    }

    const updatedSubjects = getSubjects().filter((currentSubject) => {
      return currentSubject.id !== subjectIdPendingDeletion;
    });

    saveSubjects(updatedSubjects);
    renderSubjects();
    closeDeleteModal();
    notifySubjectsChanged();
    
    setFormMessage("Matéria excluída com sucesso.", "success");
  }

  function handleModalOverlayClick(event) {
    if (event.target === confirmDeleteModal) {
      closeDeleteModal();
    }
  }

  function handleEscapeKey(event) {
    if (event.key === "Escape" && !confirmDeleteModal.hidden) {
      closeDeleteModal();
    }
  }

  function notifySubjectsChanged() {
    document.dispatchEvent(new CustomEvent("subjects:changed"));
  }

  subjectForm.addEventListener("submit", handleSubjectSubmit);
  subjectsList.addEventListener("click", handleSubjectDelete);
  clearSubjectFormButton.addEventListener("click", clearForm);

  confirmDeleteCancelButton.addEventListener("click", closeDeleteModal);
  confirmDeleteConfirmButton.addEventListener("click", confirmSubjectDeletion);
  confirmDeleteModal.addEventListener("click", handleModalOverlayClick);
  document.addEventListener("keydown", handleEscapeKey);

  renderSubjects();

  console.log("Sistema de matérias carregado.");
}

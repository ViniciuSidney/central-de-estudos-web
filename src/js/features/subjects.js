import { getCollection, saveCollection } from "../core/storage.js";
import { openConfirmModal } from "../ui/confirmModal.js";

const SUBJECTS_COLLECTION = "subjects";
const THEMES_COLLECTION = "themes";
const QUESTIONS_COLLECTION = "questions";

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

  if (
    !subjectForm ||
    !subjectNameInput ||
    !subjectDescriptionInput ||
    !clearSubjectFormButton ||
    !subjectFormMessage ||
    !subjectsList ||
    !subjectsEmptyState ||
    !subjectsCount
  ) {
    return;
  }

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

    openConfirmModal({
      tag: "⚠️ Confirmação",
      title: "Excluir matéria",
      message: `Tem certeza que deseja excluir a matéria "${subject.name}"?`,
      confirmText: "Excluir",
      cancelText: "Cancelar",
      onConfirm: () => {
        deleteSubject(subject.id);
      },
    });
  }

  function deleteSubject(subjectId) {
    const updatedSubjects = getSubjects().filter((currentSubject) => {
      return currentSubject.id !== subjectId;
    });

    deleteQuestionsFromSubject(subjectId);
    deleteThemesFromSubject(subjectId);
    saveSubjects(updatedSubjects);
    renderSubjects();
    notifySubjectsChanged();

    setFormMessage(
      "Matéria, temas e questões relacionadas excluídos com sucesso.",
      "success",
    );
  }

  function deleteThemesFromSubject(subjectId) {
    const updatedThemes = getCollection(THEMES_COLLECTION).filter((theme) => {
      return theme.subjectId !== subjectId;
    });

    saveCollection(THEMES_COLLECTION, updatedThemes);
  }

  function deleteQuestionsFromSubject(subjectId) {
    const updatedQuestions = getCollection(QUESTIONS_COLLECTION).filter(
      (question) => {
        return question.subjectId !== subjectId;
      },
    );

    saveCollection(QUESTIONS_COLLECTION, updatedQuestions);
  }

  function notifySubjectsChanged() {
    document.dispatchEvent(new CustomEvent("subjects:changed"));
  }

  subjectForm.addEventListener("submit", handleSubjectSubmit);
  subjectsList.addEventListener("click", handleSubjectDelete);
  clearSubjectFormButton.addEventListener("click", clearForm);

  renderSubjects();

  console.log("Sistema de matérias carregado.");
}

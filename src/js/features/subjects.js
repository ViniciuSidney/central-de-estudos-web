import { getCollection, saveCollection } from "../core/storage.js";

const SUBJECTS_COLLECTION = "subjects";

export function initSubjects() {
  const subjectForm = document.querySelector("#subject-form");
  const subjectNameInput = document.querySelector("#subject-name");
  const subjectDescriptionInput = document.querySelector("#subject-description");
  const subjectsList = document.querySelector("#subjects-list");
  const subjectsEmptyState = document.querySelector("#subjects-empty-state");
  const subjectsCount = document.querySelector("#subjects-count");
  const dashboardSubjectsCount = document.querySelector("#dashboard-subjects-count");

  if (
    !subjectForm ||
    !subjectNameInput ||
    !subjectDescriptionInput ||
    !subjectsList ||
    !subjectsEmptyState ||
    !subjectsCount ||
    !dashboardSubjectsCount
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
      createdAt: new Date().toISOString()
    };
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
        </div>

        <div class="subject-card__actions">
          <button class="button button--danger" type="button" data-delete-subject="${subject.id}">
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
    subjectNameInput.focus();
  }

  function handleSubjectSubmit(event) {
    event.preventDefault();

    const subjectName = subjectNameInput.value.trim();
    const subjectDescription = subjectDescriptionInput.value.trim();

    if (!subjectName) {
      subjectNameInput.focus();
      return;
    }

    const subjects = getSubjects();

    const newSubject = createSubject(subjectName, subjectDescription);

    subjects.push(newSubject);

    saveSubjects(subjects);
    renderSubjects();
    clearForm();
  }

  function handleSubjectDelete(event) {
    const deleteButton = event.target.closest("[data-delete-subject]");

    if (!deleteButton) {
      return;
    }

    const subjectId = deleteButton.dataset.deleteSubject;

    const updatedSubjects = getSubjects().filter((subject) => {
      return subject.id !== subjectId;
    });

    saveSubjects(updatedSubjects);
    renderSubjects();
  }

  subjectForm.addEventListener("submit", handleSubjectSubmit);
  subjectsList.addEventListener("click", handleSubjectDelete);

  renderSubjects();

  console.log("Sistema de matérias carregado.");
}
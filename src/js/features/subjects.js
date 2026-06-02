import { getCollection, saveCollection } from "../core/storage.js";
import { openConfirmModal } from "../ui/confirmModal.js";
import { compareNames, parseItemsFromListText } from "../systems/listTextImport.js";

const SUBJECTS_COLLECTION = "subjects";
const THEMES_COLLECTION = "themes";
const QUESTIONS_COLLECTION = "questions";

export function initSubjects() {
  const subjectForm = document.querySelector("#subject-form");
  const subjectNameInput = document.querySelector("#subject-name");
  const subjectDescriptionInput = document.querySelector("#subject-description");
  const clearSubjectFormButton = document.querySelector("#clear-subject-form");
  const subjectFormMessage = document.querySelector("#subject-form-message");
  const subjectsList = document.querySelector("#subjects-list");
  const subjectsEmptyState = document.querySelector("#subjects-empty-state");
  const subjectsCount = document.querySelector("#subjects-count");
  const subjectTabButtons = document.querySelectorAll("[data-subject-tab]");
  const subjectListTab = document.querySelector("#subject-list-tab");
  const subjectImportTab = document.querySelector("#subject-import-tab");
  const subjectImportAddedList = document.querySelector("#subject-import-added-list");
  const subjectImportAddedCount = document.querySelector("#subject-import-added-count");
  const subjectImportAddedEmpty = document.querySelector("#subject-import-added-empty");
  const subjectImportTextInput = document.querySelector("#subject-import-text");
  const validateSubjectImportButton = document.querySelector("#validate-subject-import");
  const clearSubjectImportButton = document.querySelector("#clear-subject-import");
  const importValidatedSubjectsButton = document.querySelector("#import-validated-subjects");
  const subjectImportSummary = document.querySelector("#subject-import-summary");
  const subjectImportList = document.querySelector("#subject-import-list");
  const subjectImportErrors = document.querySelector("#subject-import-errors");

  if (
    !subjectImportTextInput ||
    !validateSubjectImportButton ||
    !clearSubjectImportButton ||
    !importValidatedSubjectsButton ||
    !subjectImportSummary ||
    !subjectImportList ||
    !subjectImportErrors ||
    !subjectTabButtons.length ||
    !subjectListTab ||
    !subjectImportTab ||
    !subjectImportAddedList ||
    !subjectImportAddedCount ||
    !subjectImportAddedEmpty ||
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

  let importedSubjectsPreview = [];

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

  function formatCount(total, singular, plural) {
    return total === 1 ? `1 ${singular}` : `${total} ${plural}`;
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

    subjectsCount.textContent = totalSubjects === 1 ? "1 matéria" : `${totalSubjects} matérias`;
  }

  function updateSubjectImportAddedCount(subjects) {
    const totalSubjects = subjects.length;

    subjectImportAddedCount.textContent = totalSubjects === 1 ? "1 matéria" : `${totalSubjects} matérias`;
  }

  function renderSubjectImportAddedList(subjects) {
    subjectImportAddedList.innerHTML = "";

    updateSubjectImportAddedCount(subjects);

    if (subjects.length === 0) {
      subjectImportAddedEmpty.hidden = false;
      return;
    }

    subjectImportAddedEmpty.hidden = true;

    subjects.forEach((subject) => {
      const item = document.createElement("li");

      item.classList.add("subject-import-added-item");

      item.innerHTML = `
			<div class="subject-import-added-item__top">
				<strong>${subject.name}</strong>

				<button
				class="management-icon-button management-icon-button--danger"
				type="button"
				data-delete-subject="${subject.id}"
				aria-label="Excluir matéria ${subject.name}"
				title="Excluir matéria"
				>
				🗑️
				</button>
			</div>

			<span>${subject.description || "Sem descrição adicionada."}</span>
		`;

      subjectImportAddedList.appendChild(item);
    });
  }

  function renderSubjects() {
    const subjects = getSubjects();

    subjectsList.innerHTML = "";

    updateSubjectsCount(subjects);
    renderSubjectImportAddedList(subjects);

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
            class="management-icon-button management-icon-button--danger"
            type="button"
            data-delete-subject="${subject.id}"
            aria-label="Excluir matéria ${subject.name}"
            title="Excluir matéria"
          >
            🗑️
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

    const duplicatedSubject = subjects.find((subject) => {
      return compareNames(subject.name, subjectName);
    });

    if (duplicatedSubject) {
      setFormMessage(`A matéria "${duplicatedSubject.name}" já está cadastrada.`, "error");

      subjectNameInput.focus();
      return;
    }

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

    setFormMessage("Matéria, temas e questões relacionadas excluídos com sucesso.", "success");
  }

  function deleteThemesFromSubject(subjectId) {
    const updatedThemes = getCollection(THEMES_COLLECTION).filter((theme) => {
      return theme.subjectId !== subjectId;
    });

    saveCollection(THEMES_COLLECTION, updatedThemes);
  }

  function deleteQuestionsFromSubject(subjectId) {
    const updatedQuestions = getCollection(QUESTIONS_COLLECTION).filter((question) => {
      return question.subjectId !== subjectId;
    });

    saveCollection(QUESTIONS_COLLECTION, updatedQuestions);
  }

  function notifySubjectsChanged() {
    document.dispatchEvent(new CustomEvent("subjects:changed"));
  }

  function showSubjectTab(tabName) {
    subjectTabButtons.forEach((button) => {
      const isActive = button.dataset.subjectTab === tabName;

      button.classList.toggle("is-active", isActive);
    });

    subjectListTab.classList.toggle("is-active", tabName === "list");
    subjectImportTab.classList.toggle("is-active", tabName === "import");
  }

  function setSubjectImportSummary({ title = "Aguardando validação.", description = "Cole a lista e clique em Validar matérias.", type = "default" } = {}) {
    subjectImportSummary.innerHTML = `
    <strong>${title}</strong>
    <span>${description}</span>
  `;

    subjectImportSummary.classList.remove("is-success", "is-error");

    if (type === "success") {
      subjectImportSummary.classList.add("is-success");
    }

    if (type === "error") {
      subjectImportSummary.classList.add("is-error");
    }
  }

  function renderSubjectImportList(items = []) {
    subjectImportList.innerHTML = "";

    items.forEach((item) => {
      const listItem = document.createElement("li");

      listItem.textContent = item;

      subjectImportList.appendChild(listItem);
    });
  }

  function renderSubjectImportErrors(errors = []) {
    subjectImportErrors.innerHTML = "";

    errors.forEach((error) => {
      const errorItem = document.createElement("li");

      errorItem.textContent = error;

      subjectImportErrors.appendChild(errorItem);
    });
  }

  function clearSubjectImport() {
    importedSubjectsPreview = [];

    subjectImportTextInput.value = "";
    importValidatedSubjectsButton.disabled = true;

    setSubjectImportSummary();
    renderSubjectImportList();
    renderSubjectImportErrors();

    subjectImportTextInput.focus();
  }

  function validateSubjectImport() {
    const result = parseItemsFromListText(subjectImportTextInput.value);
    const currentSubjects = getSubjects();

    const duplicatedInStorage = [];
    const validSubjects = [];

    result.items.forEach((subjectName) => {
      const alreadyExists = currentSubjects.some((subject) => {
        return compareNames(subject.name, subjectName);
      });

      if (alreadyExists) {
        duplicatedInStorage.push(subjectName);
        return;
      }

      validSubjects.push(subjectName);
    });

    importedSubjectsPreview = validSubjects;

    const errors = [...result.errors];

    result.duplicatedItems.forEach((item) => {
      errors.push(`"${item}" aparece repetido na lista e será ignorado.`);
    });

    duplicatedInStorage.forEach((item) => {
      errors.push(`"${item}" já está cadastrado e será ignorado.`);
    });

    renderSubjectImportList(validSubjects);
    renderSubjectImportErrors(errors);

    importValidatedSubjectsButton.disabled = validSubjects.length === 0;

    if (validSubjects.length === 0 && errors.length > 0) {
      setSubjectImportSummary({
        title: "Nenhuma matéria nova encontrada.",
        description: `${formatCount(errors.length, "aviso encontrado", "avisos encontrados")}. Ajuste a lista e valide novamente.`,
        type: "error",
      });

      return;
    }

    if (validSubjects.length > 0 && errors.length > 0) {
      setSubjectImportSummary({
        title: `${formatCount(validSubjects.length, "matéria pronta", "matérias prontas")} para importação.`,
        description: `${formatCount(errors.length, "item ignorado", "itens ignorados")} por repetição ou duplicidade.`,
        type: "success",
      });

      return;
    }

    setSubjectImportSummary({
      title: `${formatCount(validSubjects.length, "matéria pronta", "matérias prontas")} para importação.`,
      description: "Nenhum problema encontrado. Você já pode importar as matérias.",
      type: "success",
    });
  }

  function importValidatedSubjects() {
    if (importedSubjectsPreview.length === 0) {
      setSubjectImportSummary({
        title: "Nenhuma matéria validada.",
        description: "Valide uma lista antes de importar.",
        type: "error",
      });

      return;
    }

    const subjects = getSubjects();

    const newSubjects = importedSubjectsPreview.map((subjectName) => {
      return createSubject(subjectName, "");
    });

    saveSubjects([...subjects, ...newSubjects]);
    notifySubjectsChanged();

    importedSubjectsPreview = [];
    subjectImportTextInput.value = "";
    importValidatedSubjectsButton.disabled = true;

    setSubjectImportSummary({
      title: `${formatCount(newSubjects.length, "matéria importada", "matérias importadas")} com sucesso.`,
      description: "As matérias foram adicionadas à sua base de estudos.",
      type: "success",
    });

    renderSubjectImportList();
    renderSubjectImportErrors();

    showSubjectTab("list");
  }

  // Event Listeners

  subjectTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showSubjectTab(button.dataset.subjectTab);
    });
  });
  subjectForm.addEventListener("submit", handleSubjectSubmit);
  subjectsList.addEventListener("click", handleSubjectDelete);
  subjectImportAddedList.addEventListener("click", handleSubjectDelete);
  clearSubjectFormButton.addEventListener("click", clearForm);

  validateSubjectImportButton.addEventListener("click", validateSubjectImport);
  clearSubjectImportButton.addEventListener("click", clearSubjectImport);
  importValidatedSubjectsButton.addEventListener("click", importValidatedSubjects);

  document.addEventListener("subjects:changed", () => {
    renderSubjects();
  });

  document.addEventListener("app:data-reset", () => {
    clearForm();
    renderSubjects();
  });

  renderSubjects();
  showSubjectTab("list");

  console.log("Sistema de matérias carregado.");
}

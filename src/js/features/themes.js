import { getCollection } from "../core/storage.js";

const SUBJECTS_COLLECTION = "subjects";

export function initThemes() {
  const themeForm = document.querySelector("#theme-form");
  const themeSubjectSelect = document.querySelector("#theme-subject");
  const themeNameInput = document.querySelector("#theme-name");
  const themeDescriptionInput = document.querySelector("#theme-description");
  const clearThemeFormButton = document.querySelector("#clear-theme-form");
  const themeFormMessage = document.querySelector("#theme-form-message");
  const themeNoSubjectWarning = document.querySelector(
    "#theme-no-subject-warning",
  );
  const themesCurrentSubject = document.querySelector(
    "#themes-current-subject",
  );
  const themesCount = document.querySelector("#themes-count");
  const themesEmptyState = document.querySelector("#themes-empty-state");
  const themesList = document.querySelector("#themes-list");
  const dashboardThemesCount = document.querySelector(
    "#dashboard-themes-count",
  );

  if (
    !themeForm ||
    !themeSubjectSelect ||
    !themeNameInput ||
    !themeDescriptionInput ||
    !clearThemeFormButton ||
    !themeFormMessage ||
    !themeNoSubjectWarning ||
    !themesCurrentSubject ||
    !themesCount ||
    !themesEmptyState ||
    !themesList ||
    !dashboardThemesCount
  ) {
    return;
  }

  function getSubjects() {
    return getCollection(SUBJECTS_COLLECTION);
  }

  function setThemeFormMessage(message, type = "default") {
    themeFormMessage.textContent = message;

    themeFormMessage.classList.remove("is-error", "is-success");

    if (type === "error") {
      themeFormMessage.classList.add("is-error");
    }

    if (type === "success") {
      themeFormMessage.classList.add("is-success");
    }
  }

  function clearThemeForm() {
    themeNameInput.value = "";
    themeDescriptionInput.value = "";
    setThemeFormMessage("");
    themeNameInput.focus();
  }

  function renderSubjectOptions() {
    const subjects = getSubjects();
    const previousSelectedSubjectId = themeSubjectSelect.value;

    themeSubjectSelect.innerHTML = `
    <option value="">Selecione uma matéria</option>
  `;

    subjects.forEach((subject) => {
      const option = document.createElement("option");

      option.value = subject.id;
      option.textContent = subject.name;

      themeSubjectSelect.appendChild(option);
    });

    const hasSubjects = subjects.length > 0;
    const selectedSubjectStillExists = subjects.some((subject) => {
      return subject.id === previousSelectedSubjectId;
    });

    themeNoSubjectWarning.hidden = hasSubjects;
    themeForm.hidden = !hasSubjects;

    if (!hasSubjects) {
      themeSubjectSelect.value = "";

      themesCurrentSubject.textContent =
        "Cadastre uma matéria antes de criar temas.";

      themesCount.textContent = "0 temas";
      dashboardThemesCount.textContent = "0";
      themesEmptyState.hidden = false;
      themesList.innerHTML = "";

      return;
    }

    if (selectedSubjectStillExists) {
      themeSubjectSelect.value = previousSelectedSubjectId;
    } else {
      themeSubjectSelect.value = "";
    }

    updateSelectedSubjectText();
  }

  function updateSelectedSubjectText() {
    const selectedSubjectId = themeSubjectSelect.value;
    const subjects = getSubjects();

    const selectedSubject = subjects.find((subject) => {
      return subject.id === selectedSubjectId;
    });

    if (!selectedSubject) {
      themesCurrentSubject.textContent =
        "Selecione uma matéria para visualizar seus temas.";
      return;
    }

    themesCurrentSubject.textContent = `Temas de ${selectedSubject.name}`;
  }

  function handleThemeSubmit(event) {
    event.preventDefault();

    setThemeFormMessage(
      "O cadastro real de temas será implementado na próxima etapa.",
      "success",
    );
  }

  themeForm.addEventListener("submit", handleThemeSubmit);
  themeSubjectSelect.addEventListener("change", updateSelectedSubjectText);
  clearThemeFormButton.addEventListener("click", clearThemeForm);
  document.addEventListener("subjects:changed", renderSubjectOptions);
  
  renderSubjectOptions();
  updateSelectedSubjectText();

  console.log("Sistema de temas carregado.");
}

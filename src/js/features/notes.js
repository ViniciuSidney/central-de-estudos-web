import { getCollection, saveCollection } from "../core/storage.js";

const SUBJECTS_COLLECTION = "subjects";
const THEMES_COLLECTION = "themes";
const NOTES_COLLECTION = "notes";

export function initNotes() {
  const noteWarning = document.querySelector("#note-warning");
  const noteSelectorPanel = document.querySelector("#note-selector-panel");
  const noteSubjectSelect = document.querySelector("#note-subject");
  const noteThemeSelect = document.querySelector("#note-theme");
  const noteForm = document.querySelector("#note-form");
  const noteSummaryInput = document.querySelector("#note-summary");
  const noteObservationsInput = document.querySelector("#note-observations");
  const noteRulesInput = document.querySelector("#note-rules");
  const noteMessage = document.querySelector("#note-message");
  const clearNoteFormButton = document.querySelector("#clear-note-form");
  const notesCurrentTheme = document.querySelector("#notes-current-theme");
  const notesCount = document.querySelector("#notes-count");
  const notesEmpty = document.querySelector("#notes-empty");
  const notesList = document.querySelector("#notes-list");

  if (
    !noteWarning ||
    !noteSelectorPanel ||
    !noteSubjectSelect ||
    !noteThemeSelect ||
    !noteForm ||
    !noteSummaryInput ||
    !noteObservationsInput ||
    !noteRulesInput ||
    !noteMessage ||
    !clearNoteFormButton ||
    !notesCurrentTheme ||
    !notesCount ||
    !notesEmpty ||
    !notesList
  ) {
    return;
  }

  function getSubjects() {
    return getCollection(SUBJECTS_COLLECTION);
  }

  function getThemes() {
    return getCollection(THEMES_COLLECTION);
  }

  function getNotes() {
    return getCollection(NOTES_COLLECTION);
  }

  function saveNotes(notes) {
    saveCollection(NOTES_COLLECTION, notes);
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setNoteMessage(message, type = "default") {
    noteMessage.textContent = message;
    noteMessage.classList.remove("is-error", "is-success");

    if (type === "error") {
      noteMessage.classList.add("is-error");
    }

    if (type === "success") {
      noteMessage.classList.add("is-success");
    }
  }

  function getSelectedSubject() {
    return getSubjects().find((subject) => {
      return subject.id === noteSubjectSelect.value;
    });
  }

  function getSelectedTheme() {
    return getThemes().find((theme) => {
      return theme.id === noteThemeSelect.value;
    });
  }

  function getNoteByThemeId(themeId) {
    return getNotes().find((note) => {
      return note.themeId === themeId;
    });
  }

  function formatDateTime(dateValue) {
    const date = new Date(dateValue);

    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderSubjectOptions() {
    const subjects = getSubjects();
    const themes = getThemes();

    const hasSubjectsAndThemes = subjects.length > 0 && themes.length > 0;

    noteWarning.hidden = hasSubjectsAndThemes;
    noteSelectorPanel.hidden = !hasSubjectsAndThemes;
    noteForm.hidden = !hasSubjectsAndThemes;

    noteSubjectSelect.innerHTML = `
      <option value="">Selecione uma matéria</option>
    `;

    subjects.forEach((subject) => {
      const option = document.createElement("option");

      option.value = subject.id;
      option.textContent = subject.name;

      noteSubjectSelect.appendChild(option);
    });

    renderThemeOptions();
    renderSelectedNote();
  }

  function renderThemeOptions() {
    const selectedSubject = getSelectedSubject();

    noteThemeSelect.innerHTML = `
      <option value="">Selecione um tema</option>
    `;

    if (!selectedSubject) {
      return;
    }

    const themesFromSubject = getThemes().filter((theme) => {
      return theme.subjectId === selectedSubject.id;
    });

    themesFromSubject.forEach((theme) => {
      const option = document.createElement("option");

      option.value = theme.id;
      option.textContent = theme.name;

      noteThemeSelect.appendChild(option);
    });
  }

  function clearFormFields() {
    noteSummaryInput.value = "";
    noteObservationsInput.value = "";
    noteRulesInput.value = "";
    setNoteMessage("");
  }

  function fillFormWithNote(note) {
    noteSummaryInput.value = note?.summary || "";
    noteObservationsInput.value = note?.observations || "";
    noteRulesInput.value = note?.rules || "";
  }

  function createNote({ subjectId, themeId, summary, observations, rules }) {
    return {
      id: crypto.randomUUID(),
      subjectId,
      themeId,
      summary,
      observations,
      rules,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function renderSelectedNote() {
    const selectedSubject = getSelectedSubject();
    const selectedTheme = getSelectedTheme();

    notesList.innerHTML = "";

    if (!selectedSubject || !selectedTheme) {
      notesCurrentTheme.textContent = "Selecione um tema para visualizar a anotação.";
      notesCount.textContent = "0 anotações";
      notesEmpty.hidden = false;
      clearFormFields();
      return;
    }

    const note = getNoteByThemeId(selectedTheme.id);

    notesCurrentTheme.innerHTML = `
      Anotação de <span class="highlighted-theme-name">${escapeHTML(selectedTheme.name)}</span>
    `;

    fillFormWithNote(note);

    if (!note) {
      notesCount.textContent = "0 anotações";
      notesEmpty.hidden = false;
      return;
    }

    notesCount.textContent = "1 anotação";
    notesEmpty.hidden = true;

    const noteCard = document.createElement("article");

    noteCard.classList.add("note-card");

    noteCard.innerHTML = `
      <div class="note-card__section">
        <small>Resumo</small>
        <p>${escapeHTML(note.summary || "Nenhum resumo registrado.")}</p>
      </div>

      <div class="note-card__section">
        <small>Observações</small>
        <p>${escapeHTML(note.observations || "Nenhuma observação registrada.")}</p>
      </div>

      <div class="note-card__section">
        <small>Regras importantes</small>
        <p>${escapeHTML(note.rules || "Nenhuma regra registrada.")}</p>
      </div>

      <span class="note-card__meta">
        Última edição em ${escapeHTML(formatDateTime(note.updatedAt))}
      </span>
    `;

    notesList.appendChild(noteCard);
  }

  function saveCurrentNote(event) {
    event.preventDefault();

    const selectedSubject = getSelectedSubject();
    const selectedTheme = getSelectedTheme();

    if (!selectedSubject) {
      setNoteMessage("Selecione uma matéria antes de salvar.", "error");
      return;
    }

    if (!selectedTheme) {
      setNoteMessage("Selecione um tema antes de salvar.", "error");
      return;
    }

    const summary = noteSummaryInput.value.trim();
    const observations = noteObservationsInput.value.trim();
    const rules = noteRulesInput.value.trim();

    if (!summary && !observations && !rules) {
      setNoteMessage("Preencha pelo menos um campo da anotação.", "error");
      return;
    }

    const notes = getNotes();

    const existingNoteIndex = notes.findIndex((note) => {
      return note.themeId === selectedTheme.id;
    });

    if (existingNoteIndex !== -1) {
      notes[existingNoteIndex] = {
        ...notes[existingNoteIndex],
        summary,
        observations,
        rules,
        updatedAt: new Date().toISOString(),
      };
    } else {
      notes.push(
        createNote({
          subjectId: selectedSubject.id,
          themeId: selectedTheme.id,
          summary,
          observations,
          rules,
        }),
      );
    }

    saveNotes(notes);
    document.dispatchEvent(new CustomEvent("notes:changed"));

    setNoteMessage("Anotação salva com sucesso.", "success");
    renderSelectedNote();
  }

  noteSubjectSelect.addEventListener("change", () => {
    noteThemeSelect.value = "";
    renderThemeOptions();
    renderSelectedNote();
  });

  noteThemeSelect.addEventListener("change", renderSelectedNote);

  noteForm.addEventListener("submit", saveCurrentNote);

  clearNoteFormButton.addEventListener("click", () => {
    clearFormFields();
  });

  document.addEventListener("subjects:changed", renderSubjectOptions);
  document.addEventListener("themes:changed", renderSubjectOptions);
  document.addEventListener("notes:changed", renderSelectedNote);

  renderSubjectOptions();

  console.log("Sistema de anotações carregado.");
}
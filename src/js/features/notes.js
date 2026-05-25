import { getCollection, saveCollection } from "../core/storage.js";
import { openConfirmModal } from "../ui/confirmModal.js";

const SUBJECTS_COLLECTION = "subjects";
const THEMES_COLLECTION = "themes";
const NOTES_COLLECTION = "notes";

const NOTE_TYPE_LABELS = {
  resumo: "Resumo",
  erro: "Erro",
  regra: "Regra",
  duvida: "Dúvida",
  exemplo: "Exemplo",
  insight: "Insight",
  revisao: "Revisão",
};

export function initNotes() {
  const noteForm = document.querySelector("#note-form");
  const noteTitleInput = document.querySelector("#note-title");
  const noteTypeSelect = document.querySelector("#note-type");
  const noteSubjectSelect = document.querySelector("#note-subject");
  const noteThemeSelect = document.querySelector("#note-theme");
  const noteContentInput = document.querySelector("#note-content");
  const noteMessage = document.querySelector("#note-message");
  const clearNoteFormButton = document.querySelector("#clear-note-form");
  const notesCount = document.querySelector("#notes-count");
  const notesEmpty = document.querySelector("#notes-empty");
  const notesList = document.querySelector("#notes-list");

  if (
    !noteForm ||
    !noteTitleInput ||
    !noteTypeSelect ||
    !noteSubjectSelect ||
    !noteThemeSelect ||
    !noteContentInput ||
    !noteMessage ||
    !clearNoteFormButton ||
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

  function notifyNotesChanged() {
    document.dispatchEvent(new CustomEvent("notes:changed"));
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(dateValue) {
    const date = new Date(dateValue);

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function getShortText(text, maxLength = 180) {
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength).trim()}...`;
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

  function getSubjectById(subjectId) {
    return getSubjects().find((subject) => {
      return subject.id === subjectId;
    });
  }

  function getThemeById(themeId) {
    return getThemes().find((theme) => {
      return theme.id === themeId;
    });
  }

  function getSubjectNameById(subjectId) {
    const subject = getSubjectById(subjectId);

    return subject ? subject.name : "Matéria removida";
  }

  function getThemeNameById(themeId) {
    const theme = getThemeById(themeId);

    return theme ? theme.name : "Tema removido";
  }

  function getNoteTypeLabel(type) {
    return NOTE_TYPE_LABELS[type] || "Tipo não definido";
  }

  function createNote({ title, content, type, subjectId, themeId }) {
    return {
      id: crypto.randomUUID(),
      title,
      content,
      type,
      subjectId: subjectId || null,
      themeId: themeId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function clearNoteForm() {
    noteTitleInput.value = "";
    noteTypeSelect.value = "";
    noteSubjectSelect.value = "";
    noteThemeSelect.value = "";

    noteThemeSelect.innerHTML = `
			<option value="">Nenhum tema</option>
		`;

    noteThemeSelect.disabled = true;
    noteContentInput.value = "";

    setNoteMessage("");
  }

  function renderSubjectOptions() {
    const subjects = getSubjects();
    const previousSubjectId = noteSubjectSelect.value;

    noteSubjectSelect.innerHTML = `
			<option value="">Nenhuma matéria</option>
		`;

    subjects.forEach((subject) => {
      const option = document.createElement("option");

      option.value = subject.id;
      option.textContent = subject.name;

      noteSubjectSelect.appendChild(option);
    });

    const subjectStillExists = subjects.some((subject) => {
      return subject.id === previousSubjectId;
    });

    noteSubjectSelect.value = subjectStillExists ? previousSubjectId : "";

    renderThemeOptions();
  }

  function renderThemeOptions() {
    const selectedSubjectId = noteSubjectSelect.value;
    const previousThemeId = noteThemeSelect.value;

    noteThemeSelect.innerHTML = `
			<option value="">Nenhum tema</option>
		`;

    if (!selectedSubjectId) {
      noteThemeSelect.disabled = true;
      noteThemeSelect.value = "";
      return;
    }

    const themesFromSubject = getThemes().filter((theme) => {
      return theme.subjectId === selectedSubjectId;
    });

    themesFromSubject.forEach((theme) => {
      const option = document.createElement("option");

      option.value = theme.id;
      option.textContent = theme.name;

      noteThemeSelect.appendChild(option);
    });

    noteThemeSelect.disabled = themesFromSubject.length === 0;

    const themeStillExists = themesFromSubject.some((theme) => {
      return theme.id === previousThemeId;
    });

    noteThemeSelect.value = themeStillExists ? previousThemeId : "";
  }

  function renderNotes() {
    const notes = getNotes()
      .slice()
      .sort((firstNote, secondNote) => {
        return new Date(secondNote.createdAt) - new Date(firstNote.createdAt);
      });

    notesList.innerHTML = "";

    notesCount.textContent =
      notes.length === 1 ? "1 anotação" : `${notes.length} anotações`;

    if (notes.length === 0) {
      notesEmpty.hidden = false;
      return;
    }

    notesEmpty.hidden = true;

    notes.forEach((note) => {
      const noteCard = document.createElement("article");

      const subjectName = note.subjectId
        ? getSubjectNameById(note.subjectId)
        : "Livre";

      const themeName = note.themeId
        ? getThemeNameById(note.themeId)
        : "Sem tema";

      noteCard.classList.add("note-card");
      noteCard.dataset.noteId = note.id;

      noteCard.innerHTML = `
				<div class="note-card__content">
					<div class="note-card__top">
						<h3>${escapeHTML(note.title)}</h3>

						<span class="note-card__type">
							${escapeHTML(getNoteTypeLabel(note.type))}
						</span>
					</div>

					<p class="note-card__preview">
						${escapeHTML(getShortText(note.content))}
					</p>

					<div class="note-card__meta">
						<span>Matéria: ${escapeHTML(subjectName)}</span>
						<span>Tema: ${escapeHTML(themeName)}</span>
						<span>Criada em ${escapeHTML(formatDate(note.createdAt))}</span>
					</div>
				</div>

				<div class="note-card__actions">
					<button
						class="button button--danger"
						type="button"
						data-delete-note="${note.id}"
					>
						Excluir
					</button>
				</div>
			`;

      notesList.appendChild(noteCard);
    });
  }

  function handleNoteSubmit(event) {
    event.preventDefault();

    const title = noteTitleInput.value.trim();
    const type = noteTypeSelect.value;
    const subjectId = noteSubjectSelect.value;
    const themeId = noteThemeSelect.value;
    const content = noteContentInput.value.trim();

    if (!title) {
      setNoteMessage("Informe um título para a anotação.", "error");
      noteTitleInput.focus();
      return;
    }

    if (!type) {
      setNoteMessage("Selecione o tipo da anotação.", "error");
      noteTypeSelect.focus();
      return;
    }

    if (!content) {
      setNoteMessage("Escreva o conteúdo da anotação.", "error");
      noteContentInput.focus();
      return;
    }

    if (themeId && !subjectId) {
      setNoteMessage(
        "Para vincular um tema, selecione uma matéria primeiro.",
        "error",
      );
      noteSubjectSelect.focus();
      return;
    }

    const notes = getNotes();

    const newNote = createNote({
      title,
      content,
      type,
      subjectId,
      themeId,
    });

    notes.push(newNote);

    saveNotes(notes);
    notifyNotesChanged();

    setNoteMessage("Anotação criada com sucesso.", "success");
    clearNoteForm();
    renderNotes();
  }

  function deleteNote(noteId) {
    const updatedNotes = getNotes().filter((note) => {
      return note.id !== noteId;
    });

    saveNotes(updatedNotes);
    notifyNotesChanged();

    renderNotes();
    setNoteMessage("Anotação excluída com sucesso.", "success");
  }

  function requestNoteDeletion(note) {
    openConfirmModal({
      title: "Excluir anotação?",
      message: `A anotação "${note.title}" será removida permanentemente.`,
      confirmText: "Excluir",
      cancelText: "Cancelar",
      onConfirm: () => {
        deleteNote(note.id);
      },
    });
  }

  function handleNoteDelete(event) {
    const deleteButton = event.target.closest("[data-delete-note]");

    if (!deleteButton) {
      return;
    }

    const noteId = deleteButton.dataset.deleteNote;

    const note = getNotes().find((currentNote) => {
      return currentNote.id === noteId;
    });

    if (!note) {
      return;
    }

    requestNoteDeletion(note);
  }

  noteForm.addEventListener("submit", handleNoteSubmit);

  clearNoteFormButton.addEventListener("click", clearNoteForm);

  noteSubjectSelect.addEventListener("change", () => {
    noteThemeSelect.value = "";
    renderThemeOptions();
  });

  notesList.addEventListener("click", handleNoteDelete);

  document.addEventListener("subjects:changed", renderSubjectOptions);
  document.addEventListener("themes:changed", renderThemeOptions);
  document.addEventListener("notes:changed", renderNotes);

  renderSubjectOptions();
  renderNotes();

  console.log("Sistema de anotações carregado.");
}

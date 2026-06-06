import {getCollection, saveCollection} from '../core/storage.js';
import {openConfirmModal} from '../ui/confirmModal.js';

const SUBJECTS_COLLECTION = 'subjects';
const THEMES_COLLECTION = 'themes';
const NOTES_COLLECTION = 'notes';

const NOTE_TYPE_LABELS = {
	resumo: 'Resumo',
	erro: 'Erro',
	regra: 'Regra',
	duvida: 'Dúvida',
	exemplo: 'Exemplo',
	insight: 'Insight',
	revisao: 'Revisão'
};

const NOTE_STATUS_LABELS = {
	rascunho: 'Rascunho',
	finalizada: 'Finalizada',
	revisar: 'Revisar depois',
	flashcard: 'Virar flashcard',
	importante: 'Importante'
};

const NOTE_STATUS_ICONS = {
	rascunho: '✏️',
	finalizada: '✅',
	revisar: '🔁',
	flashcard: '🃏',
	importante: '⚠️'
};

export function initNotes() {
	const noteForm = document.querySelector('#note-form');
	const noteTitleInput = document.querySelector('#note-title');
	const noteTypeSelect = document.querySelector('#note-type');
	const noteSubjectSelect = document.querySelector('#note-subject');
	const noteThemeSelect = document.querySelector('#note-theme');
	const noteContentInput = document.querySelector('#note-content');

	const noteMessage = document.querySelector('#note-form-message');
	const clearNoteFormButton = document.querySelector('#clear-note-button');
	const notesCount = document.querySelector('#notes-counter');
	const notesList = document.querySelector('#notes-list');

	const saveNoteButton = document.querySelector('#save-note-button');

	const viewNoteModal = document.querySelector('#view-note-modal');
	const viewNoteTitle = document.querySelector('#view-note-title');
	const viewNoteDescription = document.querySelector('#view-note-description');
	const viewNoteType = document.querySelector('#view-note-type');
	const viewNoteMeta = document.querySelector('#view-note-meta');
	const viewNoteContent = document.querySelector('#view-note-content');
	const viewNoteContentEdit = document.querySelector('#view-note-content-edit');
	const viewNoteMessage = document.querySelector('#view-note-message');
	const closeViewNoteButton = document.querySelector('#close-view-note');
	const quickEditNoteButton = document.querySelector('#quick-edit-note');

	const noteStatusSelect = document.querySelector('#note-status');
	const noteTagsInput = document.querySelector('#note-tags');

	const noteSearchInput = document.querySelector('#notes-search-input');
	const noteFilterSubjectSelect = document.querySelector('#notes-filter-subject');
	const noteFilterThemeSelect = document.querySelector('#notes-filter-theme');
	const noteFilterTypeSelect = document.querySelector('#notes-filter-type');
	const noteFilterStatusSelect = document.querySelector('#notes-filter-status');

	const toggleNoteFiltersButton = document.querySelector('#toggle-note-filters-button');

	const noteFiltersAdvanced = document.querySelector('#notes-filters-panel');

	const notesGalleryTabButton = document.querySelector('#notes-gallery-tab-button');
	const notesFormTabButton = document.querySelector('#notes-form-tab-button');

	const notesGalleryView = document.querySelector('#notes-gallery-view');
	const notesFormView = document.querySelector('#notes-form-view');

	const notesBackToGalleryButton = document.querySelector('#notes-back-to-gallery-button');

	const openMarkdownHelpButton = document.querySelector('#notes-markdown-help-button');
	const markdownHelpModal = document.querySelector('#markdown-help-modal');
	const closeMarkdownHelpButton = document.querySelector('#close-markdown-help');
	const openFocusedEditorButton = document.querySelector('#notes-focused-editor-button');

	const noteFilterArchiveSelect = document.querySelector('#notes-filter-archive');

	if (
		!noteFilterArchiveSelect ||
		!openFocusedEditorButton ||
		!openMarkdownHelpButton ||
		!markdownHelpModal ||
		!closeMarkdownHelpButton ||
		!notesGalleryTabButton ||
		!notesFormTabButton ||
		!notesGalleryView ||
		!notesFormView ||
		!notesBackToGalleryButton ||
		!toggleNoteFiltersButton ||
		!noteFiltersAdvanced ||
		!noteSearchInput ||
		!noteFilterSubjectSelect ||
		!noteFilterThemeSelect ||
		!noteFilterTypeSelect ||
		!noteFilterStatusSelect ||
		!noteStatusSelect ||
		!noteTagsInput ||
		!viewNoteModal ||
		!viewNoteTitle ||
		!viewNoteDescription ||
		!viewNoteType ||
		!viewNoteMeta ||
		!viewNoteContent ||
		!viewNoteContentEdit ||
		!viewNoteMessage ||
		!closeViewNoteButton ||
		!quickEditNoteButton ||
		!saveNoteButton ||
		!noteTitleInput ||
		!noteTypeSelect ||
		!noteSubjectSelect ||
		!noteThemeSelect ||
		!noteContentInput ||
		!noteMessage ||
		!clearNoteFormButton ||
		!notesCount ||
		!notesList
	) {
		console.warn('Sistema de anotações não iniciado: elementos não encontrados.');
		return;
	}

	let editingNoteId = null;
	let viewingNoteId = null;
	let isQuickEditingNote = false;
	let isFocusedEditorFromForm = false;

	function getSubjects() {
		return getCollection(SUBJECTS_COLLECTION);
	}

	function getThemes() {
		return getCollection(THEMES_COLLECTION);
	}

	function getNotes() {
		return getCollection(NOTES_COLLECTION);
	}

	function getNoteStatusLabel(status) {
		return NOTE_STATUS_LABELS[status] || 'Rascunho';
	}

	function getNoteStatusIcon(status) {
		return NOTE_STATUS_ICONS[status] || '✏️';
	}

	function saveNotes(notes) {
		saveCollection(NOTES_COLLECTION, notes);
	}

	function notifyNotesChanged() {
		document.dispatchEvent(new CustomEvent('notes:changed'));
	}

	function escapeHTML(value) {
		return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
	}

	function formatDate(dateValue) {
		const date = new Date(dateValue);

		return date.toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	function getShortText(text, maxLength = 180) {
		if (text.length <= maxLength) {
			return text;
		}

		return `${text.slice(0, maxLength).trim()}...`;
	}

	function setNoteMessage(message, type = 'default') {
		noteMessage.textContent = message;

		noteMessage.classList.remove('is-error', 'is-success');

		if (type === 'error') {
			noteMessage.classList.add('is-error');
		}

		if (type === 'success') {
			noteMessage.classList.add('is-success');
		}
	}

	function setNotesMode(mode) {
		const isGallery = mode === 'gallery';
		const isForm = mode === 'form';

		notesGalleryTabButton?.classList.toggle('is-active', isGallery);
		notesFormTabButton?.classList.toggle('is-active', isForm);

		notesGalleryView?.classList.toggle('is-active', isGallery);
		notesFormView?.classList.toggle('is-active', isForm);
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

		return subject ? subject.name : 'Matéria removida';
	}

	function getThemeNameById(themeId) {
		const theme = getThemeById(themeId);

		return theme ? theme.name : 'Tema removido';
	}

	function getNoteTypeLabel(type) {
		return NOTE_TYPE_LABELS[type] || 'Tipo não definido';
	}

	function enterEditMode(note) {
		editingNoteId = note.id;

		noteTitleInput.value = note.title;
		noteTypeSelect.value = note.type;
		noteSubjectSelect.value = note.subjectId || '';

		renderThemeOptions();

		noteThemeSelect.value = note.themeId || '';
		noteContentInput.value = note.content;

		noteStatusSelect.value = note.status || 'rascunho';
		noteTagsInput.value = formatTags(note.tags || []);

		saveNoteButton.textContent = 'Salvar alterações';

		setNoteMessage(`Editando a anotação "${note.title}".`, 'success');

		noteTitleInput.focus();
	}

	function exitEditMode() {
		editingNoteId = null;

		saveNoteButton.textContent = 'Salvar anotação';

		clearNoteForm();
	}

	function updateNote({noteId, title, content, type, status, tags, subjectId, themeId}) {
		const updatedNotes = getNotes().map((note) => {
			if (note.id !== noteId) {
				return note;
			}

			return {
				...note,
				title,
				content,
				type,
				status: status || 'rascunho',
				tags,
				subjectId: subjectId || null,
				themeId: themeId || null,
				updatedAt: new Date().toISOString()
			};
		});

		saveNotes(updatedNotes);
		notifyNotesChanged();

		setNoteMessage('Anotação atualizada com sucesso.', 'success');

		editingNoteId = null;
		saveNoteButton.textContent = 'Salvar anotação';

		clearNoteForm();
		renderNotes();
		showNoteTab('gallery');
	}

	function createNote({title, content, type, status, tags, subjectId, themeId, sourceAttemptId = null, sourceQuestionId = null, origin = null}) {
		return {
			id: crypto.randomUUID(),
			title,
			content,
			type,
			status: status || 'rascunho',
			tags,
			subjectId: subjectId || null,
			themeId: themeId || null,
			sourceAttemptId,
			sourceQuestionId,
			origin,
			isFavorite: false,
			isPinned: false,
			isArchived: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
	}

	function clearNoteForm() {
		noteTitleInput.value = '';
		noteTypeSelect.value = '';
		noteStatusSelect.value = 'rascunho';
		noteTagsInput.value = '';
		noteSubjectSelect.value = '';
		noteThemeSelect.value = '';

		noteThemeSelect.innerHTML = `
    <option value="">Nenhum tema</option>
  `;

		noteThemeSelect.disabled = true;
		noteContentInput.value = '';

		setNoteMessage('');
	}

	function renderSubjectOptions() {
		const subjects = getSubjects();
		const previousSubjectId = noteSubjectSelect.value;

		noteSubjectSelect.innerHTML = `
			<option value="">Nenhuma matéria</option>
		`;

		subjects.forEach((subject) => {
			const option = document.createElement('option');

			option.value = subject.id;
			option.textContent = subject.name;

			noteSubjectSelect.appendChild(option);
		});

		const subjectStillExists = subjects.some((subject) => {
			return subject.id === previousSubjectId;
		});

		noteSubjectSelect.value = subjectStillExists ? previousSubjectId : '';

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
			noteThemeSelect.value = '';
			return;
		}

		const themesFromSubject = getThemes().filter((theme) => {
			return theme.subjectId === selectedSubjectId;
		});

		themesFromSubject.forEach((theme) => {
			const option = document.createElement('option');

			option.value = theme.id;
			option.textContent = theme.name;

			noteThemeSelect.appendChild(option);
		});

		noteThemeSelect.disabled = themesFromSubject.length === 0;

		const themeStillExists = themesFromSubject.some((theme) => {
			return theme.id === previousThemeId;
		});

		noteThemeSelect.value = themeStillExists ? previousThemeId : '';
	}

	function clearNoteFilters() {
		noteSearchInput.value = '';
		noteFilterSubjectSelect.value = '';
		noteFilterThemeSelect.value = '';
		noteFilterTypeSelect.value = '';
		noteFilterStatusSelect.value = '';
		noteFilterTagSelect.value = '';
		noteFilterFlagSelect.value = 'active';

		renderFilterThemeOptions();
		renderNotes();
	}

	function renderNotes() {
		const totalNotes = getNotes().length;
		const notes = getFilteredNotes();

		notesList.innerHTML = '';

		if (totalNotes === 0) {
			notesCount.textContent = '0 anotações';
		} else if (notes.length === totalNotes) {
			notesCount.textContent = notes.length === 1 ? '1 anotação' : `${notes.length} anotações`;
		} else {
			notesCount.textContent = `${notes.length} de ${totalNotes} anotações`;
		}

		if (notes.length === 0) {
			notesList.innerHTML =
				totalNotes === 0
					? `
            <div class="empty-state">
              <strong>Nenhuma anotação cadastrada ainda.</strong>
              <span>Crie sua primeira anotação para começar a organizar seus estudos.</span>
            </div>
          `
					: `
            <div class="empty-state">
              <strong>Nenhuma anotação encontrada.</strong>
              <span>Tente ajustar a busca ou limpar os filtros aplicados.</span>
            </div>
          `;

			return;
		}

		notes.forEach((note) => {
			const noteCard = document.createElement('article');

			const subjectName = note.subjectId ? getSubjectNameById(note.subjectId) : '';

			const themeName = note.themeId ? getThemeNameById(note.themeId) : '';

			const visibleMetadata = getVisibleNoteMetadata(note, subjectName, themeName);

			noteCard.classList.add('note-card');
			if (note.isArchived) {
				noteCard.classList.add('is-archived');
			}
			noteCard.dataset.noteId = note.id;

			const tags = Array.isArray(note.tags) ? note.tags : [];
			const visibleTags = tags.slice(0, 2);
			const hiddenTags = tags.slice(2);
			const hiddenTagsCount = hiddenTags.length;

			noteCard.innerHTML = `
				<button
					class="note-card__cover"
					type="button"
					data-view-note="${note.id}"
					aria-label="Visualizar anotação ${escapeHTML(note.title)}"
				>
					<div class="note-card__heading">
						<div class="note-card__title-row">
							<h3>
							${note.isPinned ? '📌 ' : ''}
							${note.isFavorite ? '⭐ ' : ''}
							${getNoteStatusIcon(note.status)}
							${escapeHTML(note.title)}
							</h3>
						</div>

						<div class="note-card__badges">
						<span class="note-card__type">
							${escapeHTML(getNoteTypeLabel(note.type))}
						</span>

						${note.isArchived ? `<span class="note-card__status is-archived">Arquivada</span>` : ''}
						</div>
					</div>

				${
					visibleMetadata.length > 0
						? `
						<div class="note-card__meta">
						${visibleMetadata
							.map((metadata) => {
								return `<span>${escapeHTML(metadata)}</span>`;
							})
							.join('')}
						</div>
					`
						: ''
				}

					${
						visibleTags.length > 0
							? `
							<div class="note-card__tags">
                ${visibleTags
							.map((tag) => {
								return `<span class="note-card__tag">#${escapeHTML(tag)}</span>`;
							})
							.join('')}

                ${
							hiddenTagsCount > 0
								? `
                      <span class="note-card__tag note-card__tag-overflow">
                        +${hiddenTagsCount}

                        <span class="note-card__tag-tooltip">
                          ${hiddenTags
										.map((tag) => {
											return `<span>#${escapeHTML(tag)}</span>`;
										})
										.join('')}
                        </span>
                      </span>
                    `
								: ''
						}
							</div>
						`
							: ''
					}
				</button>

        <div class="note-card__actions note-card__actions--compact">
          <button
            class="note-card__action-button ${note.isFavorite ? 'is-active' : ''}"
            type="button"
            data-toggle-favorite-note="${note.id}"
            aria-label="${note.isFavorite ? 'Remover dos favoritos' : 'Favoritar anotação'}"
            title="${note.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}"
          >
            ⭐
            <span class="note-card__action-tooltip">
              ${note.isFavorite ? 'Remover favorito' : 'Favoritar'}
            </span>
          </button>

          <button
            class="note-card__action-button ${note.isPinned ? 'is-active' : ''}"
            type="button"
            data-toggle-pin-note="${note.id}"
            aria-label="${note.isPinned ? 'Desfixar anotação' : 'Fixar anotação'}"
            title="${note.isPinned ? 'Desfixar' : 'Fixar'}"
          >
            📌
            <span class="note-card__action-tooltip">
              ${note.isPinned ? 'Desfixar' : 'Fixar'}
            </span>
          </button>

          <button
            class="note-card__action-button ${note.isArchived ? 'is-active' : ''}"
            type="button"
            data-toggle-archive-note="${note.id}"
            aria-label="${note.isArchived ? 'Restaurar anotação' : 'Arquivar anotação'}"
            title="${note.isArchived ? 'Restaurar' : 'Arquivar'}"
          >
            📁
            <span class="note-card__action-tooltip">
              ${note.isArchived ? 'Restaurar' : 'Arquivar'}
            </span>
          </button>

          <button
            class="note-card__action-button"
            type="button"
            data-edit-note="${note.id}"
            aria-label="Editar anotação"
            title="Editar"
          >
            ✏️
            <span class="note-card__action-tooltip">Editar</span>
          </button>

          <button
            class="note-card__action-button note-card__action-button--danger"
            type="button"
            data-delete-note="${note.id}"
            aria-label="Excluir anotação"
            title="Excluir"
          >
            🗑️
            <span class="note-card__action-tooltip">Excluir</span>
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
		const status = noteStatusSelect.value;
		const subjectId = noteSubjectSelect.value;
		const themeId = noteThemeSelect.value;
		const tags = parseTags(noteTagsInput.value);
		const content = noteContentInput.value.trim();

		if (!title) {
			setNoteMessage('Informe um título para a anotação.', 'error');
			noteTitleInput.focus();
			return;
		}

		if (!type) {
			setNoteMessage('Selecione o tipo da anotação.', 'error');
			noteTypeSelect.focus();
			return;
		}

		if (!content) {
			setNoteMessage('Escreva o conteúdo da anotação.', 'error');
			noteContentInput.focus();
			return;
		}

		if (themeId && !subjectId) {
			setNoteMessage('Para vincular um tema, selecione uma matéria primeiro.', 'error');
			noteSubjectSelect.focus();
			return;
		}

		if (editingNoteId) {
			updateNote({
				noteId: editingNoteId,
				title,
				content,
				type,
				status,
				tags,
				subjectId,
				themeId
			});

			return;
		}

		const notes = getNotes();

		const newNote = createNote({
			title,
			content,
			type,
			status,
			tags,
			subjectId,
			themeId
		});

		notes.push(newNote);

		saveNotes(notes);
		notifyNotesChanged();

		setNoteMessage('Anotação criada com sucesso.', 'success');
		clearNoteForm();
		renderNotes();
		showNoteTab('gallery');
	}

	function handleNoteEdit(event) {
		const editButton = event.target.closest('[data-edit-note]');

		if (!editButton) {
			return;
		}

		closeOpenNoteMenus();

		const noteId = editButton.dataset.editNote;

		const note = getNotes().find((currentNote) => {
			return currentNote.id === noteId;
		});

		if (!note) {
			return;
		}

		prepareEditNoteMode(note);
	}

	function deleteNote(noteId) {
		const updatedNotes = getNotes().filter((note) => {
			return note.id !== noteId;
		});

		saveNotes(updatedNotes);
		notifyNotesChanged();

		renderNotes();
		setNoteMessage('Anotação excluída com sucesso.', 'success');
	}

	function requestNoteDeletion(note) {
		openConfirmModal({
			title: 'Excluir anotação?',
			message: `A anotação "${note.title}" será removida permanentemente.`,
			confirmText: 'Excluir',
			cancelText: 'Cancelar',
			onConfirm: () => {
				deleteNote(note.id);
			}
		});
	}

	function handleNoteDelete(event) {
		const deleteButton = event.target.closest('[data-delete-note]');

		if (!deleteButton) {
			return;
		}

		closeOpenNoteMenus();

		const noteId = deleteButton.dataset.deleteNote;

		const note = getNotes().find((currentNote) => {
			return currentNote.id === noteId;
		});

		if (!note) {
			return;
		}

		requestNoteDeletion(note);
	}

	function cleanupBrokenNoteLinks() {
		const subjects = getSubjects();
		const themes = getThemes();
		const notes = getNotes();

		const subjectIds = new Set(
			subjects.map((subject) => {
				return subject.id;
			})
		);

		const themeIds = new Set(
			themes.map((theme) => {
				return theme.id;
			})
		);

		let hasChanges = false;

		const updatedNotes = notes.map((note) => {
			const subjectWasRemoved = note.subjectId && !subjectIds.has(note.subjectId);
			const themeWasRemoved = note.themeId && !themeIds.has(note.themeId);

			if (subjectWasRemoved) {
				hasChanges = true;

				return {
					...note,
					subjectId: null,
					themeId: null,
					updatedAt: new Date().toISOString()
				};
			}

			if (themeWasRemoved) {
				hasChanges = true;

				return {
					...note,
					themeId: null,
					updatedAt: new Date().toISOString()
				};
			}

			return note;
		});

		if (!hasChanges) {
			return;
		}

		saveNotes(updatedNotes);
		notifyNotesChanged();
	}

	function enterQuickEditMode() {
		if (!viewingNoteId) {
			return;
		}

		isQuickEditingNote = true;

		viewNoteContent.hidden = true;
		viewNoteContentEdit.hidden = false;

		closeViewNoteButton.textContent = 'Cancelar';
		quickEditNoteButton.textContent = 'Confirmar edição';

		setViewNoteMessage('Editando apenas o conteúdo da anotação.', 'success');

		viewNoteContentEdit.focus();
	}

	function cancelQuickEditMode() {
		if (isFocusedEditorFromForm) {
			closeViewNoteModal();
			return;
		}

		const note = getNoteById(viewingNoteId);

		if (!note) {
			closeViewNoteModal();
			return;
		}

		renderViewNoteModal(note);
	}

	function confirmQuickEdit() {
		const newContent = viewNoteContentEdit.value.trim();

		if (!newContent) {
			setViewNoteMessage('O conteúdo da anotação não pode ficar vazio.', 'error');
			viewNoteContentEdit.focus();
			return;
		}

		if (isFocusedEditorFromForm) {
			noteContentInput.value = newContent;
			closeViewNoteModal();
			setNoteMessage('Conteúdo atualizado no formulário.', 'success');
			return;
		}

		const note = getNoteById(viewingNoteId);

		if (!note) {
			closeViewNoteModal();
			return;
		}

		const updatedNotes = getNotes().map((currentNote) => {
			if (currentNote.id !== note.id) {
				return currentNote;
			}

			return {
				...currentNote,
				content: newContent,
				updatedAt: new Date().toISOString()
			};
		});

		saveNotes(updatedNotes);
		notifyNotesChanged();

		const updatedNote = updatedNotes.find((currentNote) => {
			return currentNote.id === note.id;
		});

		renderViewNoteModal(updatedNote);
		renderNotes();

		setViewNoteMessage('Conteúdo atualizado com sucesso.', 'success');
	}

	function getNoteById(noteId) {
		return getNotes().find((note) => {
			return note.id === noteId;
		});
	}

	function formatDateTime(dateValue) {
		const date = new Date(dateValue);

		return date.toLocaleString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function setViewNoteMessage(message, type = 'default') {
		viewNoteMessage.textContent = message;

		viewNoteMessage.classList.remove('is-error', 'is-success');

		if (type === 'error') {
			viewNoteMessage.classList.add('is-error');
		}

		if (type === 'success') {
			viewNoteMessage.classList.add('is-success');
		}
	}

	function getNoteSubjectLabel(note) {
		if (!note.subjectId) {
			return 'Matéria: Livre';
		}

		return `Matéria: ${getSubjectNameById(note.subjectId)}`;
	}

	function getNoteThemeLabel(note) {
		if (!note.themeId) {
			return 'Tema: Sem tema';
		}

		return `Tema: ${getThemeNameById(note.themeId)}`;
	}

	function renderViewNoteModal(note) {
		viewNoteTitle.textContent = note.title;
		viewNoteDescription.textContent = 'Consulte o conteúdo completo da anotação.';
		viewNoteType.textContent = getNoteTypeLabel(note.type);

		viewNoteMeta.innerHTML = `
      <span>${escapeHTML(getNoteSubjectLabel(note))}</span>
      <span>${escapeHTML(getNoteThemeLabel(note))}</span>
      <span>Status: ${getNoteStatusIcon(note.status)} ${escapeHTML(getNoteStatusLabel(note.status))}</span>
      ${note.isFavorite ? '<span>⭐ Favorita</span>' : ''}
      ${note.isPinned ? '<span>📌 Fixada</span>' : ''}
      ${note.isArchived ? '<span>Arquivada</span>' : ''}
      <span>Criada em ${escapeHTML(formatDateTime(note.createdAt))}</span>
      <span>Editada em ${escapeHTML(formatDateTime(note.updatedAt))}</span>
      ${Array.isArray(note.tags) && note.tags.length > 0 ? `<span>Tags: ${escapeHTML(formatTags(note.tags))}</span>` : ''}
    `;

		viewNoteContent.innerHTML = renderMarkdown(note.content);
		viewNoteContentEdit.value = note.content;

		viewNoteContent.hidden = false;
		viewNoteContentEdit.hidden = true;

		closeViewNoteButton.textContent = 'Fechar';
		quickEditNoteButton.textContent = 'Editar conteúdo';

		isQuickEditingNote = false;
		setViewNoteMessage('');
	}

	function openViewNoteModal(note) {
		viewingNoteId = note.id;

		renderViewNoteModal(note);

		viewNoteModal.hidden = false;
		document.body.style.overflow = 'hidden';
	}

	function closeViewNoteModal() {
		viewingNoteId = null;
		isQuickEditingNote = false;
		isFocusedEditorFromForm = false;

		viewNoteContentEdit.value = '';
		setViewNoteMessage('');

		viewNoteModal.hidden = true;
		document.body.style.overflow = '';
	}

	function handleNoteView(event) {
		const viewButton = event.target.closest('[data-view-note]');

		if (!viewButton) {
			return;
		}

		const noteId = viewButton.dataset.viewNote;
		const note = getNoteById(noteId);

		if (!note) {
			return;
		}

		openViewNoteModal(note);
	}

	function handleQuickEditButtonClick() {
		if (!isQuickEditingNote) {
			enterQuickEditMode();
			return;
		}

		confirmQuickEdit();
	}

	function handleCloseViewNoteButtonClick() {
		if (isQuickEditingNote) {
			cancelQuickEditMode();
			return;
		}

		closeViewNoteModal();
	}

	function parseTags(tagsText) {
		return tagsText
			.split(',')
			.map((tag) => {
				return tag.trim().toLowerCase();
			})
			.filter((tag) => {
				return tag !== '';
			});
	}

	function formatTags(tags) {
		if (!Array.isArray(tags)) {
			return '';
		}

		return tags.join(', ');
	}

	function updateNoteFlag(noteId, flagName) {
		const updatedNotes = getNotes().map((note) => {
			if (note.id !== noteId) {
				return note;
			}

			return {
				...note,
				[flagName]: !note[flagName],
				updatedAt: new Date().toISOString()
			};
		});

		saveNotes(updatedNotes);
		notifyNotesChanged();
		renderNotes();
	}

	function handleNoteMetadataActions(event) {
		closeOpenNoteMenus();

		const favoriteButton = event.target.closest('[data-toggle-favorite-note]');
		const pinButton = event.target.closest('[data-toggle-pin-note]');
		const archiveButton = event.target.closest('[data-toggle-archive-note]');

		if (favoriteButton) {
			updateNoteFlag(favoriteButton.dataset.toggleFavoriteNote, 'isFavorite');
			return;
		}

		if (pinButton) {
			updateNoteFlag(pinButton.dataset.togglePinNote, 'isPinned');
			return;
		}

		if (archiveButton) {
			updateNoteFlag(archiveButton.dataset.toggleArchiveNote, 'isArchived');
		}
	}

	function normalizeText(value) {
		return String(value)
			.toLowerCase()
			.normalize('NFD')
			.replaceAll(/[\u0300-\u036f]/g, '')
			.trim();
	}

	function getUniqueTags() {
		const tags = getNotes().flatMap((note) => {
			return Array.isArray(note.tags) ? note.tags : [];
		});

		return [...new Set(tags)].sort((firstTag, secondTag) => {
			return firstTag.localeCompare(secondTag);
		});
	}

	function noteMatchesSearch(note, searchText) {
		if (!searchText) {
			return true;
		}

		const subjectName = note.subjectId ? getSubjectNameById(note.subjectId) : '';
		const themeName = note.themeId ? getThemeNameById(note.themeId) : '';
		const tagsText = Array.isArray(note.tags) ? note.tags.join(' ') : '';

		const searchableText = normalizeText(`
    ${note.title}
    ${note.content}
    ${getNoteTypeLabel(note.type)}
    ${getNoteStatusLabel(note.status)}
    ${subjectName}
    ${themeName}
    ${tagsText}
  `);

		return searchableText.includes(searchText);
	}

	function getFilteredNotes() {
		const searchText = normalizeText(noteSearchInput.value);
		const selectedSubjectId = noteFilterSubjectSelect.value;
		const selectedThemeId = noteFilterThemeSelect.value;
		const selectedType = noteFilterTypeSelect.value;
		const selectedStatus = noteFilterStatusSelect.value;
		const selectedArchiveFilter = noteFilterArchiveSelect.value || 'active';

		return getNotes()
			.filter((note) => {
				const matchesSearch = noteMatchesSearch(note, searchText);

				const matchesSubject = !selectedSubjectId || note.subjectId === selectedSubjectId;

				const matchesTheme = !selectedThemeId || note.themeId === selectedThemeId;

				const matchesType = !selectedType || note.type === selectedType;

				const matchesStatus = !selectedStatus || (note.status || 'rascunho') === selectedStatus;

				const matchesArchive =
					selectedArchiveFilter === 'all' ||
					(selectedArchiveFilter === 'active' && !note.isArchived) ||
					(selectedArchiveFilter === 'archived' && note.isArchived) ||
					(selectedArchiveFilter === 'favorites' && note.isFavorite) ||
					(selectedArchiveFilter === 'pinned' && note.isPinned);

				return matchesSearch && matchesSubject && matchesTheme && matchesType && matchesStatus && matchesArchive;
			})
			.sort((firstNote, secondNote) => {
				const firstPinnedValue = firstNote.isPinned ? 1 : 0;
				const secondPinnedValue = secondNote.isPinned ? 1 : 0;

				if (firstPinnedValue !== secondPinnedValue) {
					return secondPinnedValue - firstPinnedValue;
				}

				return new Date(secondNote.updatedAt) - new Date(firstNote.updatedAt);
			});
	}

	function renderFilterSubjectOptions() {
		const subjects = getSubjects();
		const previousSubjectId = noteFilterSubjectSelect.value;

		noteFilterSubjectSelect.innerHTML = `
    <option value="">Todas as matérias</option>
  `;

		subjects.forEach((subject) => {
			const option = document.createElement('option');

			option.value = subject.id;
			option.textContent = subject.name;

			noteFilterSubjectSelect.appendChild(option);
		});

		const subjectStillExists = subjects.some((subject) => {
			return subject.id === previousSubjectId;
		});

		noteFilterSubjectSelect.value = subjectStillExists ? previousSubjectId : '';

		renderFilterThemeOptions();
	}

	function renderFilterThemeOptions() {
		const selectedSubjectId = noteFilterSubjectSelect.value;
		const previousThemeId = noteFilterThemeSelect.value;

		const themes = getThemes().filter((theme) => {
			if (!selectedSubjectId) {
				return true;
			}

			return theme.subjectId === selectedSubjectId;
		});

		noteFilterThemeSelect.innerHTML = `
    <option value="">Todos os temas</option>
  `;

		themes.forEach((theme) => {
			const option = document.createElement('option');

			option.value = theme.id;
			option.textContent = theme.name;

			noteFilterThemeSelect.appendChild(option);
		});

		const themeStillExists = themes.some((theme) => {
			return theme.id === previousThemeId;
		});

		noteFilterThemeSelect.value = themeStillExists ? previousThemeId : '';
	}

	function toggleAdvancedNoteFilters() {
		const filtersAreHidden = noteFiltersAdvanced.hidden;

		noteFiltersAdvanced.hidden = !filtersAreHidden;

		toggleNoteFiltersButton.textContent = filtersAreHidden ? 'Ocultar filtros' : 'Mostrar filtros';

		toggleNoteFiltersButton.setAttribute('aria-expanded', String(filtersAreHidden));
	}

	function clearNoteFilters() {
		noteSearchInput.value = '';
		noteFilterSubjectSelect.value = '';
		noteFilterThemeSelect.value = '';
		noteFilterTypeSelect.value = '';
		noteFilterStatusSelect.value = '';
		noteFilterArchiveSelect.value = 'active';

		renderFilterThemeOptions();
		renderNotes();
	}

	function closeOpenNoteMenus() {
		document.querySelectorAll('.note-card__more[open]').forEach((menu) => {
			menu.removeAttribute('open');
		});
	}

	function getVisibleNoteMetadata(note, subjectName, themeName) {
		const metadata = [];

		if (note.subjectId) {
			metadata.push(`Matéria: ${subjectName}`);
		}

		if (note.themeId) {
			metadata.push(`Tema: ${themeName}`);
		}

		return metadata;
	}

	function showNoteTab(tabName) {
		const isGallery = tabName === 'gallery';
		const isForm = tabName === 'form';

		notesGalleryTabButton.classList.toggle('is-active', isGallery);
		notesFormTabButton.classList.toggle('is-active', isForm);

		notesGalleryView.classList.toggle('is-active', isGallery);
		notesFormView.classList.toggle('is-active', isForm);
	}

	function prepareCreateNoteMode() {
		editingNoteId = null;

		saveNoteButton.textContent = 'Salvar anotação';

		clearNoteForm();
		showNoteTab('form');

		noteTitleInput.focus();
	}

	function prepareEditNoteMode(note) {
		enterEditMode(note);
		showNoteTab('form');
		noteTitleInput.focus();
	}

	function returnToNotesGallery() {
		editingNoteId = null;
		saveNoteButton.textContent = 'Salvar anotação';

		clearNoteForm();
		showNoteTab('gallery');
	}

	function renderMarkdown(text) {
		const lines = String(text).split('\n');
		const htmlLines = [];

		let isInsideList = false;

		lines.forEach((line) => {
			const trimmedLine = line.trim();

			if (trimmedLine.startsWith('- ')) {
				if (!isInsideList) {
					htmlLines.push('<ul>');
					isInsideList = true;
				}

				htmlLines.push(`<li>${formatInlineMarkdown(trimmedLine.slice(2))}</li>`);
				return;
			}

			if (isInsideList) {
				htmlLines.push('</ul>');
				isInsideList = false;
			}

			if (trimmedLine.startsWith('### ')) {
				htmlLines.push(`<h4>${formatInlineMarkdown(trimmedLine.slice(4))}</h4>`);
				return;
			}

			if (trimmedLine.startsWith('## ')) {
				htmlLines.push(`<h3>${formatInlineMarkdown(trimmedLine.slice(3))}</h3>`);
				return;
			}

			if (trimmedLine.startsWith('# ')) {
				htmlLines.push(`<h2>${formatInlineMarkdown(trimmedLine.slice(2))}</h2>`);
				return;
			}

			if (trimmedLine.startsWith('> ')) {
				htmlLines.push(`<blockquote>${formatInlineMarkdown(trimmedLine.slice(2))}</blockquote>`);
				return;
			}

			if (!trimmedLine) {
				htmlLines.push('<br>');
				return;
			}

			htmlLines.push(`<p>${formatInlineMarkdown(trimmedLine)}</p>`);
		});

		if (isInsideList) {
			htmlLines.push('</ul>');
		}

		return htmlLines.join('');
	}

	function formatInlineMarkdown(text) {
		const escapedText = escapeHTML(text);

		return escapedText
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.*?)\*/g, '<em>$1</em>')
			.replace(/`(.*?)`/g, '<code>$1</code>');
	}

	function renderNoteFilterOptions() {
		renderFilterSubjectOptions();
	}

	function openMarkdownHelpModal() {
		markdownHelpModal.hidden = false;
		document.body.style.overflow = 'hidden';
		closeMarkdownHelpButton.focus();
	}

	function closeMarkdownHelpModal() {
		markdownHelpModal.hidden = true;
		document.body.style.overflow = '';
	}

	function openFocusedEditorFromForm() {
		const title = noteTitleInput.value.trim() || 'Anotação sem título';
		const type = noteTypeSelect.value || 'resumo';
		const status = noteStatusSelect.value || 'rascunho';
		const content = noteContentInput.value;

		isFocusedEditorFromForm = true;

		const temporaryNote = {
			id: 'focused-editor-note',
			title,
			content,
			type,
			status,
			tags: parseTags(noteTagsInput.value),
			subjectId: noteSubjectSelect.value || null,
			themeId: noteThemeSelect.value || null,
			isFavorite: false,
			isPinned: false,
			isArchived: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		openViewNoteModal(temporaryNote);
		enterQuickEditMode();
	}

	function handleExternalNoteOpen(event) {
		const noteId = event.detail?.noteId;

		if (!noteId) {
			return;
		}

		const note = getNoteById(noteId);

		if (!note) {
			return;
		}

		showNoteTab('gallery');
		openViewNoteModal(note);
	}

	function handleExternalNoteCreate(event) {
		const subjectId = event.detail?.subjectId || '';
		const themeId = event.detail?.themeId || '';

		exitEditMode();

		noteSubjectSelect.value = subjectId;
		renderThemeOptions();

		noteThemeSelect.value = themeId;

		showNoteTab('form');

		noteTitleInput.focus();

		setNoteMessage('Crie uma anotação para completar este tema.', 'success');
	}

	function handleCreateConfirmationNote(event) {
		const {title, content, type, status, tags, subjectId, themeId, sourceAttemptId, sourceQuestionId, origin} = event.detail || {};

		if (!title || !content || !sourceAttemptId) {
			return;
		}

		const alreadyExists = getNotes().some((note) => {
			return note.sourceAttemptId === sourceAttemptId && note.origin === 'confirmation';
		});

		if (alreadyExists) {
			document.dispatchEvent(new CustomEvent('notes:confirmation-note-created'));
			return;
		}

		const notes = getNotes();

		const newNote = createNote({
			title,
			content,
			type: type || 'revisao',
			status: status || 'revisar',
			tags: Array.isArray(tags) ? tags : ['confirmação'],
			subjectId,
			themeId,
			sourceAttemptId,
			sourceQuestionId,
			origin: origin || 'confirmation'
		});

		notes.push(newNote);

		saveNotes(notes);
		notifyNotesChanged();

		document.dispatchEvent(new CustomEvent('notes:confirmation-note-created'));

		setNoteMessage('Anotação de confirmação criada com sucesso.', 'success');
	}

	//-------------------------------------

	document.addEventListener('notes:open-note', handleExternalNoteOpen);
	document.addEventListener('notes:prepare-create', handleExternalNoteCreate);
	document.addEventListener('notes:create-confirmation-note', handleCreateConfirmationNote);

	saveNoteButton.addEventListener('click', handleNoteSubmit);
	clearNoteFormButton.addEventListener('click', clearNoteForm);

	noteSubjectSelect.addEventListener('change', () => {
		noteThemeSelect.value = '';
		renderThemeOptions();

		if (!noteSubjectSelect.value) {
			noteThemeSelect.value = '';
			noteThemeSelect.disabled = true;
		}
	});

	notesList.addEventListener('click', handleNoteDelete);
	notesList.addEventListener('click', handleNoteEdit);
	notesList.addEventListener('click', handleNoteView);
	notesList.addEventListener('click', handleNoteMetadataActions);

	quickEditNoteButton.addEventListener('click', handleQuickEditButtonClick);
	closeViewNoteButton.addEventListener('click', handleCloseViewNoteButtonClick);

	toggleNoteFiltersButton.addEventListener('click', toggleAdvancedNoteFilters);

	notesGalleryTabButton.addEventListener('click', () => {
		showNoteTab('gallery');
	});

	notesFormTabButton.addEventListener('click', () => {
		prepareCreateNoteMode();
	});

	notesBackToGalleryButton.addEventListener('click', returnToNotesGallery);

	openMarkdownHelpButton.addEventListener('click', openMarkdownHelpModal);
	closeMarkdownHelpButton.addEventListener('click', closeMarkdownHelpModal);
	openFocusedEditorButton.addEventListener('click', openFocusedEditorFromForm);

	noteSearchInput.addEventListener('input', renderNotes);

	noteFilterSubjectSelect.addEventListener('change', () => {
		renderFilterThemeOptions();
		renderNotes();
	});
	noteFilterThemeSelect.addEventListener('change', renderNotes);
	noteFilterTypeSelect.addEventListener('change', renderNotes);
	noteFilterStatusSelect.addEventListener('change', renderNotes);
	noteFilterArchiveSelect.addEventListener('change', renderNotes);

	markdownHelpModal.addEventListener('click', (event) => {
		if (event.target === markdownHelpModal) {
			closeMarkdownHelpModal();
		}
	});

	viewNoteModal.addEventListener('click', (event) => {
		if (event.target === viewNoteModal && !isQuickEditingNote) {
			closeViewNoteModal();
		}
	});

	document.addEventListener('subjects:changed', () => {
		renderSubjectOptions();
		renderNoteFilterOptions();
		renderNotes();
	});

	document.addEventListener('themes:changed', () => {
		renderThemeOptions();
		renderNoteFilterOptions();
		renderNotes();
	});

	cleanupBrokenNoteLinks();
	renderSubjectOptions();
	renderNoteFilterOptions();
	renderNotes();
	showNoteTab('gallery');

	console.log('Sistema de anotações carregado.');
}

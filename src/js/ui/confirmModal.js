let confirmCallback = null;

export function initConfirmModal() {
	const modal = document.querySelector('#app-confirm-modal');
	const cancelButton = document.querySelector('#app-confirm-cancel');
	const confirmButton = document.querySelector('#app-confirm-confirm');

	if (!modal || !cancelButton || !confirmButton) {
		return;
	}

	function closeModal() {
		closeConfirmModal();
	}

	function confirmAction() {
		if (typeof confirmCallback === 'function') {
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
		if (event.key === 'Escape' && !modal.hidden) {
			closeConfirmModal();
		}
	}

	cancelButton.addEventListener('click', closeModal);
	confirmButton.addEventListener('click', confirmAction);
	modal.addEventListener('click', handleOverlayClick);
	document.addEventListener('keydown', handleEscapeKey);
}

export function openConfirmModal({
	tag = '⚠️ Confirmação',
	title = 'Confirmar ação',
	message = 'Tem certeza que deseja continuar?',
	descriptionHTML = '',
	sideContentHTML = '',
	modalModifierClass = '',
	confirmText = 'Confirmar',
	cancelText = 'Cancelar',
	confirmButtonClass = 'button button--danger',
	onConfirm
}) {
	const modal = document.querySelector('#app-confirm-modal');
	const modalBox = document.querySelector('#app-confirm-box');
	const tagElement = document.querySelector('#app-confirm-tag');
	const titleElement = document.querySelector('#app-confirm-title');
	const descriptionElement = document.querySelector('#app-confirm-description');
	const sideElement = document.querySelector('#app-confirm-side');
	const cancelButton = document.querySelector('#app-confirm-cancel');
	const confirmButton = document.querySelector('#app-confirm-confirm');

	if (!modal || !modalBox || !tagElement || !titleElement || !descriptionElement || !sideElement || !cancelButton || !confirmButton) {
		return;
	}

	confirmCallback = onConfirm;

	modalBox.className = 'modal app-confirm-modal';

	if (modalModifierClass) {
		modalBox.classList.add(modalModifierClass);
	}

	tagElement.textContent = tag;
	titleElement.textContent = title;

	if (descriptionHTML) {
		descriptionElement.innerHTML = descriptionHTML;
	} else {
		descriptionElement.textContent = message;
	}

	if (sideContentHTML) {
		sideElement.innerHTML = sideContentHTML;
		sideElement.hidden = false;
		modalBox.classList.add('app-confirm-modal--split');
	} else {
		sideElement.innerHTML = '';
		sideElement.hidden = true;
		modalBox.classList.remove('app-confirm-modal--split');
	}

	cancelButton.textContent = cancelText;
	confirmButton.textContent = confirmText;
	confirmButton.className = confirmButtonClass;

	modal.hidden = false;
	confirmButton.focus();
}

export function closeConfirmModal() {
	const modal = document.querySelector('#app-confirm-modal');
	const modalBox = document.querySelector('#app-confirm-box');
	const sideElement = document.querySelector('#app-confirm-side');

	if (!modal) {
		return;
	}

	confirmCallback = null;
	modal.hidden = true;

	if (modalBox) {
		modalBox.className = 'modal app-confirm-modal';
	}

	if (sideElement) {
		sideElement.innerHTML = '';
		sideElement.hidden = true;
	}
}

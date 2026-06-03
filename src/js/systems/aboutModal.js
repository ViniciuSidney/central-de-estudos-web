export function initAboutModal() {
	const openButton = document.querySelector('#open-about-modal');
	const modal = document.querySelector('#about-modal');
	const closeButton = document.querySelector('#close-about-modal');

	if (!openButton || !modal || !closeButton) {
		return;
	}

	function openModal() {
		modal.hidden = false;
		document.body.style.overflow = 'hidden';
		closeButton.focus();
	}

	function closeModal() {
		modal.hidden = true;
		document.body.style.overflow = '';
	}

	openButton.addEventListener('click', openModal);
	closeButton.addEventListener('click', closeModal);

	modal.addEventListener('click', (event) => {
		if (event.target === modal) {
			closeModal();
		}
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && !modal.hidden) {
			closeModal();
		}
	});

	console.log('Modal Sobre carregado.');
}

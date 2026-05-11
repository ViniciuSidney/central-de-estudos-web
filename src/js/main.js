console.log('Central de Estudos Web iniciada.');

const themeToggleButton = document.querySelector('.theme-toggle');
const sectionButtons = document.querySelectorAll('[data-section-target]');
const navCards = document.querySelectorAll('.nav-card');
const appSections = document.querySelectorAll('.app-section');

const savedTheme = localStorage.getItem('central-estudos-theme');

if (savedTheme === 'dark') {
   document.body.classList.add('dark-theme');
   themeToggleButton.textContent = '☀️';
}

function showSection(sectionId) {
   appSections.forEach((section) => {
      const isSelectedSection = section.id === sectionId;
      section.classList.toggle('is-visible', isSelectedSection);
   });

   navCards.forEach((card) => {
      const isSelectedCard = card.dataset.sectionTarget === sectionId;
      card.classList.toggle('is-active', isSelectedCard);
   });

   const contentPanel = document.querySelector('.content-panel');

   contentPanel.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
   });
}

themeToggleButton.addEventListener('click', () => {
   const isDarkTheme = document.body.classList.toggle('dark-theme');

   themeToggleButton.textContent = isDarkTheme ? '☀️' : '🌙';

   localStorage.setItem(
      'central-estudos-theme',
      isDarkTheme ? 'dark' : 'light',
   );
});

sectionButtons.forEach((button) => {
   button.addEventListener('click', () => {
      const sectionId = button.dataset.sectionTarget;

      showSection(sectionId);
   });
});

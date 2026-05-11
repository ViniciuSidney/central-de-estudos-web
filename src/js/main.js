console.log('Central de Estudos Web iniciada.');

const themeToggleButton = document.querySelector('.theme-toggle');

const savedTheme = localStorage.getItem('central-estudos-theme');

if (savedTheme === 'dark') {
   document.body.classList.add('dark-theme');
   themeToggleButton.textContent = '☀️';
}

themeToggleButton.addEventListener('click', () => {
   const isDarkTheme = document.body.classList.toggle('dark-theme');

   themeToggleButton.textContent = isDarkTheme ? '☀️' : '🌙';

   localStorage.setItem(
      'central-estudos-theme',
      isDarkTheme ? 'dark' : 'light',
   );
});

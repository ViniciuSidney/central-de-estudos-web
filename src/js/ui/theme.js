const THEME_STORAGE_KEY = "central-estudos-theme";

export function initTheme() {
  const themeToggleButton = document.querySelector(".theme-toggle");

  if (!themeToggleButton) {
    return;
  }

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
    themeToggleButton.textContent = "☀️";
  }

  themeToggleButton.addEventListener("click", () => {
    const isDarkTheme = document.body.classList.toggle("dark-theme");

    themeToggleButton.textContent = isDarkTheme ? "☀️" : "🌙";

    localStorage.setItem(
      THEME_STORAGE_KEY,
      isDarkTheme ? "dark" : "light"
    );
  });
}
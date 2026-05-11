export function initNavigation() {
  const sectionButtons = document.querySelectorAll("[data-section-target]");
  const navCards = document.querySelectorAll(".nav-card");
  const appSections = document.querySelectorAll(".app-section");
  const contentPanel = document.querySelector(".content-panel");

  if (!sectionButtons.length || !appSections.length || !contentPanel) {
    return;
  }

  function showSection(sectionId) {
    appSections.forEach((section) => {
      const isSelectedSection = section.id === sectionId;

      section.classList.toggle("is-visible", isSelectedSection);
    });

    navCards.forEach((card) => {
      const isSelectedCard = card.dataset.sectionTarget === sectionId;

      card.classList.toggle("is-active", isSelectedCard);
    });

    contentPanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  sectionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const sectionId = button.dataset.sectionTarget;

      showSection(sectionId);
    });
  });
}
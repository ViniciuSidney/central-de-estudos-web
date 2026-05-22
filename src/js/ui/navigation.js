export function initNavigation() {
  const sectionButtons = document.querySelectorAll("[data-section-target]");
  const navCards = document.querySelectorAll(".nav-card");
  const appSections = document.querySelectorAll(".app-section");
  const contentPanel = document.querySelector(".content-panel");
  const navGroupButtons = document.querySelectorAll("[data-nav-group]");

  if (!sectionButtons.length || !appSections.length || !contentPanel) {
    return;
  }

  function showNavGroup(groupName) {
    navGroupButtons.forEach((button) => {
      const isSelectedGroup = button.dataset.navGroup === groupName;

      button.classList.toggle("is-active", isSelectedGroup);
    });

    navCards.forEach((card) => {
      const cardCategory = card.dataset.navCategory;

      if (!cardCategory) {
        return;
      }

      card.classList.toggle("is-hidden-by-group", cardCategory !== groupName);
    });
  }

  navGroupButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showNavGroup(button.dataset.navGroup);
    });
  });

  showNavGroup("summary");
  showNavGroup("management");

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
      block: "start",
    });
  }

  sectionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const sectionId = button.dataset.sectionTarget;

      showSection(sectionId);
    });
  });
}

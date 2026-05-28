const SECTION_NAV_GROUPS = {
  dashboard: "summary",

  subjects: "management",
  themes: "management",
  questions: "management",

  solve: "study",
  notes: "study",
  reviews: "study",
};

export function initNavigation() {
  const navTabButtons = document.querySelectorAll("[data-nav-group]");
  const navCards = document.querySelectorAll("[data-section]");
  const sections = document.querySelectorAll(".app-section");

  if (!navTabButtons.length || !navCards.length || !sections.length) {
    return;
  }

  function getNavGroupFromSection(sectionId) {
    return SECTION_NAV_GROUPS[sectionId] || "summary";
  }

  function setActiveNavGroup(groupName) {
    navTabButtons.forEach((button) => {
      const isActive = button.dataset.navGroup === groupName;

      button.classList.toggle("is-active", isActive);
    });

    navCards.forEach((card) => {
      const cardGroup = card.dataset.navCardGroup;

      if (!cardGroup) {
        return;
      }

      card.classList.toggle("is-hidden-by-group", cardGroup !== groupName);
    });
  }

  function setActiveSection(sectionId) {
    sections.forEach((section) => {
      section.classList.toggle("is-visible", section.id === sectionId);
    });

    navCards.forEach((card) => {
      card.classList.toggle("is-active", card.dataset.section === sectionId);
    });
  }

  function navigateToSection(sectionId, shouldScroll = true) {
    const groupName = getNavGroupFromSection(sectionId);

    setActiveNavGroup(groupName);
    setActiveSection(sectionId);

    if (shouldScroll) {
      document.querySelector(`#${sectionId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  navTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const groupName = button.dataset.navGroup;

      setActiveNavGroup(groupName);

      const firstCardFromGroup = Array.from(navCards).find((card) => {
        return card.dataset.navCardGroup === groupName;
      });

      if (firstCardFromGroup) {
        navigateToSection(firstCardFromGroup.dataset.section, false);
      }
    });
  });

  navCards.forEach((card) => {
    card.addEventListener("click", () => {
      navigateToSection(card.dataset.section);
    });
  });

  document.addEventListener("app:navigate", (event) => {
    const sectionId = event.detail?.sectionId;

    if (!sectionId) {
      return;
    }

    navigateToSection(sectionId);
  });

  const initialVisibleSection = document.querySelector(".app-section.is-visible");
  const initialSectionId = initialVisibleSection?.id || "dashboard";

  navigateToSection(initialSectionId, false);

  console.log("Navegação carregada.");
}
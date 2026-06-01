import { initTheme } from "../ui/theme.js";
import { initNavigation } from "../ui/navigation.js";
import { initConfirmModal } from "../ui/confirmModal.js";
import { initSubjects } from "../features/subjects.js";
import { initThemes } from "../features/themes.js";
import { initQuestions } from "../features/questions.js";
import { initNotes } from "../features/notes.js";
import { initReviews } from "../features/reviews.js";
import { initSolve } from "../features/solve.js";
import { initDashboard } from "../features/dashboard.js";
import { initResetData } from "../features/resetData.js";
import { initDataPortability } from "../systems/dataPortability.js";

export function startApp() {
  console.log("Central de Estudos Web iniciada.");

  initTheme();
  initNavigation();
  initConfirmModal();
  initDashboard();
  initSubjects();
  initThemes();
  initQuestions();
  initSolve();
  initNotes();
  initReviews();
  initResetData();
  initDataPortability();
}

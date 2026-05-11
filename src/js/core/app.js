import { initTheme } from "../ui/theme.js";
import { initNavigation } from "../ui/navigation.js";
import { initSubjects } from "../features/subjects.js";
import { initThemes } from "../features/themes.js";
import { initQuestions } from "../features/questions.js";
import { initNotes } from "../features/notes.js";
import { initReviews } from "../features/reviews.js";

export function startApp() {
  console.log("Central de Estudos Web iniciada.");

  initTheme();
  initNavigation();
  initSubjects();
  initThemes();
  initQuestions();
  initNotes();
  initReviews();
}
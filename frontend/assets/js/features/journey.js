import { placementResult } from "/shared/placement.js";
import { nextLesson, moduleReadiness } from "/shared/learningPath.js";
import { MODULES, LESSONS } from "/shared/curriculum.js";
import { pageHeading, routeLink, icon, progressBar } from "../core/ui.js";

export function renderJourney(ctx, moduleId) {
  const next = nextLesson(ctx.progress);
  const completed = LESSONS.filter(lesson => ctx.progress.lessons[lesson.id]?.completedAt).length;
  const readiness = moduleReadiness(ctx.progress);
  ctx.main.innerHTML = pageHeading("SUA TRILHA", "Do zero, com direção.", "Siga a ordem sugerida ou explore uma etapa. Todas as lições estão abertas.") +
    `<div class="journey-summary panel"><span class="summary-symbol jp">道</span><div><strong>${completed} de ${LESSONS.length} lições concluídas</strong><p>8 etapas para construir sua base no japonês.</p>${progressBar(completed / LESSONS.length * 100)}</div>${routeLink(next ? "lesson/" + next.id : "review", (completed ? "Continuar" : "Dar o primeiro passo") + icon("arrow"), "btn btn-primary")}</div>
    <div class="journey-list">${MODULES.map(module => {
      const done = module.lessons.filter(lesson => ctx.progress.lessons[lesson.id]?.completedAt).length;
      const suggested = ctx.progress.placement.acceptedModule === module.id;
      const suggestionLabel = placementResult(ctx.progress.placement.answers).moduleId === module.id ? "Sugerido para você" : "Escolhido por você";
      const prior = ctx.progress.placement.acceptedModule && MODULES.findIndex(item => item.id === module.id) < MODULES.findIndex(item => item.id === ctx.progress.placement.acceptedModule);
      const notReadyMessage = readiness.find(item => item.id === module.id)?.readyMessage;
      const open = moduleId ? moduleId === module.id : next?.moduleId === module.id;
      return `<details class="journey-module" ${open ? "open" : ""}><summary><span class="module-symbol ${module.color} jp" lang="ja">${module.symbol}</span><div><span class="eyebrow">ETAPA ${module.number}</span><h2>${module.title}${suggested ? `<span class="pill small-pill">${suggestionLabel}</span>` : ""}${notReadyMessage ? `<span class="pill small-pill caution-pill">Recomendado depois</span>` : ""}</h2><p>${prior ? "Revisão rápida, se quiser · " : ""}${module.subtitle}</p>${notReadyMessage ? `<p class="muted small">${notReadyMessage}</p>` : ""}</div><span class="module-count">${done}/${module.lessons.length}</span>${done === module.lessons.length ? `<span class="hanko small-hanko jp" aria-label="Etapa concluída">${module.symbol}</span>` : ""}${icon("down")}</summary><div class="lesson-list">${module.lessons.map((lesson, index) => {
        const complete = ctx.progress.lessons[lesson.id]?.completedAt;
        return `<a class="lesson-row ${next?.id === lesson.id ? "is-next" : ""}" href="#/lesson/${lesson.id}"><span class="lesson-state ${complete ? "is-done" : ""}">${complete ? icon("check") : String(index + 1).padStart(2, "0")}</span><div><h3>${lesson.title}${next?.id === lesson.id ? '<span class="pill small-pill">Próximo passo</span>' : ""}</h3><p>${lesson.goal}</p></div><span class="lesson-duration">${icon("clock")} ${lesson.minutes} min</span>${icon("chevron")}</a>`;
      }).join("")}</div></details>`;
    }).join("")}</div>`;
}

import { renderPracticeHub, renderExplore } from "./features/hubs.js";
import { NAVIGATION, navigationFor } from "./core/navigation.js";
import { renderThematic } from "./features/thematic.js";
import { renderPlacement } from "./features/placement.js";
import { renderVocabulary, renderGlossary, renderExercises } from "./features/study.js";
import { renderWorksheets } from "./features/worksheets.js";
import { renderTeacher } from "./features/teacher.js";
import { createStore } from "./core/store.js";
import { createAudio } from "./core/audio.js";
import { icon } from "./core/icons.js";
import { dueReviews, currentStreak } from "/shared/progress.js";
import { renderDashboard } from "./features/dashboard.js";
import { renderJourney } from "./features/journey.js";
import { renderLesson } from "./features/lesson.js";
import { renderKana } from "./features/kana.js";
import { renderWriting } from "./features/writing.js";
import { renderSentences } from "./features/sentences.js";
import { renderKanji, renderParticles, renderExpressions, renderLibrary, renderReview, addToReview } from "./features/reference.js";
import { renderSettings } from "./features/settings.js";
import { emptyState, routeLink } from "./core/ui.js";
import { applyTheme, themeSwitcher } from "./core/theme.js";
import { playerLevel, ACHIEVEMENTS } from "/shared/gamification.js";
import { completeEmailLink } from "./api.js";

// Supabase sends confirmation/recovery tokens in the fragment for implicit links.
// Clear the fragment before any further work so the credentials leave the URL quickly.
if (/^#(?:access_token=|error=)/.test(location.hash)) {
  const values = new URLSearchParams(location.hash.slice(1));
  const refreshToken = values.get("refresh_token");
  const kind = values.get("type");
  history.replaceState(null, "", "/#/settings/email-link-failed");
  if (refreshToken && ["signup", "recovery", "invite", "magiclink"].includes(kind)) {
    try {
      await completeEmailLink(refreshToken);
      history.replaceState(null, "", "/#/settings/" + (kind === "recovery" ? "password-reset" : "email-confirmed"));
    } catch { /* The settings page explains how to request a fresh link. */ }
  }
}

const app = document.querySelector("#app");
let toastTimer;
function toast(message) {
  const element = document.querySelector("#toast");
  element.textContent = message;
  element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { element.hidden = true; }, 6500);
}
let status = "saved";
const statusLabels = { saved: "Progresso salvo", local: "Salvo neste navegador", unsaved: "Progresso só nesta sessão", saving: "Salvando progresso…", "account-changed": "Conta alterada · recarregue" };
function updateStatus(value) {
  status = value;
  const element = document.querySelector("#save-status");
  if (element) { element.textContent = statusLabels[status]; element.dataset.status = status; }
}
const store = await createStore(updateStatus);
const audio = createAudio(toast, () => store.snapshot.preferences);
applyTheme(store.snapshot.preferences.theme);
app.innerHTML = `
  <button class="sidebar-backdrop" id="sidebar-backdrop" aria-label="Fechar navegação" hidden></button>
  <aside class="sidebar" id="sidebar" aria-label="Seu espaço de estudo"><div class="sidebar-brand"><a class="brand" href="#/home" aria-label="Maru, início"><img src="/assets/img/maru-mark.svg" alt="" width="38" height="38"><span>maru<span class="brand-period">.</span><small>JAPONÊS, PASSO A PASSO</small></span></a><button class="icon-button menu-close" id="menu-close" aria-label="Fechar navegação">${icon("close")}</button></div>
    <nav aria-label="Navegação principal"><p class="nav-label">SEU JAPONÊS</p>${NAVIGATION.map(({route, icon: symbol, title}) => `<a class="nav-link" href="#/${route}" data-nav="${route}">${icon(symbol)}<span>${title}</span>${route === "review" ? '<span class="nav-count" id="review-count" hidden></span>' : ""}</a>`).join("")}</nav>
    <div class="sidebar-bottom"><p class="sidebar-mode-label">Seu ambiente</p>${themeSwitcher()}<a class="profile-link" href="#/settings" data-nav="settings"><span class="profile-avatar">M</span><span><strong>Meu ritmo</strong><small id="save-status">${statusLabels[status]}</small></span>${icon("settings")}</a></div>
  </aside>
  <div class="app-body"><header class="topbar"><div class="topbar-location"><button class="icon-button menu-button" id="menu-button" aria-label="Abrir navegação" aria-expanded="false" aria-controls="sidebar">${icon("menu")}</button><a class="topbar-parent" id="current-parent" href="#/home">Início</a><span id="breadcrumb-divider">${icon("chevron")}</span><strong id="current-location">Início</strong></div><div class="topbar-stats"><span class="topbar-streak">${icon("fire")}<strong id="streak-count">0 dias</strong></span><span class="topbar-divider"></span><span class="xp-label">${icon("spark")}<strong id="xp-total">0 XP</strong></span><a href="#/settings" class="topbar-avatar" aria-label="Conta e preferências">Conta</a></div></header>
  <div id="arcade-hud" class="arcade-only arcade-hud" aria-label="Seu nível de experiência"></div><main id="main" class="main-content" tabindex="-1"></main><footer class="app-footer"><a href="#/home">maru.</a><span>Aprender é abrir espaço para um novo mundo. <span class="voice-credit">Voz: VOICEVOX:ずんだもん</span></span><a href="#/library">Recursos & referências ${icon("external")}</a></footer></div>
`;
const main = document.querySelector("#main");
let cleanup;
let routeParams = null;
const ctx = {
  main, toast, audio,
  get account() { return store.account; },
  flush: () => store.flush(),
  logout: () => store.logout(),
  get progress() { return store.snapshot; },
  save() { store.save(); updateStats(); },
  setTheme(theme) { store.snapshot.preferences.theme = theme; applyTheme(theme); store.save(); updateStats(); },
  navigate(route, params = null) {
    routeParams = params;
    const hash = "#/" + route;
    if (location.hash === hash) render(); else location.hash = hash;
  }
};
function updateStats() {
  const count = dueReviews(ctx.progress).length;
  const badge = document.querySelector("#review-count");
  badge.hidden = !count; badge.textContent = count;
  const streak = currentStreak(ctx.progress);
  document.querySelector("#streak-count").textContent = streak + (streak === 1 ? " dia" : " dias");
  document.querySelector("#xp-total").textContent = ctx.progress.xp.total + " XP";
  const level = playerLevel(ctx.progress.xp.total);
  document.querySelector("#arcade-hud").innerHTML = '<span>PLAYER 01</span><strong>LV. ' + String(level.level).padStart(2, '0') + '</strong><div class="hud-track"><span style="width:' + level.percent + '%"></span></div><span>' + level.earned + ' / ' + level.needed + ' XP</span><span class="hud-badges">' + ACHIEVEMENTS.filter(item => item.test(ctx.progress)).length + ' / ' + ACHIEVEMENTS.length + ' CONQUISTAS</span>';
  updateStatus(status);
}
function setMenu(open) {
  const mobile = matchMedia("(max-width: 820px)").matches;
  document.body.classList.toggle("menu-open", open);
  document.querySelector("#menu-button").setAttribute("aria-expanded", String(open));
  document.querySelector("#sidebar-backdrop").hidden = !open;
  document.querySelector("#sidebar").inert = mobile && !open;
  document.querySelector(".app-body").inert = mobile && open;
  if (open) (document.querySelector(".sidebar .nav-link.is-active") || document.querySelector(".sidebar .nav-link"))?.focus();
}
matchMedia("(max-width: 820px)").addEventListener("change", () => setMenu(false));
function render() {
  cleanup?.(); cleanup = undefined; audio.stop(); setMenu(false);
  let route = "home", id = "";
  try { [route = "home", id = ""] = decodeURIComponent(location.hash.replace(/^#\/?/, "")).split("/"); } catch { route = "missing"; }
  if (!route) route = "home";
  const params = routeParams || {}; routeParams = null;
  const locationInfo = navigationFor(route);
  document.querySelectorAll("[data-nav]").forEach(link => {
    const active = link.dataset.nav === locationInfo.section;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", link.dataset.nav === route ? "page" : "location"); else link.removeAttribute("aria-current");
  });
  document.querySelector("#current-location").textContent = locationInfo.title;
  const parent = document.querySelector("#current-parent");
  const hasParent = Boolean(locationInfo.section && locationInfo.section !== route);
  parent.hidden = !hasParent;
  document.querySelector("#breadcrumb-divider").hidden = !hasParent;
  parent.href = "#/" + locationInfo.section;
  parent.textContent = navigationFor(locationInfo.section).title;
  document.title = locationInfo.title + " · Maru";
  const views = {
    home: () => renderDashboard(ctx),
    practice: () => renderPracticeHub(ctx),
    explore: () => renderExplore(ctx),
    journey: () => renderJourney(ctx, id),
    lesson: () => renderLesson(ctx, id),
    kana: () => renderKana(ctx, params),
    writing: () => renderWriting(ctx, id || params.char || "あ"),
    sentences: () => renderSentences(ctx, id),
    kanji: () => renderKanji(ctx),
    particles: () => renderParticles(ctx),
    expressions: () => renderExpressions(ctx),
    library: () => renderLibrary(ctx),
    review: () => renderReview(ctx),
    vocabulary: () => renderVocabulary(ctx),
    glossary: () => renderGlossary(ctx),
    exercises: () => renderExercises(ctx),
    worksheets: () => renderWorksheets(ctx, id),
    teacher: () => renderTeacher(ctx),
    package: () => renderTeacher(ctx, id),
    themes: () => renderThematic(ctx, id),
    placement: () => renderPlacement(ctx),
    settings: () => renderSettings(ctx, id)
  };
  if (views[route]) cleanup = views[route]();
  else main.innerHTML = emptyState("Este caminho ainda não existe.", "Volte para seu espaço de aprendizado.", routeLink("home", "Meu aprendizado", "btn btn-primary"));
  // Animate only the route entrance. Answering or moving through a lesson keeps the workspace still.
  for (const element of main.children) {
    if (!element.classList.contains("worksheets-page")) element.classList.add("page-entry");
  }
  updateStats();
  window.scrollTo({ top: 0, behavior: "instant" });
  main.querySelector("h1")?.focus({ preventScroll: true });
}
document.querySelector("#menu-button").addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
document.querySelector("#menu-close").addEventListener("click", () => { setMenu(false); document.querySelector("#menu-button").focus(); });
document.querySelector("#sidebar-backdrop").addEventListener("click", () => { setMenu(false); document.querySelector("#menu-button").focus(); });
document.addEventListener("keydown", event => {
  if (!document.body.classList.contains("menu-open")) return;
  if (event.key === "Escape") { setMenu(false); document.querySelector("#menu-button").focus(); }
  if (event.key === "Tab") {
    const focusable = [...document.querySelectorAll('.sidebar a, .sidebar button')].filter(element => element.getClientRects().length && !element.disabled);
    if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
  }
});
document.addEventListener("click", event => {
  const theme = event.target.closest("[data-theme-choice]");
  if (theme) { ctx.setTheme(theme.dataset.themeChoice); toast("Estilo " + ({ dojo: "Dojo", arcade: "Arcade", heisei: "Heisei Girly" }[theme.dataset.themeChoice] || "Dojo") + " ativado. Seu progresso continua o mesmo."); }
  const speaker = event.target.closest("[data-speak]");
  if (speaker) { event.preventDefault(); audio.speak(speaker.dataset.speak, speaker); }
  const review = event.target.closest("[data-add-review]");
  if (review) addToReview(ctx, review);
  const link = event.target.closest('a[href^="#/"]');
  if (link && link.getAttribute("href") === location.hash && !event.ctrlKey && !event.metaKey) { event.preventDefault(); render(); }
});
document.querySelector(".skip-link").addEventListener("click", event => { event.preventDefault(); main.focus(); });
window.addEventListener("hashchange", render);
applyTheme(store.snapshot.preferences.theme);
render();

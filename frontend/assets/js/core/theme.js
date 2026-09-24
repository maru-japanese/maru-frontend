export const THEMES = [
  { id: "dojo", title: "Dojo", subtitle: "Papel, tinta e tranquilidade.", description: "Papel washi, tinta sumi e selos vermelhos. Um espaço tradicional para estudar com calma.", symbol: "道" },
  { id: "arcade", title: "Arcade", subtitle: "Pixels, neon e novas conquistas.", description: "Um fliperama escuro com nível, missões e feedback de jogo.", symbol: "遊" }
];
export function applyTheme(theme) {
  const selected = THEMES.some(item => item.id === theme) ? theme : "dojo";
  document.documentElement.dataset.theme = selected;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", selected === "arcade" ? "#050713" : "#f8f7f3");
  const mark = selected === "arcade" ? "maru-crest.svg" : "maru-mark.svg";
  document.querySelector('link[rel="icon"]')?.setAttribute("href", "/assets/img/" + mark);
  document.querySelector(".brand img")?.setAttribute("src", "/assets/img/" + mark);
  document.querySelectorAll("[data-theme-choice]").forEach(button => {
    const active = button.dataset.themeChoice === selected;
    button.setAttribute("aria-pressed", String(active));
    button.classList.toggle("is-active", active);
  });
}
export function themeSwitcher() {
  return '<div class="theme-switcher" role="group" aria-label="Modo visual"><button class="theme-choice" data-theme-choice="dojo" aria-pressed="true"><span aria-hidden="true">道</span> Dojo</button><button class="theme-choice" data-theme-choice="arcade" aria-pressed="false"><span aria-hidden="true">✦</span> Arcade</button></div>';
}

export function syncMotion() {
  let paused = document.documentElement.dataset.motion === "paused";
  try { paused = localStorage.getItem("maru-decoration-paused") === "true"; } catch {}
  document.documentElement.dataset.motion = paused ? "paused" : "running";
  document.querySelectorAll("[data-motion-toggle]").forEach(button => {
    button.setAttribute("aria-pressed", String(paused));
    button.textContent = paused ? "Retomar animações" : "Pausar animações";
  });
}

export function toggleMotion() {
  const paused = document.documentElement.dataset.motion !== "paused";
  document.documentElement.dataset.motion = paused ? "paused" : "running";
  try { localStorage.setItem("maru-decoration-paused", String(paused)); } catch {}
  syncMotion();
}

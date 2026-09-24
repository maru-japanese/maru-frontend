import { nextLesson } from "/shared/learningPath.js";
import { dailyMissions } from "/shared/gamification.js";
import { MODULES, LESSONS } from "/shared/curriculum.js";
import { currentStreak, dueReviews, localDay } from "/shared/progress.js";
import { icon, routeLink, progressBar } from "../core/ui.js";
import { syncMotion, toggleMotion } from "../core/theme.js";

const DISCOVERY_GROUPS = [
  { title: "Aprender", description: "Encontre a base antes de praticar.", links: [["journey","Trilha de lições"],["kana","Hiragana e katakana"],["vocabulary","Primeiras palavras"],["kanji","Primeiros kanji"],["particles","Partículas"]] },
  { title: "Praticar", description: "Experimente e reveja no seu ritmo.", links: [["exercises","Exercícios e escuta"],["writing","Caderno de escrita"],["sentences","Formar frases"],["review","Revisão"]] },
  { title: "Explorar e levar", description: "Outros caminhos, papel e sala de aula.", links: [["themes","Trilhas temáticas"],["expressions","Expressões e gírias"],["worksheets","Folhas para imprimir"],["worksheets/book","Livro 1 completo"],["teacher","Para professores"]] }
];

export function renderDashboard(ctx) {
  const controller = new AbortController();
  const p = ctx.progress;
  const completed = LESSONS.filter(lesson => p.lessons[lesson.id]?.completedAt).length;
  const next = nextLesson(p);
  const goal = p.preferences.dailyGoal;
  const today = p.activity[localDay()] || 0;
  const due = dueReviews(p).length;
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - ((day.getDay() + 6) % 7) + i);
    const key = localDay(day);
    return `<div class="week-day ${key === localDay() ? "is-today" : ""}"><span>${["S", "T", "Q", "Q", "S", "S", "D"][i]}</span><i class="${p.activity[key] ? "is-done" : p.restDays[key] ? "is-rest" : ""}" title="${key}: ${p.restDays[key] ? "pausa protegida, sem atividade" : (p.activity[key] || 0) + " atividades"}">${p.activity[key] ? icon("check") : p.restDays[key] ? "休" : ""}</i></div>`;
  }).join("");
  ctx.main.innerHTML = `
    <div class="page-heading dashboard-heading"><div><p class="eyebrow">PEQUENOS PASSOS, NOVAS DESCOBERTAS</p><h1 tabindex="-1">${completed ? "Que bom ter você de volta." : "O seu começo no japonês."}</h1><p class="page-description">Um lugar para aprender, praticar e descobrir. No seu ritmo.</p></div><span class="date-label">${new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(new Date())}</span></div>
    <div class="dashboard-top">
      <section class="welcome-card">
        <div class="welcome-copy"><span class="pill light">${icon("leaf")} ${completed ? "CONTINUE A SUA JORNADA" : "FEITO PARA QUEM COMEÇA DO ZERO"}</span>
          <h2>Um novo idioma.<br>Um passo de<br><em>cada vez.</em></h2>
          <p>Do seu primeiro あ à sua primeira conversa.<br>Você não precisa saber nada para começar.</p>
          <div class="welcome-actions">${routeLink(next ? "lesson/" + next.id : "review", (completed || p.placement.acceptedModule ? "Continuar aprendendo" : "Começar do zero") + icon("arrow"), "btn btn-primary")}
          ${!completed && !p.placement.acceptedModule ? routeLink("placement", "Já sei um pouco " + icon("arrow"), "text-link placement-entry") : ""}
          ${!completed && !p.placement.acceptedModule ? routeLink("teacher", "Sou professor(a) " + icon("arrow"), "text-link placement-entry") : ""}
          </div>
          ${!completed && !p.placement.acceptedModule ? `<label class="welcome-goal" for="welcome-goal">Seu primeiro ritmo<select id="welcome-goal" class="text-input">${[5,10,15].map(amount => `<option value="${amount}" ${goal === amount ? "selected" : ""}>${amount} atividades por dia</option>`).join("")}</select></label>` : ""}
          <span class="hero-footnote">${icon("clock")} ${next ? next.minutes + " min · " + next.title : "Revise o que você já aprendeu"}</span>
        </div>
        <div class="kana-art" aria-hidden="true"><div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div><span class="art-sun"></span><span class="art-main jp">あ</span><span class="art-tag tag-hira">ひらがな <small>hiragana</small></span><span class="art-kana jp">ア</span><span class="art-kanji jp">日</span><span class="art-caption">はじめの一歩<small>o primeiro passo</small></span><svg class="art-spark" viewBox="0 0 32 32"><path d="M16 0Q18 14 32 16Q18 18 16 32Q14 18 0 16Q14 14 16 0" fill="currentColor"/></svg></div>
        <button type="button" class="motion-toggle" data-motion-toggle aria-pressed="false">Pausar animações</button>
      </section>
      <aside class="daily-card panel"><div class="section-label">${icon("target")} UM POUQUINHO, TODO DIA</div><h2>Sua meta de hoje</h2><p>O hábito começa com um pequeno passo.</p>
        <div class="goal-ring" style="--goal:${Math.min(100, today / goal * 100)}%"><div><strong>${Math.min(today, goal)}<span>/${goal}</span></strong><small>atividades</small></div></div>
        <div class="week-strip" aria-label="Atividade nesta semana">${week}</div><div class="daily-bottom">${icon("fire")} <span><strong>${currentStreak(p)} ${currentStreak(p) === 1 ? "dia" : "dias"}</strong> de constância</span>${routeLink("settings", "Ajustar meta", "text-link")}</div>
      </aside>
    </div>
    <section class="discovery-map" aria-labelledby="discovery-map-title"><div class="section-heading"><div><p class="eyebrow">TODOS OS CAMINHOS À VISTA</p><h2 id="discovery-map-title">O que você quer fazer agora?</h2></div>${routeLink("explore","Ver todos os recursos "+icon("arrow"),"text-link")}</div><div class="discovery-map-grid">${DISCOVERY_GROUPS.map(group=>`<div class="panel discovery-map-card"><h3>${group.title}</h3><p>${group.description}</p><ul>${group.links.map(([route,label])=>`<li>${routeLink(route,label+icon("arrow"),"discovery-map-link")}</li>`).join("")}</ul></div>`).join("")}</div></section>
    <section class="arcade-only panel mission-panel"><p class="eyebrow">SUAS MISSÕES DE HOJE</p><h2>Mais uma fase do seu aprendizado.</h2><div class="mission-list">${dailyMissions(p).map(mission => `<article class="mission-item"><strong>${mission.current === mission.target ? "✓ " : ""}${mission.title}</strong><p>${mission.description}</p>${progressBar(mission.current / mission.target * 100, mission.title)}<p>${mission.current} / ${mission.target}</p></article>`).join("")}</div></section>
    <section class="journey-preview"><div class="section-heading"><div><p class="eyebrow">DO PRIMEIRO SOM À PRIMEIRA FRASE</p><h2>Um caminho para chamar de seu</h2></div>${routeLink("journey", "Ver trilha completa " + icon("arrow"), "text-link")}</div>
      <div class="module-grid">${MODULES.slice(0, 4).map(module => {
        const done = module.lessons.filter(lesson => p.lessons[lesson.id]?.completedAt).length;
        return `<a class="module-card" href="#/journey/${module.id}"><div class="module-card-top"><span class="module-symbol ${module.color} jp" lang="ja">${module.symbol}</span><span class="module-number">${module.number}</span></div><h3>${module.title}</h3><p>${module.subtitle}</p><div class="module-card-footer"><span>${done ? done + " de " : ""}${module.lessons.length} lições</span>${icon("arrow")}</div>${progressBar(done / module.lessons.length * 100, "Progresso em " + module.title)}</a>`;
      }).join("")}</div>
    </section>
    <section><div class="section-heading"><div><p class="eyebrow">APRENDER TAMBÉM É EXPERIMENTAR</p><h2>Qual vai ser a prática de hoje?</h2></div><span class="muted small">Poucos minutos já fazem diferença.</span></div>
      <div class="practice-grid">${[
        ["practice", "target", "Praticar o que aprendeu", "Escuta, escrita e primeiras frases.", "sage"],
        ["explore", "book", "Encontrar novos caminhos", "Kana, palavras, cultura e materiais.", "sky"],
        ...(due ? [["review", "repeat", "Relembrar o que aprendeu", due + " itens esperando por você.", "lavender"]] : [])
      ].map(([route, symbol, title, text, color]) => `<a class="practice-card" href="#/${route}"><span class="practice-icon ${color}">${symbol === "あ" ? '<span class="jp">あ</span>' : icon(symbol)}</span><div><h3>${title}</h3><p>${text}</p></div>${icon("chevron")}</a>`).join("")}</div>
    </section>
    <div class="dashboard-note"><span class="jp" lang="ja">一歩ずつ</span><p><strong>Ippo zutsu. Um passo de cada vez.</strong><br>Você não precisa aprender tudo hoje. Só precisa dar o próximo passo.</p><span class="journey-total">${completed} de ${LESSONS.length} lições concluídas</span></div>
  `;
  syncMotion();
  ctx.main.querySelector("[data-motion-toggle]")?.addEventListener("click", toggleMotion, { signal: controller.signal });
  ctx.main.querySelector("#welcome-goal")?.addEventListener("change", event => {
    ctx.progress.preferences.dailyGoal = Number(event.target.value);
    ctx.save();
    ctx.toast("Meta ajustada. Você pode mudar seu ritmo quando quiser.");
    ctx.navigate("home");
  }, { signal: controller.signal });
  return () => controller.abort();
}

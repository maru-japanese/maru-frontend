import { getKanjiDetails } from "../core/kanji.js";
import { VOCABULARY_EXERCISES, LISTENING_EXERCISES, PARTICLE_EXERCISES, SITUATION_EXERCISES } from "/shared/exercises.js";
import { BEGINNER_KANJI, EXPRESSIONS, PARTICLES, ALL_KANA, SENTENCES } from "/shared/catalog.js";
import { DATA, LEVELS, LEVEL_META, CAT_LABEL } from "/shared/content.js";
import { SOURCES } from "/shared/curriculum.js";
import { dueReviews } from "/shared/progress.js";
import { pageHeading, icon, esc, audioButton, exampleHTML, routeLink, emptyState, jpHTML } from "../core/ui.js";
import { kanaPracticeItem } from "./kana.js";
import { renderPractice } from "./practice.js";

const addButton = (ctx, id) => `<button class="btn btn-ghost btn-small" data-add-review="${esc(id)}" ${ctx.progress.reviews[id] ? "disabled" : ""}>${icon(ctx.progress.reviews[id] ? "check" : "repeat")} ${ctx.progress.reviews[id] ? "Na sua revisão" : "Adicionar à revisão"}</button>`;
const kanjiItem = item => ({ id: item.id, prompt: item.char, answer: item.meaning, instruction: "QUAL É O SIGNIFICADO?", explanation: item.reading + " · " + item.romaji });

export const reviewCatalog = () => [
  ...VOCABULARY_EXERCISES, ...LISTENING_EXERCISES, ...PARTICLE_EXERCISES, ...SITUATION_EXERCISES,
  ...ALL_KANA.map(kanaPracticeItem),
  ...BEGINNER_KANJI.map(kanjiItem),
  ...EXPRESSIONS.map(item => ({ id: item.id, prompt: item.jp, answer: item.pt, instruction: "O QUE ESTA EXPRESSÃO QUER DIZER?", explanation: item.note })),
  ...DATA.map(item => ({ id: item.id, prompt: item.term, speech: item.example, answer: item.meaning, instruction: "QUAL É O SIGNIFICADO?", explanation: item.exampleMeaning })),
  ...SENTENCES.map(item => ({ id: "sentence-" + item.id, prompt: item.prompt, speech: item.tokens.map(token => token[0]).join(""), answer: item.tokens.map(token => token[0]).join("") + "。", instruction: "QUAL FRASE CORRESPONDE AO MODELO?", explanation: item.hint }))
];

export function renderKanji(ctx) {
  const controller = new AbortController();
  let cleanup;
  ctx.main.innerHTML = pageHeading("SIGNIFICADO EM CADA TRAÇO", "Pequenos encontros com kanji.", "Comece com 20 caracteres. Aprenda uma palavra junto com cada um: a leitura muda com o contexto.", routeLink("lesson/kanji-meaning", icon("book") + "Entender os kanji", "btn btn-ghost")) +
    `<div class="reference-banner sage"><span class="jp" lang="ja">山</span><div><h2>Não é sobre decorar tudo.</h2><p>É sobre reconhecer um pouco mais, todos os dias.</p></div><button class="btn btn-primary" id="practice-kanji">Praticar significados ${icon("arrow")}</button></div>
    <div class="kanji-grid">${BEGINNER_KANJI.map(item => `<details class="kanji-card panel" data-kanji="${item.char}"><summary><span class="kanji-card-symbol jp" lang="ja">${item.char}</span><h2>${item.meaning}</h2><p lang="ja">${item.reading}</p>${ctx.progress.preferences.romaji ? `<span class="romaji">${item.romaji}</span>` : ""}<span class="kanji-expand">Conhecer a palavra ${icon("down")}</span></summary><div class="kanji-card-details"><div class="kanji-api-details" data-kanji-details="${item.char}" aria-live="polite"></div>${exampleHTML({ jp: item.word, reading: item.wordReading, romaji: item.wordRomaji, pt: item.wordMeaning }, ctx.progress.preferences.romaji)}<div class="card-actions">${routeLink("writing/" + encodeURIComponent(item.char), icon("pen") + "Escrever", "btn btn-ghost btn-small")}${addButton(ctx, item.id)}</div></div></details>`).join("")}</div>`;
  ctx.main.addEventListener("toggle", async event => {
    const card=event.target;
    if(!card.matches?.("[data-kanji]") || !card.open || card.dataset.loaded) return;
    card.dataset.loaded="loading";
    const container=card.querySelector(".kanji-api-details");
    container.textContent="Consultando as leituras…";
    try {
      const data=await getKanjiDetails(card.dataset.kanji);
      if(controller.signal.aborted || !container.isConnected)return;
      container.innerHTML=`<p class="small"><strong>${data.stroke_count} traços</strong> · Outras leituras</p><dl><dt>Kun — leituras de origem japonesa</dt><dd lang="ja">${data.kun_readings.map(esc).join(" · ") || "Não informadas"}</dd><dt>On — leituras de origem chinesa</dt><dd lang="ja">${data.on_readings.map(esc).join(" · ") || "Não informadas"}</dd></dl><p class="small muted">Não precisa decorar a lista agora: a palavra determina a leitura. O ponto separa a parte escrita em kanji dos kana que a acompanham; o hífen indica ligação com outra parte.</p><a class="source-note" href="https://kanjiapi.dev/#!/documentation" target="_blank" rel="noreferrer">${data.source==="offline"?"Consulta salva da KanjiAPI · disponível sem conexão":"Leituras consultadas na KanjiAPI"}</a>`;
      card.dataset.loaded="ready";
    } catch(error) {
      if(controller.signal.aborted || !container.isConnected)return;
      container.textContent=error.message;
      delete card.dataset.loaded;
    }
  }, {capture:true,signal:controller.signal});
  ctx.main.querySelector("#practice-kanji").addEventListener("click", () => {
    cleanup = renderPractice(ctx, { title: "Seus primeiros kanji", items: BEGINNER_KANJI.map(kanjiItem), pool: BEGINNER_KANJI.map(kanjiItem), back: "kanji" });
    window.scrollTo({ top: 0 });
  }, { signal: controller.signal });
  return () => { controller.abort(); cleanup?.(); };
}

export function renderParticles(ctx) {
  ctx.main.innerHTML = pageHeading("AS PEQUENAS CONEXÕES", "Palavras encontram seu lugar.", "Partículas mostram a relação entre as palavras. Aprenda pela função e pelos exemplos.", routeLink("lesson/particle-topic", "Estudar passo a passo " + icon("arrow"), "btn btn-primary")) +
    `<div class="particle-grid">${PARTICLES.map(item => `<article class="panel particle-card"><div class="particle-card-head"><span class="particle-symbol jp" lang="ja">${item.char}</span><div><span class="romaji">${item.sound}</span><h2>${item.name}</h2></div></div><p>${item.meaning}</p>${exampleHTML(item, ctx.progress.preferences.romaji)}<p class="particle-note">${item.note}</p></article>`).join("")}</div>`;
}

export function renderExpressions(ctx) {
  let category = "all";
  let query = "";
  const controller = new AbortController();
  const categories = [["all", "Todas"], ["everyday", "Dia a dia"], ["culture", "Expressões culturais"], ["slang", "Gírias"], ["internet", "Internet & fãs"], ["work", "Trabalho"]];
  ctx.main.innerHTML = pageHeading("JAPONÊS FORA DOS LIVROS", "A conversa tem contexto.", "Expressões, gírias e jargões com pistas de quando usar — e com quem.", routeLink("lesson/casual-register", icon("book") + "Entender os registros", "btn btn-ghost")) +
    `<div class="reference-banner lavender"><span class="jp" lang="ja">ね</span><div><h2>Entender vem antes de sair usando.</h2><p>Relação, situação e entonação também fazem parte do significado.</p></div></div><div class="toolbar"><div class="filter-chips" id="expression-filters">${categories.map(([id, title]) => `<button class="chip ${id === category ? "is-active" : ""}" data-category="${id}" aria-pressed="${id === category}">${title}</button>`).join("")}</div><label class="search-field">${icon("search")}<input id="expression-search" type="search" aria-label="Buscar expressão" placeholder="Buscar expressão…"></label></div><div class="expression-grid" id="expression-results"></div>`;
  const results = ctx.main.querySelector("#expression-results");
  function drawResults() {
    const list = EXPRESSIONS.filter(item => (category === "all" || item.category === category) && [item.jp, item.romaji, item.pt, item.note].some(text => text.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))));
    results.innerHTML = list.length ? list.map(item => `<article class="panel expression-card"><span class="pill ${["slang", "internet"].includes(item.category) ? "peach" : "sage"}">${categories.find(([id]) => id === item.category)[1]}</span>${exampleHTML(item, ctx.progress.preferences.romaji)}<div class="context-box"><span class="eyebrow">EM CONTEXTO</span><p>${item.context}</p></div>${addButton(ctx, item.id)}</article>`).join("") : emptyState("Nenhuma expressão por aqui", "Tente outro termo ou outra categoria.");
  }
  ctx.main.addEventListener("input", event => { if (event.target.id === "expression-search") { query = event.target.value; drawResults(); } }, { signal: controller.signal });
  ctx.main.addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    category = button.dataset.category;
    ctx.main.querySelectorAll("[data-category]").forEach(item => { item.classList.toggle("is-active", item === button); item.setAttribute("aria-pressed", String(item === button)); });
    drawResults();
  }, { signal: controller.signal });
  drawResults();
  return () => controller.abort();
}

export function renderLibrary(ctx) {
  let level = "N5", category = "all", query = "";
  const controller = new AbortController();
  ctx.main.innerHTML = pageHeading("PARA CONSULTAR E IR ALÉM", "Sua pequena biblioteca.", "Um acervo complementar de vocabulário, kanji e estruturas. Se está começando, siga a trilha primeiro.", routeLink("journey", "Minha trilha " + icon("arrow"), "btn btn-ghost")) +
    `<aside class="tip-box">${icon("book")}<p>Este acervo é uma seleção de estudo, não um curso completo ou uma lista oficial do JLPT. Os níveis ajudam a organizar a consulta; não medem fluência nem domínio de conversação.</p></aside><div class="toolbar library-toolbar"><div><label class="input-label" for="library-level">Nível de referência</label><select class="text-input" id="library-level">${LEVELS.map(item => `<option value="${item}">${item} · ${LEVEL_META[item].name}</option>`).join("")}</select></div><div><label class="input-label" for="library-category">Tipo de conteúdo</label><select class="text-input" id="library-category">${Object.entries(CAT_LABEL).map(([id, label]) => `<option value="${id}">${label}</option>`).join("")}</select></div><label class="search-field">${icon("search")}<input id="library-search" type="search" placeholder="Buscar no acervo…" aria-label="Buscar no acervo"></label></div><div class="library-grid" id="library-results"></div><section class="resources-section"><div class="section-heading"><div><p class="eyebrow">CONTINUE DESCOBRINDO</p><h2>Recursos de referência</h2></div></div><div class="resource-grid">${SOURCES.map(item => `<a class="resource-link panel" href="${item.url}" target="_blank" rel="noreferrer"><div><h3>${item.title}</h3><p>${item.detail}</p></div>${icon("external")}</a>`).join("")}</div></section>`;
  function drawResults() {
    const list = DATA.filter(item => item.level === level && (category === "all" || item.cat === category) && [item.term, item.meaning, item.reading].some(text => text.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))));
    ctx.main.querySelector("#library-results").innerHTML = list.length ? list.map(item => `<article class="panel library-card"><span class="pill">${item.level} · ${CAT_LABEL[item.cat]}</span><h2 class="jp" lang="ja">${jpHTML(item.term, item.cat === "grammar" ? "" : item.reading)}</h2><p class="romaji" lang="ja">${esc(item.reading)}</p><h3>${esc(item.meaning)}</h3><div class="library-example"><p class="jp" lang="ja">${jpHTML(item.example, item.exampleReading)} ${audioButton(item.example)}</p><p class="small" lang="ja">${esc(item.exampleReading)}</p><p>${esc(item.exampleMeaning)}</p></div>${addButton(ctx, item.id)}</article>`).join("") : emptyState("Nenhum resultado", "Experimente mudar o nível, o tipo ou a busca.");
  }
  ctx.main.addEventListener("change", event => {
    if (event.target.id === "library-level") level = event.target.value;
    if (event.target.id === "library-category") category = event.target.value;
    drawResults();
  }, { signal: controller.signal });
  ctx.main.addEventListener("input", event => { if (event.target.id === "library-search") { query = event.target.value; drawResults(); } }, { signal: controller.signal });
  drawResults();
  return () => controller.abort();
}

export function renderReview(ctx) {
  const catalog = reviewCatalog();
  const due = new Set(dueReviews(ctx.progress));
  const items = catalog.filter(item => due.has(item.id));
  let cleanup;
  const controller = new AbortController();
  const total = catalog.filter(item => ctx.progress.reviews[item.id]).length;
  ctx.main.innerHTML = pageHeading("RELEMBRAR É APRENDER DE NOVO", "Faça o conhecimento ficar.", "Revisões curtas trazem de volta o que você estudou, no intervalo certo.") +
    `<div class="review-summary"><div class="panel stat-card"><span class="stat-icon peach">${icon("repeat")}</span><strong>${items.length}</strong><p>para revisar agora</p></div><div class="panel stat-card"><span class="stat-icon sage">${icon("book")}</span><strong>${total}</strong><p>itens no seu repertório</p></div><div class="panel stat-card"><span class="stat-icon lavender">${icon("check")}</span><strong>${catalog.filter(item => ctx.progress.reviews[item.id]?.streak >= 3).length}</strong><p>com 3 acertos seguidos</p></div></div>` +
    (items.length ? `<section class="panel review-ready"><span class="empty-symbol jp">復</span><h2>Um reencontro com o que você já viu.</h2><p>Até 10 perguntas por rodada. Kana, kanji, palavras e frases que você adicionou ou praticou.</p><button class="btn btn-primary" id="start-review">Começar revisão ${icon("arrow")}</button></section>` : emptyState(total ? "Tudo em dia por aqui." : "Seu repertório começa com uma descoberta.", total ? "Seus itens estão aguardando o próximo intervalo. Enquanto isso, explore uma lição ou pratique algo novo." : "Pratique kana ou adicione palavras, kanji e expressões à revisão. Os itens aparecerão aqui.", routeLink(total ? "journey" : "kana", total ? "Continuar a trilha" : "Conhecer os primeiros kana", "btn btn-primary"))) +
    `<aside class="tip-box">${icon("clock")}<p>Erros voltam em 10 minutos. Acertos voltam em 1 dia e, depois, em intervalos maiores (2, 4, 8… até 60 dias). Você pode continuar praticando livremente nas outras áreas.</p></aside>`;
  ctx.main.querySelector("#start-review")?.addEventListener("click", () => {
    cleanup = renderPractice(ctx, { title: "Revisando seu repertório", items, pool: catalog, back: "review" });
  }, { signal: controller.signal });
  return () => { controller.abort(); cleanup?.(); };
}

export function addToReview(ctx, button) {
  const id = button.dataset.addReview;
  if (ctx.progress.reviews[id] || !reviewCatalog().some(item => item.id === id)) return;
  ctx.progress.reviews[id] = { due: Date.now(), interval: 0, attempts: 0, correct: 0, streak: 0, updatedAt: Date.now() };
  ctx.save();
  button.disabled = true;
  button.innerHTML = icon("check") + " Na sua revisão";
  ctx.toast("Adicionado. Este item já está disponível na sua revisão.");
}

import { VOCABULARY, VOCABULARY_GROUPS } from "/shared/vocabulary.js";
import { GLOSSARY } from "/shared/glossary.js";
import { EXERCISE_GROUPS, VOCABULARY_EXERCISES } from "/shared/exercises.js";
import { PICTURE_WORDS } from "/shared/printActivities.js";
import { pageHeading, icon, esc, audioButton, exampleHTML, routeLink, emptyState, jpHTML, irasutoyaImg } from "../core/ui.js";
import { renderPractice } from "./practice.js";

const wordImage = Object.fromEntries(PICTURE_WORDS.map(item => [item.wordId, item.id]));

export function renderVocabulary(ctx) {
  const controller = new AbortController();
  let group = "all", query = "", cleanup;
  let filtered = VOCABULARY;
  ctx.main.innerHTML = pageHeading("SEU PRIMEIRO REPERTÓRIO", "Palavras para o seu dia.", "Aprenda o significado, ouça a leitura e veja cada palavra funcionando numa frase.", routeLink("exercises", "Praticar " + icon("arrow"), "btn btn-primary")) +
    `<aside class="learning-intro">${icon("book")}<div><strong>Você não precisa decorar esta página inteira.</strong><p>Escolha um tema e conheça cinco palavras. O texto em kana mostra a leitura; o português mostra o significado. Depois, tente reconhecer as palavras sem olhar. ${routeLink("glossary", "Entenda os termos das explicações.", "")}</p></div></aside>
    <div class="toolbar"><label class="search-field">${icon("search")}<input id="word-search" type="search" placeholder="Buscar em português, japonês ou romaji…" aria-label="Buscar palavra"></label><select id="word-group" class="text-input" aria-label="Tema das palavras">${VOCABULARY_GROUPS.map(([id,label]) => `<option value="${id}">${label}</option>`).join("")}</select><button id="practice-words" class="btn btn-ghost">Praticar este tema</button></div><p id="word-count" class="filter-count" aria-live="polite"></p><div class="vocabulary-grid" id="word-results"></div>`;
  const draw = () => {
    const normalized = query.toLocaleLowerCase("pt-BR");
    filtered = VOCABULARY.filter(item => (group === "all" || item.group === group) && [item.jp,item.reading,item.romaji,item.pt].some(text => text.toLocaleLowerCase("pt-BR").includes(normalized)));
    ctx.main.querySelector("#word-count").textContent = filtered.length + " de " + VOCABULARY.length + " palavras";
    ctx.main.querySelector("#practice-words").disabled = !filtered.length;
    ctx.main.querySelector("#word-results").innerHTML = filtered.length ? filtered.map(item => `<article class="panel word-card">${wordImage[item.id] ? irasutoyaImg(wordImage[item.id], item.pt) : ""}<div class="word-card-top"><h2 class="jp" lang="ja">${jpHTML(item.jp, item.reading)}</h2>${audioButton(item.jp, "Ouvir " + item.pt)}</div><p class="word-reading"><span lang="ja">${item.reading}</span>${ctx.progress.preferences.romaji ? " · " + item.romaji : ""}</p><p class="word-meaning">${item.pt}</p>${exampleHTML({jp:item.sentence,reading:item.sentenceReading,romaji:item.sentenceRomaji,pt:item.translation},ctx.progress.preferences.romaji)}${item.note ? `<p class="small muted">${item.note}</p>` : ""}<button class="btn btn-ghost btn-small" data-add-review="${item.id}" ${ctx.progress.reviews[item.id] ? "disabled" : ""}>${icon(ctx.progress.reviews[item.id] ? "check" : "repeat")} ${ctx.progress.reviews[item.id] ? "Na sua revisão" : "Adicionar à revisão"}</button></article>`).join("") : emptyState("Nenhuma palavra encontrada", "Tente outro termo ou tema.");
  };
  ctx.main.addEventListener("input", event => { if (event.target.id === "word-search") { query = event.target.value; draw(); } }, {signal:controller.signal});
  ctx.main.addEventListener("change", event => { if (event.target.id === "word-group") { group = event.target.value; draw(); } }, {signal:controller.signal});
  ctx.main.addEventListener("click", event => {
    if (event.target.closest("#practice-words")) {
      const ids = new Set(filtered.map(item => item.id));
      cleanup = renderPractice(ctx,{title:"Seu primeiro repertório",items:VOCABULARY_EXERCISES.filter(item=>ids.has(item.id)),pool:VOCABULARY_EXERCISES,back:"vocabulary"});
    }
  }, {signal:controller.signal});
  draw();
  return () => {controller.abort();cleanup?.();};
}

export function renderGlossary(ctx) {
  const controller = new AbortController();
  ctx.main.innerHTML = pageHeading("SEM MISTÉRIO", "Cada termo, uma explicação.", "Não lembra de gramática? Nunca viu a palavra kana? Comece por aqui e volte sempre que precisar.", routeLink("lesson/start-language","Entender passo a passo " + icon("arrow"),"btn btn-ghost")) +
    `<div class="toolbar"><label class="search-field">${icon("search")}<input id="glossary-search" type="search" aria-label="Buscar explicação" placeholder="Ex.: partícula, verbo, romaji…"></label><span class="small muted">${GLOSSARY.length} conceitos explicados do zero</span></div><div class="concept-grid" id="glossary-results"></div>`;
  const draw = query => {
    const list = GLOSSARY.filter(item => [item.term,item.definition,...item.aliases].some(text=>text.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))));
    ctx.main.querySelector("#glossary-results").innerHTML = list.length ? list.map(item => `<article class="panel concept-card" id="concept-${item.id}"><h2>${item.term}</h2><p>${item.definition}</p><p class="concept-example">${item.example}</p></article>`).join("") : emptyState("Nenhum termo encontrado","Tente uma palavra mais curta.");
  };
  ctx.main.addEventListener("input",event=>{if(event.target.id==="glossary-search")draw(event.target.value);},{signal:controller.signal});
  draw("");
  return () => controller.abort();
}

export function renderExercises(ctx) {
  const controller = new AbortController();
  let cleanup;
  ctx.main.innerHTML = pageHeading("APRENDER FAZENDO", "Uma descoberta a cada tentativa.", "Rodadas de até dez perguntas, com explicação após cada resposta e uma nova chance para os erros.", routeLink("review","Minha revisão " + icon("repeat"),"btn btn-ghost"))+
    `<div class="learning-intro">${icon("spark")}<div><strong>Comece pelo que você acabou de aprender.</strong><p>Nas perguntas de partículas, siga a situação indicada: uma mesma frase pode mudar de intenção com outra partícula. Na escuta, toque no alto-falante e repita quantas vezes quiser. Os acertos e erros entram na sua revisão.</p></div></div><div class="exercise-grid">${EXERCISE_GROUPS.map(group => `<section class="panel exercise-card"><span class="exercise-symbol" lang="ja">${group.symbol}</span><span class="pill">${group.items.length} atividades</span><h2>${group.title}</h2><p>${group.description}</p><button class="btn btn-primary" data-start-exercises="${group.id}">Começar prática ${icon("arrow")}</button></section>`).join("")}</div><div class="quick-learning-links">${routeLink("sentences",icon("chat")+" Formar frases","btn btn-ghost")}${routeLink("worksheets",icon("pen")+" Atividades para imprimir","btn btn-ghost")}${routeLink("vocabulary",icon("book")+" Conhecer as palavras","btn btn-ghost")}</div>`;
  ctx.main.addEventListener("click",event=>{
    const id=event.target.closest("[data-start-exercises]")?.dataset.startExercises;
    const group=EXERCISE_GROUPS.find(item=>item.id===id);
    if(group){cleanup=renderPractice(ctx,{title:group.title,items:group.items,pool:group.items,back:"exercises"});window.scrollTo({top:0});}
  },{signal:controller.signal});
  return ()=>{controller.abort();cleanup?.();};
}

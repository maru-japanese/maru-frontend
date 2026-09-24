import { THEMATIC_PATHS, thematicContent } from "/shared/discovery.js";
import { getLesson } from "/shared/curriculum.js";
import { vocabularyPracticeItem } from "/shared/exercises.js";
import { renderPractice } from "./practice.js";
import { esc, icon, pageHeading, routeLink, exampleHTML } from "../core/ui.js";

export function renderThematic(ctx, id) {
  const path = thematicContent(id);
  if (!path) {
    ctx.main.innerHTML = pageHeading("SEU INTERESSE TAMBÉM É UM CAMINHO", "Japonês que conversa com você.", "Escolha um tema e reencontre palavras, frases e lições da trilha em situações que fazem sentido para você.") +
      `<div class="thematic-grid">${THEMATIC_PATHS.map(item => `<article class="panel thematic-card"><span class="hanko jp" lang="ja">${item.symbol}</span><h2>${item.title}</h2><p>${item.description}</p><span class="small muted">${item.wordIds.length} palavras · ${item.sentenceIds.length} frases · ${item.expressionIds.length} expressões</span>${routeLink("themes/" + item.id, "Explorar este caminho " + icon("arrow"), "btn btn-primary")}</article>`).join("")}</div>`;
    return;
  }
  const controller = new AbortController();
  let cleanup;
  const items = [...path.words.map(vocabularyPracticeItem), ...path.expressions.map(item => ({ id: item.id, prompt: item.jp, speech: item.jp, answer: item.pt, instruction: "O QUE ESTA EXPRESSÃO QUER DIZER?", explanation: item.note }))];
  ctx.main.innerHTML = pageHeading("TRILHA TEMÁTICA", path.title, path.description, routeLink("themes", "Outros caminhos", "btn btn-ghost")) +
    `<aside class="tip-box">${icon("book")}<p>${path.note}</p></aside><section class="panel thematic-lessons"><h2>Um pouco de base para este encontro</h2><div class="quick-learning-links">${path.lessonIds.map(id => routeLink("lesson/" + id, getLesson(id).title + icon("arrow"), "btn btn-ghost")).join("")}</div><button class="btn btn-primary" id="thematic-practice">Praticar este repertório ${icon("arrow")}</button></section><div class="section-heading"><h2>Palavras para começar</h2></div><div class="vocabulary-grid">${path.words.map(item => `<article class="panel word-card">${exampleHTML({ jp:item.jp, reading:item.reading, romaji:item.romaji, pt:item.pt }, ctx.progress.preferences.romaji)}${exampleHTML({jp:item.sentence,reading:item.sentenceReading,romaji:item.sentenceRomaji,pt:item.translation},ctx.progress.preferences.romaji)}</article>`).join("")}</div><div class="section-heading thematic-heading"><h2>Uma ideia ganha forma</h2></div><div class="expression-grid">${path.sentences.map(item => `<article class="panel expression-card">${exampleHTML({jp:item.tokens.map(t=>t[0]).join("")+"。",reading:item.tokens.map(t=>t[3]||t[0]).join("")+"。",romaji:item.tokens.map(t=>t[1]).join(" "),pt:item.prompt,note:item.hint},ctx.progress.preferences.romaji)}${routeLink("sentences/" + item.id, "Montar esta frase " + icon("arrow"), "text-link")}</article>`).join("")}</div><div class="section-heading thematic-heading"><h2>A expressão e seu contexto</h2></div><div class="expression-grid">${path.expressions.map(item=>`<article class="panel expression-card">${exampleHTML(item,ctx.progress.preferences.romaji)}<p class="small muted">${esc(item.context)}</p></article>`).join("")}</div>`;
  ctx.main.querySelector("#thematic-practice").addEventListener("click", () => { cleanup = renderPractice(ctx, { title:path.title, items, pool:items, back:"themes/" + id }); }, { signal:controller.signal });
  return () => { controller.abort(); cleanup?.(); };
}

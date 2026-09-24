import { SENTENCES } from "/shared/catalog.js";
import { recordReview } from "/shared/progress.js";
import { checkGuidedSentence } from "/shared/sentenceCheck.js";
import { checkPhrase } from "../api.js";
import { pageHeading, esc, icon, routeLink, shuffle, audioButton, jpHTML } from "../core/ui.js";

export function renderSentences(ctx, id = "") {
  let index = Math.max(0, SENTENCES.findIndex(item => item.id === id));
  let mode = "blocks";
  let selected = [];
  let tokens;
  let feedback = null;
  let pending = false;
  let typed = "";
  let recorded = false;
  let attempted = false;
  const controller = new AbortController();
  const reset = () => {
    selected = []; feedback = null; typed = ""; recorded = false; attempted = false;
    const exercise = SENTENCES[index];
    tokens = shuffle([...exercise.tokens, ...exercise.distractors].map((token, id) => ({ id, jp: token[0], romaji: token[1], pt: token[2], reading: token[3] || token[0] })));
  };
  function draw() {
    const exercise = SENTENCES[index];
    ctx.main.innerHTML = pageHeading("DO SOM À IDEIA", "Sua primeira frase, palavra por palavra.", "Monte os blocos ou digite a resposta. Entenda o papel de cada palavra.", routeLink("lesson/sentence-identity", icon("book") + "Aprender a estrutura", "btn btn-ghost")) +
      `<div class="sentence-layout"><aside class="panel exercise-list"><p class="eyebrow">ESCOLHA UMA SITUAÇÃO</p>${SENTENCES.map((item, i) => `<button data-exercise="${i}" class="exercise-item ${i === index ? "is-active" : ""}" aria-current="${i === index ? "step" : "false"}"><span>${String(i + 1).padStart(2, "0")}</span>${item.title}${ctx.progress.reviews["sentence-" + item.id]?.correct ? icon("check") : ""}</button>`).join("")}</aside>
      <section class="panel sentence-workspace"><div class="section-heading compact"><span class="pill sky">SITUAÇÃO ${index + 1} / ${SENTENCES.length}</span><div class="segmented small-segmented"><button data-mode="blocks" class="${mode === "blocks" ? "is-active" : ""}" aria-pressed="${mode === "blocks"}">Blocos</button><button data-mode="typed" class="${mode === "typed" ? "is-active" : ""}" aria-pressed="${mode === "typed"}">Digitar</button></div></div><p class="eyebrow sentence-prompt-label">COMO VOCÊ DIRIA…</p><h2 class="sentence-prompt">“${exercise.prompt}”</h2>
      <form id="sentence-form">${mode === "blocks" ? `<div class="sentence-answer" aria-label="Sua frase">${selected.length ? selected.map(id => {
        const token = tokens.find(item => item.id === id);
        return `<button type="button" class="word-token selected-token" data-remove="${id}" aria-label="Remover ${esc(token.jp)}" ${pending || feedback?.correct ? "disabled" : ""}><span class="jp" lang="ja">${jpHTML(token.jp, token.reading)}</span>${ctx.progress.preferences.romaji ? `<small>${token.romaji}</small>` : ""}</button>`;
      }).join("") + '<span class="sentence-period jp">。</span>' : '<p class="muted">Toque nas palavras abaixo para montar sua frase.</p>'}</div><div class="token-bank" aria-label="Palavras disponíveis">${tokens.map(token => `<button type="button" class="word-token" data-token="${token.id}" ${selected.includes(token.id) || pending || feedback?.correct ? "disabled" : ""}><span class="jp" lang="ja">${jpHTML(token.jp, token.reading)}</span>${ctx.progress.preferences.romaji ? `<small>${token.romaji}</small>` : ""}<span class="token-meaning">${token.pt}</span></button>`).join("")}</div>` : `<label class="input-label" for="sentence-text">Sua frase em japonês ou romaji</label><textarea id="sentence-text" name="sentence" class="text-input sentence-text" placeholder="Ex.: watashi wa gakusei desu" autocomplete="off" spellcheck="false" ${pending || feedback?.correct ? "disabled" : ""}>${esc(typed)}</textarea>`}
      <details class="sentence-hint"><summary>${icon("spark")} Preciso de uma dica ${icon("down")}</summary><p>${exercise.pattern}</p><p class="muted">${exercise.hint}</p></details>
      ${feedback ? `<div class="feedback ${feedback.correct ? "success" : "retry"}" role="status"><strong>${feedback.correct ? "Sua ideia ganhou forma!" : "Vamos ajustar esta frase."}</strong><p>${feedback.message}</p>${feedback.correct ? `<div class="example-line"><span class="jp" lang="ja">${jpHTML(feedback.model, feedback.modelReading)}</span>${audioButton(feedback.model)}</div>` : `<p>${feedback.explanation}</p><details><summary>Ver o modelo e comparar</summary><p class="jp" lang="ja">${jpHTML(feedback.model, feedback.modelReading)}</p>${ctx.progress.preferences.romaji ? `<p>${feedback.romaji}</p>` : ""}</details>`}</div>` : ""}
      <div class="lesson-controls"><button type="button" class="btn btn-ghost" data-sentence="clear" ${pending ? "disabled" : ""}>${icon("undo")} Recomeçar</button>${feedback?.correct ? `<button type="button" class="btn btn-primary" data-sentence="next">${index + 1 === SENTENCES.length ? "Praticar novamente" : "Próxima situação"} ${icon("arrow")}</button>` : `<button type="submit" class="btn btn-primary" ${pending || (mode === "blocks" && !selected.length) ? "disabled" : ""}>${pending ? "Verificando…" : "Verificar frase"} ${icon("arrow")}</button>`}</div></form><details class="concept-help"><summary>Entenda cada parte do modelo</summary><p class="sentence-explanation">${exercise.hint}</p><div class="sentence-breakdown">${exercise.tokens.map(token => `<span><b lang="ja">${jpHTML(token[0], token[3] || token[0])}</b><small>${token[2]}</small></span>`).join("")}</div></details><p class="source-note">A verificação compara sua resposta ao modelo da atividade. Outras frases podem ser válidas; esta ferramenta não é um corretor geral de japonês.</p></section></div>`;
  }
  ctx.main.addEventListener("input", event => { if (event.target.id === "sentence-text") typed = event.target.value; }, { signal: controller.signal });
  ctx.main.addEventListener("click", event => {
    const target = event.target.closest("button");
    if (!target || pending) return;
    if (target.dataset.exercise !== undefined) { index = Number(target.dataset.exercise); reset(); draw(); }
    if (target.dataset.mode) { mode = target.dataset.mode; feedback = null; draw(); }
    if (target.dataset.token !== undefined && !feedback?.correct) { selected.push(Number(target.dataset.token)); feedback = null; draw(); }
    if (target.dataset.remove !== undefined && !feedback?.correct) { selected = selected.filter(id => id !== Number(target.dataset.remove)); feedback = null; draw(); }
    if (target.dataset.sentence === "clear") { const wasRecorded = recorded, wasAttempted = attempted; reset(); recorded = wasRecorded; attempted = wasAttempted; draw(); }
    if (target.dataset.sentence === "next") { index = (index + 1) % SENTENCES.length; reset(); draw(); }
  }, { signal: controller.signal });
  ctx.main.addEventListener("submit", async event => {
    if (event.target.id !== "sentence-form") return;
    event.preventDefault();
    if (pending || feedback?.correct) return;
    const exercise = SENTENCES[index];
    const text = mode === "blocks" ? selected.map(id => tokens.find(token => token.id === id).jp).join("") : typed;
    if (!text.trim()) { ctx.toast("Escreva sua frase antes de verificar."); return; }
    pending = true; draw();
    try { feedback = await checkPhrase({ exerciseId: exercise.id, text }); }
    catch { feedback = checkGuidedSentence(exercise.id, text); }
    if (controller.signal.aborted) return;
    pending = false;
    ctx.audio.feedback(feedback.correct ? "correct" : "wrong");
    if (!recorded && (feedback.correct || !attempted)) {
      recordReview(ctx.progress, "sentence-" + exercise.id, feedback.correct);
      if (feedback.correct) ctx.progress.stats.sentencesWritten++;
      recorded = feedback.correct; attempted = true; ctx.save();
    }
    draw();
    ctx.main.querySelector(".feedback")?.scrollIntoView({ block: "nearest" });
  }, { signal: controller.signal });
  reset(); draw();
  return () => controller.abort();
}

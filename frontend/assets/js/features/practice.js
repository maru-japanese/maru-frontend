import { recordReview } from "/shared/progress.js";
import { isTypedAnswerCorrect } from "/shared/romaji.js";
import { esc, icon, routeLink, progressBar, shuffle, audioButton, irasutoyaImg, jpHTML } from "../core/ui.js";

export function renderPractice(ctx, options) {
  let queue = shuffle(options.items).slice(0, 10);
  let index = 0;
  let feedback = null;
  let misses = [];
  let correctCount = 0;
  let choices = [];
  const controller = new AbortController();
  function setChoices() {
    const item = queue[index];
    if (!item) return;
    const sameKind = options.pool.filter(entry => (entry.instruction || "QUAL É A LEITURA?") === (item.instruction || "QUAL É A LEITURA?"));
    const others = [...new Set(sameKind.map(entry => entry.answer))].filter(answer => answer !== item.answer);
    choices = item.choices ? shuffle(item.choices) : shuffle([item.answer, ...shuffle(others).slice(0, 3)]);
  }
  function draw() {
    if (index >= queue.length) {
      ctx.audio.feedback("complete");
      ctx.main.innerHTML = `<div class="practice-session">${routeLink(options.back, icon("back") + "Voltar", "back-link")}<div class="panel completion"><span class="completion-mark">${icon("spark")}</span><p class="eyebrow">PRÁTICA CONCLUÍDA</p><h1 tabindex="-1">Cada tentativa conta.</h1><p>Você acertou <strong>${correctCount} de ${queue.length}</strong> nesta rodada.<br>${misses.length ? "Os itens que precisam de atenção voltam à revisão em 10 minutos." : "Os itens voltam à revisão conforme seu intervalo de estudo."}</p><div class="completion-actions">${misses.length ? '<button class="btn btn-primary" data-practice="retry">Repetir os que errei</button>' : routeLink(options.back, "Continuar explorando", "btn btn-primary")}${routeLink("home", "Meu aprendizado", "btn btn-ghost")}</div></div></div>`;
      return;
    }
    const item = queue[index];
    ctx.main.innerHTML = `<div class="practice-session">${routeLink(options.back, icon("back") + "Encerrar prática", "back-link")}<div class="session-heading"><h1 tabindex="-1">${options.title}</h1><span>${index + 1} / ${queue.length}</span></div>${progressBar(index / queue.length * 100, "Progresso da prática")}<div class="quiz-stage panel"><p class="eyebrow">${item.instruction || "QUAL É A LEITURA?"}</p>${item.listening ? `<div class="listening-prompt">${audioButton(item.speech || item.prompt, "Ouvir a pergunta")}</div><p class="listening-instruction">Toque para ouvir. Você pode repetir antes de responder.</p>` : item.image ? `<div class="quiz-image">${irasutoyaImg(item.image, "Ilustração para a atividade")}</div>` : `<div class="quiz-character ${item.id.startsWith("situation-") || item.id.startsWith("dialogue-") ? "is-situation" : "jp"}">${jpHTML(item.prompt, item.reading)}</div>${feedback ? audioButton(item.speech || item.prompt) : ""}`}${item.context ? `<p class="muted">${esc(item.context)}</p>` : ""}<form id="practice-answer">${options.typed ? `<label class="input-label" for="typed-answer">Sua resposta em romaji ou kana</label><input id="typed-answer" name="answer" class="text-input" autocomplete="off" autocapitalize="off" spellcheck="false" required ${feedback ? "disabled" : ""} placeholder="Digite a leitura…">` : `<fieldset class="quiz-options" ${feedback ? "disabled" : ""}><legend class="sr-only">Escolha a resposta</legend>${choices.map((answer, i) => `<label class="answer-option ${feedback && answer === item.answer ? "is-correct" : feedback && answer === feedback.input && !feedback.correct ? "is-wrong" : ""}"><input type="radio" name="answer" value="${esc(answer)}" required ${feedback?.input === answer ? "checked" : ""}><span class="option-letter">${i + 1}</span><span>${esc(answer)}</span></label>`).join("")}</fieldset>`}${feedback ? `<div class="feedback ${feedback.correct ? "success" : "retry"}" role="status"><strong>${feedback.correct ? "Muito bem!" : "Quase. Vamos lembrar:"}</strong><p><span lang="ja">${jpHTML(item.prompt, item.reading)}</span> → <strong>${jpHTML(item.answer, item.answerReading)}</strong>${item.explanation ? " · " + esc(item.explanation) : ""}</p></div><button type="button" class="btn btn-primary" data-practice="next">Continuar ${icon("arrow")}</button>` : '<button type="submit" class="btn btn-primary">Verificar resposta</button>'}</form></div></div>`;
    if (options.typed && !feedback) ctx.main.querySelector("#typed-answer")?.focus({ preventScroll: true });
  }
  ctx.main.addEventListener("submit", event => {
    if (event.target.id !== "practice-answer") return;
    event.preventDefault();
    if (feedback) return;
    const input = String(new FormData(event.target).get("answer") || "").trim();
    if (!input) return;
    const item = queue[index];
    const correct = options.typed
      ? isTypedAnswerCorrect(input, { term: item.prompt, reading: item.reading || item.prompt }) || input.toLowerCase() === item.answer.toLowerCase()
      : input === item.answer;
    feedback = { input, correct };
    if (correct) correctCount++; else misses.push(item);
    recordReview(ctx.progress, item.id, correct);
    ctx.audio.feedback(correct ? "correct" : "wrong");
    ctx.save();
    draw();
    ctx.main.querySelector('[data-practice="next"]')?.focus();
  }, { signal: controller.signal });
  ctx.main.addEventListener("click", event => {
    const action = event.target.closest("[data-practice]")?.dataset.practice;
    if (action === "next" && feedback) { ctx.audio.stop(); index++; feedback = null; setChoices(); draw(); }
    if (action === "retry") {
      queue = shuffle(misses); misses = []; index = 0; correctCount = 0; feedback = null;
      setChoices(); draw();
    }
  }, { signal: controller.signal });
  setChoices(); draw();
  return () => { controller.abort(); ctx.audio.stop(); };
}

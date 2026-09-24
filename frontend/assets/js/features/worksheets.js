import { KANA, KANA_ROWS } from "/shared/content.js";
import { BEGINNER_KANJI, SENTENCES } from "/shared/catalog.js";
import { VOCABULARY, VOCABULARY_GROUPS } from "/shared/vocabulary.js";
import { PICTURE_WORDS, PICTURE_BANK_ORDER, PRINT_DIALOGUES } from "/shared/printActivities.js";
import { PARTICLE_EXERCISES } from "/shared/exercises.js";
import { book1Pages } from "./book1.js";
import { pageHeading, esc, icon, routeLink } from "../core/ui.js";

const chunks = (items, size) => Array.from({length:Math.ceil(items.length/size)},(_,i)=>items.slice(i*size,(i+1)*size));
const blankBox = '<div class="paper-box"></div>';
const footer = (page, total) => `<footer class="paper-footer"><span>maru. · Japonês, passo a passo<br>Traços: KanjiVG · Ulrich Apel e colaboradores · CC BY-SA 3.0</span><span>${page} / ${total}</span></footer>`;
const header = title => `<header class="paper-header"><strong>maru.</strong><span>UM POUQUINHO, TODO DIA.<br>${title}</span></header><div class="paper-name"><span>Nome: __________________________________</span><span>Data: ____ / ____ / ______</span></div>`;
const repeatPage = () => header("Página de repetição") + '<div class="paper-repeat-grid" aria-label="Quadrados vazios para praticar">' + blankBox.repeat(81) + '</div>';
const strokeSVG = (char, paths = []) => `<svg viewBox="-4 -4 117 117" role="img" aria-label="Ordem dos traços de ${char}">${paths.map(d=>`<path d="${esc(d)}"/>`).join("")}</svg>`;
const practiceRow = (item, strokes, reading = item.romaji) => `<section class="paper-row" data-print-char="${item.char}"><div class="paper-row-label"><strong>${item.char} · ${reading}</strong><span>${item.meaning || "Leia em voz alta antes de escrever."}</span></div><div class="paper-boxes"><div class="paper-box model">${strokeSVG(item.char,strokes?.[item.char])}</div><div class="paper-box ghost">${strokeSVG(item.char,strokes?.[item.char])}</div><div class="paper-box ghost">${strokeSVG(item.char,strokes?.[item.char])}</div>${blankBox.repeat(6)}</div></section>`;
const printKanaRows = KANA_ROWS.filter(row=>row.id!=="n");
const kanaSlots = (row, script) => {
  const items = KANA.filter(item=>item.script===script && (item.row===row.id || (row.id==="wa" && item.row==="n")));
  const positions = row.id==="ya" || row.id==="wa" ? [0,2,4] : [0,1,2,3,4];
  const slots = Array(5).fill(null);
  positions.forEach((position,index)=>{slots[position]=items[index];});
  return slots;
};
const kanaSheet = (row, script, selected, strokes) => {
  const slots = kanaSlots(row,script);
  if(!slots.some(item=>item && selected.has(item.char)))return null;
  const name = script==="hiragana" ? "Hiragana" : "Katakana";
  const rowName = row.id==="a" ? "vogais" : row.id==="wa" ? "WA · WO/O · N" : row.id.toUpperCase();
  return header(name) + `<h2>${name} · ${rowName}</h2><p class="paper-instructions">Observe os traços numerados. Cubra os modelos e complete os quadrados vazios.</p>` +
    `<div class="paper-kana-family" data-kana-row="${row.id}" data-script="${script}" aria-label="Fileira ${rowName}">${slots.map((item,index)=>{
      const chosen = item && selected.has(item.char);
      if(!chosen)return `<div class="paper-row paper-kana-gap" data-print-slot="${index}" aria-hidden="true"><div class="paper-row-label"><strong>&nbsp;</strong></div><div class="paper-boxes"></div></div>`;
      const reading = item.romaji==="wo" ? "wo/o" : item.romaji;
      return `<div data-print-slot="${index}">${practiceRow(item,strokes,reading)}</div>`;
    }).join("")}</div>`;
};
const pictureItems = PICTURE_WORDS.map(item=>({...item,word:VOCABULARY.find(word=>word.id===item.wordId)}));
const pictureBank = PICTURE_BANK_ORDER.map(index=>pictureItems[index]);
const pictureLetter = item => String.fromCharCode(65+pictureBank.findIndex(entry=>entry.id===item.id));
const pictureSheet = () => header("Atividade · imagem e palavra") +
  '<h2>Qual palavra combina com a imagem?</h2><p class="paper-instructions">Veja as ilustrações e escreva a letra da palavra japonesa correspondente. Depois, confira o gabarito.</p>' +
  `<div class="paper-image-grid">${pictureItems.map((item,index)=>`<div class="paper-image-card"><span class="paper-image-number">${index+1}</span><img src="/assets/img/irasutoya-${item.id}.png" alt="Ilustração de ${esc(item.word.pt)}" width="120" height="120"><span class="paper-image-answer">Letra: ______</span></div>`).join("")}</div>` +
  `<section class="paper-word-bank"><h3>Banco de palavras</h3><div>${pictureBank.map((item,index)=>`<span><b>${String.fromCharCode(65+index)}.</b> <span lang="ja">${item.word.jp}</span> <small>${item.word.reading}</small></span>`).join("")}</div></section><p class="paper-art-credit">Ilustrações: Mifune Takashi / Irasutoya · www.irasutoya.com</p>`;
const pictureAnswerSheet = () => header("Gabarito · imagens") + '<h2>Confira suas associações.</h2>' +
  `<div class="paper-picture-answers">${pictureItems.map((item,index)=>`<div><strong>${index+1}. ${pictureLetter(item)} · <span lang="ja">${item.word.jp}</span></strong><span>${item.word.reading} · ${item.word.pt}</span></div>`).join("")}</div>`;
const dialogueSheet = dialogue => header("Atividade · diálogos") + `<h2>${dialogue.title}</h2><p class="paper-instructions">${dialogue.setting} Leia as falas e complete as respostas em japonês. As dicas em português ajudam; escreva antes de olhar o gabarito.</p>` +
  `<div class="paper-dialogue">${dialogue.turns.map(turn=>`<div class="paper-dialogue-turn"><strong>${turn.speaker}</strong><div>${turn.text ? `<p lang="ja">${turn.text}</p>` : `<small>Dica: ${turn.cue}</small><div class="paper-practice-line"></div><div class="paper-practice-line"></div>`}</div></div>`).join("")}</div>` +
  `<section class="paper-dialogue-questions"><h3>Entenda a conversa</h3>${dialogue.questions.map((question,index)=>`<div><strong>${index+1}. ${question.prompt}</strong><div class="paper-practice-line"></div></div>`).join("")}</section>`;
const dialogueAnswerSheet = () => header("Gabarito · diálogos") + '<h2>Compare suas respostas.</h2>' +
  PRINT_DIALOGUES.map(dialogue=>`<section class="paper-dialogue-answer"><h3>${dialogue.title}</h3>${dialogue.turns.filter(turn=>turn.answer).map(turn=>`<p><strong>${turn.speaker} · ${turn.cue}</strong> <span lang="ja">${turn.answer}</span></p>`).join("")}${dialogue.questions.map((question,index)=>`<p><strong>${index+1}. ${question.prompt}</strong> ${question.answer}</p>`).join("")}</section>`).join("");
const particleSheet = (items, offset) => header("Atividade · partículas") +
  '<h2>Qual partícula completa a frase?</h2><p class="paper-instructions">Leia o contexto, escreva a partícula no espaço e depois copie a frase completa. Confira o gabarito só depois de tentar.</p>' +
  items.map((item,index)=>`<section class="paper-question"><strong>${offset+index+1}. ${esc(item.context)}</strong><p class="jp" lang="ja">${esc(item.prompt)}</p><div class="paper-practice-line"></div></section>`).join("");
const particleAnswerSheet = (items, offset) => header("Gabarito · partículas") + '<h2>Compare suas respostas.</h2>' +
  items.map((item,index)=>`<section class="paper-answer"><strong>${offset+index+1}. <span lang="ja">${esc(item.speech)}</span></strong><p>${esc(item.explanation)}</p></section>`).join("");
const bookWordSheet = items => header("Livro 1 · primeiras palavras") + '<h2>Palavras para reconhecer e usar</h2>' +
  `<div class="paper-book-words">${items.map(item=>`<div><strong lang="ja">${esc(item.jp)}</strong><span>${esc(item.reading)} · ${esc(item.romaji)}</span><span>${esc(item.pt)}</span><small lang="ja">${esc(item.sentence)}</small></div>`).join("")}</div>`;
const bookSentenceSheet = (items,offset) => header("Livro 1 · frases") + '<h2>Construa uma frase para cada situação</h2><p class="paper-instructions">Leia a situação e escreva a frase em japonês. Compare as partículas e a ordem no gabarito.</p>' +
  items.map((item,index)=>`<section class="paper-question"><strong>${offset+index+1}. ${esc(item.prompt)}</strong><p>${esc(item.pattern)}</p><div class="paper-practice-line"></div></section>`).join("");
const bookSentenceAnswers = (items,offset) => header("Gabarito · frases") + '<h2>Compare suas frases</h2>' +
  items.map((item,index)=>`<section class="paper-answer"><strong>${offset+index+1}. <span lang="ja">${esc(item.tokens.map(token=>token[0]).join(""))}。</span></strong><p>${esc(item.tokens.map(token=>token[1]).join(" "))} · ${esc(item.hint)}</p></section>`).join("");
const activityKinds = new Set(["pictures","dialogues","activities"]);

export function renderWorksheets(ctx, initialKind = "characters") {
  const controller = new AbortController();
  let kind = initialKind === "book" ? "book" : "characters", script = "hiragana", group = "food", batch = 0, answers = true, models = true;
  let scope = "recommended", repeatPages = kind === "book" ? 0 : 1;
  let selected = new Set(KANA.filter(item=>item.script==="hiragana").slice(0,20).map(item=>item.char));
  let strokes = null, printing = false;
  const characterList = () => script === "all" ? [...KANA.filter(item=>item.script==="hiragana"),...KANA.filter(item=>item.script==="katakana"), ...BEGINNER_KANJI] : script === "kanji" ? BEGINNER_KANJI : KANA.filter(item=>item.script===script);
  ctx.main.innerHTML = `<div class="worksheets-page">${pageHeading("LEVE O APRENDIZADO PARA O PAPEL", "Seu caderno, pronto para imprimir.", "Escolha a atividade, confira a folha e imprima em A4. Você também pode salvar em PDF na janela de impressão.",routeLink("writing","Abrir caderno digital " + icon("pen"),"btn btn-ghost"))}<div class="no-print"><div class="panel worksheet-toolbar">
    <div><label class="input-label" for="worksheet-kind">Atividade</label><select class="text-input" id="worksheet-kind"><option value="characters">Traços e caracteres</option><option value="words">Escrever palavras</option><option value="sentences">Formar frases no papel</option><option value="particles">Complete partículas</option><option value="pictures">Imagens e palavras</option><option value="dialogues">Complete diálogos</option><option value="activities">Pacote de atividades</option><option value="book" ${kind === "book" ? "selected" : ""}>Livro 1 · volume completo</option></select></div>
    <div id="worksheet-script-control"><label class="input-label" for="worksheet-script">Escrita</label><select class="text-input" id="worksheet-script"><option value="hiragana">Hiragana</option><option value="katakana">Katakana</option><option value="kanji">Primeiros kanji</option><option value="all">Todos os caracteres</option></select></div>
    <div id="worksheet-scope-control"><label class="input-label" for="worksheet-scope">Quantidade</label><select class="text-input" id="worksheet-scope"><option value="one">1 caractere</option><option value="recommended" selected>20 caracteres · recomendado</option><option value="all">Todos</option><option value="custom">Escolher livremente</option></select></div>
    <div id="worksheet-group-control" hidden><label class="input-label" for="worksheet-group">Tema</label><select class="text-input" id="worksheet-group">${VOCABULARY_GROUPS.filter(([id])=>id!=="all").map(([id,label])=>`<option value="${id}" ${id===group?"selected":""}>${label}</option>`).join("")}</select></div>
    <div id="worksheet-batch-control" hidden><label class="input-label" for="worksheet-batch">Situações</label><select class="text-input" id="worksheet-batch">${chunks(SENTENCES,5).map((items,i)=>`<option value="${i}">${i*5+1} a ${i*5+items.length}</option>`).join("")}</select></div>
    <div><label class="input-label" for="worksheet-repeat-pages">Páginas para repetir</label><select class="text-input" id="worksheet-repeat-pages"><option value="0" ${repeatPages === 0 ? "selected" : ""}>Nenhuma</option><option value="1" ${repeatPages === 1 ? "selected" : ""}>1 página em branco</option><option value="2">2 páginas em branco</option><option value="3">3 páginas em branco</option><option value="5">5 páginas em branco</option><option value="10">10 páginas em branco</option></select></div>
    <div><button class="btn btn-primary" id="print-worksheet" disabled>${icon("pen")} Imprimir / salvar PDF</button></div>
    </div><div class="filter-chips"><label><input id="worksheet-models" type="checkbox" checked> Mostrar modelos para copiar</label><label><input id="worksheet-answers" type="checkbox" checked> Incluir gabarito separado</label></div>
    <div id="worksheet-characters" class="worksheet-selection panel" role="group" dir="ltr" aria-label="Caracteres da folha"></div><p class="filter-count" id="worksheet-status" aria-live="polite">Preparando os modelos de traços…</p>
    <aside class="tip-box">${icon("pen")}<p>Recomendamos começar com 20 caracteres, mas você pode escolher só um, mais de 20 ou todos de uma vez. As páginas de repetição têm quadrados vazios com guias tracejadas para preencher à mão. Na impressão, escolha A4, escala 100% e desative os cabeçalhos do navegador.</p></aside></div><div id="worksheet-preview" class="worksheet-preview"></div></div>`;
  const drawSelection = () => {
    ctx.main.querySelector("#worksheet-characters").innerHTML = characterList().map(item=>`<button class="worksheet-char" data-print-char="${item.char}" aria-pressed="${selected.has(item.char)}" aria-label="${item.char}, ${item.romaji}">${item.char}</button>`).join("");
  };
  function draw() {
    ctx.main.querySelector("#worksheet-script-control").hidden = kind !== "characters";
    ctx.main.querySelector("#worksheet-scope-control").hidden = kind !== "characters";
    ctx.main.querySelector("#worksheet-group-control").hidden = kind !== "words";
    ctx.main.querySelector("#worksheet-batch-control").hidden = kind !== "sentences";
    ctx.main.querySelector("#worksheet-characters").hidden = kind !== "characters";
    const modelOption = ctx.main.querySelector("#worksheet-models");
    const answerOption = ctx.main.querySelector("#worksheet-answers");
    modelOption.disabled = kind === "characters" || kind === "particles" || kind === "book" || activityKinds.has(kind);
    modelOption.parentElement.hidden = modelOption.disabled;
    answerOption.disabled = kind === "characters";
    answerOption.parentElement.hidden = answerOption.disabled;
    const preview = ctx.main.querySelector("#worksheet-preview");
    let sheets = [], answerSheets = [];
    if (kind === "characters") {
      const kanaScripts = script==="all" ? ["hiragana","katakana"] : script==="kanji" ? [] : [script];
      const kanaSheets = kanaScripts.flatMap(kanaScript=>printKanaRows.map(row=>kanaSheet(row,kanaScript,selected,strokes)).filter(Boolean));
      const kanjiItems = (script==="kanji" || script==="all" ? BEGINNER_KANJI : []).filter(item=>selected.has(item.char));
      const kanjiSheets = chunks(kanjiItems,5).map(page => header("Primeiros kanji") +
        '<h2>Observe. Cubra. Experimente.</h2><p class="paper-instructions">O primeiro quadrado mostra os traços numerados. Nos dois seguintes, cubra o desenho. Nas casas vazias, escreva sozinho. Cada número marca o início de um traço: siga a ordem do modelo.</p>' +
        page.map(item=>practiceRow(item,strokes)).join("") +
        '<div class="paper-checklist"><span>□ Segui a ordem dos traços.</span><span>□ Observei os espaços.</span><span>□ Tentei sem o modelo.</span></div><p class="paper-instructions">Cubra os modelos acima. De quais caracteres você se lembra? Escreva aqui e depois confira.</p><div class="paper-practice-line"></div><div class="paper-practice-line"></div>');
      sheets = [...kanaSheets,...kanjiSheets];
    } else if (kind === "words") {
      const words = VOCABULARY.filter(item=>item.group===group);
      sheets = chunks(words,5).map(page=>header("Palavras · "+VOCABULARY_GROUPS.find(([id])=>id===group)[1])+
        '<h2>Escreva e dê significado.</h2><p class="paper-instructions">'+(models ? "Leia o modelo, copie em kana nas casas vazias e diga o significado. Depois cubra o modelo e tente novamente." : "Leia o significado em português e tente escrever a palavra em kana. Use o gabarito apenas depois de tentar.")+'</p>'+
        page.map(item=>`<section class="paper-row"><div class="paper-row-label"><strong>${item.pt}</strong>${models ? `<span class="paper-word jp" lang="ja">${item.reading}</span><span>${item.romaji}</span>` : ""}</div><div class="paper-boxes">${blankBox.repeat(9)}</div></section>`).join("")+
        '<p class="paper-instructions">Escolha duas palavras e escreva uma frase simples com cada uma.</p><div class="paper-practice-line"></div><div class="paper-practice-line"></div>');
      if(answers) answerSheets = chunks(words,Math.ceil(words.length / Math.ceil(words.length / 10))).map(answerPage => header("Gabarito · palavras")+'<h2>Confira depois de tentar.</h2>'+answerPage.map(item=>`<div class="paper-answer"><strong>${item.pt} → <span lang="ja">${item.jp} (${item.reading})</span> · ${item.romaji}</strong><span lang="ja">${item.sentence}</span><br>${item.translation}</div>`).join(""));
    } else if (kind === "sentences") {
      const items = chunks(SENTENCES,5)[batch] || [];
      sheets = [header("Frases · situações "+(batch*5+1)+" a "+(batch*5+items.length))+'<h2>Uma ideia, palavra por palavra.</h2><p class="paper-instructions">'+(models ? "Leia a situação, observe os blocos e escreva a frase na ordem pedida. Os blocos estão separados para você perceber suas funções." : "Escreva em japonês ou kana, seguindo o padrão de cada situação. Tente antes de consultar o gabarito.")+'</p>'+
        items.map((item,i)=>`<section class="paper-question"><strong>${i+1}. ${item.prompt}</strong><p>${item.pattern}</p>${models ? `<p class="jp" lang="ja">${item.tokens.map(t=>t[0]).reverse().join(" ／ ")}</p>` : ""}<div class="paper-practice-line"></div><div class="paper-practice-line"></div></section>`).join("")];
      if(answers) answerSheets = [header("Gabarito · frases")+'<h2>Compare a ordem e as partículas.</h2>'+items.map((item,i)=>`<section class="paper-answer"><strong>${i+1}. <span lang="ja">${item.tokens.map(t=>t[0]).join("")}。</span></strong><p>${item.tokens.map(t=>t[1]).join(" ")}</p><p>${item.hint}</p></section>`).join("")];
    } else if (kind === "book") {
      const book = book1Pages();
      const everyKana = new Set(KANA.map(item=>item.char));
      const kanaPages = ["hiragana","katakana"].flatMap(kanaScript=>printKanaRows.map(row=>kanaSheet(row,kanaScript,everyKana,strokes)).filter(Boolean));
      const kanjiPages = chunks(BEGINNER_KANJI,5).map(items=>header("Livro 1 · primeiros kanji")+'<h2>Observe, cubra e escreva.</h2>'+items.map(item=>practiceRow(item,strokes)).join(""));
      const wordPages = chunks(VOCABULARY,10).map(bookWordSheet);
      const sentencePages = chunks(SENTENCES,5).map((items,index)=>bookSentenceSheet(items,index*5));
      const particlePages = chunks(PARTICLE_EXERCISES,6).map((items,index)=>particleSheet(items,index*6));
      sheets = [...book.pages,...kanaPages,...kanjiPages,...wordPages,...sentencePages,...particlePages,pictureSheet(),...PRINT_DIALOGUES.map(dialogueSheet)];
      if(answers)answerSheets = [...book.answerPages,...chunks(SENTENCES,10).map((items,index)=>bookSentenceAnswers(items,index*10)),...chunks(PARTICLE_EXERCISES,12).map((items,index)=>particleAnswerSheet(items,index*12)),pictureAnswerSheet(),dialogueAnswerSheet()];
    } else if (kind === "particles") {
      sheets = chunks(PARTICLE_EXERCISES,6).map((items,index)=>particleSheet(items,index*6));
      if(answers)answerSheets = chunks(PARTICLE_EXERCISES,12).map((items,index)=>particleAnswerSheet(items,index*12));
    } else if (activityKinds.has(kind)) {
      if (kind === "pictures" || kind === "activities") {
        sheets.push(pictureSheet());
        if(answers)answerSheets.push(pictureAnswerSheet());
      }
      if (kind === "dialogues" || kind === "activities") {
        sheets.push(...PRINT_DIALOGUES.map(dialogueSheet));
        if(answers)answerSheets.push(dialogueAnswerSheet());
      }
    }
    if (sheets.length) sheets.push(...Array.from({length:repeatPages}, repeatPage), ...answerSheets);
    preview.innerHTML = sheets.map((sheet,i)=>`<article class="print-sheet">${sheet}${footer(i+1,sheets.length)}</article>`).join("");
    preview.querySelectorAll(".model svg").forEach(svg=>svg.querySelectorAll("path").forEach((path,i)=>{
      const start=path.getPointAtLength(0), label=document.createElementNS("http://www.w3.org/2000/svg","text");
      label.setAttribute("x",Math.max(3,start.x-5));label.setAttribute("y",Math.max(7,start.y-3));label.textContent=i+1;svg.append(label);
    }));
    const ready = ((kind !== "characters" && kind !== "book") || strokes) && sheets.length > 0;
    ctx.main.querySelector("#print-worksheet").disabled = !ready || printing;
    const count = `${sheets.length} ${sheets.length===1 ? "folha A4 preparada" : "folhas A4 preparadas"}.`;
    const characters = kind==="characters" ? ` ${selected.size} ${selected.size===1 ? "caractere selecionado" : "caracteres selecionados"}.` : "";
    const repetition = repeatPages ? ` ${repeatPages} ${repeatPages===1 ? "página de repetição em branco" : "páginas de repetição em branco"}.` : "";
    ctx.main.querySelector("#worksheet-status").textContent = !sheets.length ? "Selecione pelo menos um caractere." : (kind === "characters" || kind === "book") && !strokes ? "Preparando os modelos de traços…" : count+characters+repetition;
  }
  ctx.main.addEventListener("change",event=>{
    const {id,value,checked}=event.target;
    if(id==="worksheet-kind"){
      const wasActivity=activityKinds.has(kind);
      kind=value;
      if(wasActivity!==activityKinds.has(kind) || kind === "book"){
        repeatPages=activityKinds.has(kind) || kind === "book" ? 0:1;
        ctx.main.querySelector("#worksheet-repeat-pages").value=String(repeatPages);
      }
    }
    if(id==="worksheet-script"){script=value;scope="recommended";selected=new Set(characterList().slice(0,20).map(item=>item.char));ctx.main.querySelector("#worksheet-scope").value=scope;drawSelection();}
    if(id==="worksheet-scope"){
      scope=value;
      if(scope!=="custom") selected=new Set((scope==="one" ? characterList().slice(0,1) : scope==="recommended" ? characterList().slice(0,20) : characterList()).map(item=>item.char));
      drawSelection();
    }
    if(id==="worksheet-repeat-pages")repeatPages=Number(value);
    if(id==="worksheet-group")group=value;
    if(id==="worksheet-batch")batch=Number(value);
    if(id==="worksheet-models")models=checked;
    if(id==="worksheet-answers")answers=checked;
    draw();
  },{signal:controller.signal});
  ctx.main.addEventListener("click",async event=>{
    const button=event.target.closest("[data-print-char]");
    if(button){
      const char=button.dataset.printChar;
      if(scope==="one")selected=new Set([char]);
      else{
        scope="custom";ctx.main.querySelector("#worksheet-scope").value=scope;
        if(selected.has(char))selected.delete(char);
        else selected.add(char);
      }
      drawSelection();draw();
    }
    if(event.target.closest("#print-worksheet") && !printing){
      printing=true;ctx.audio.stop();draw();
      try{
        await document.fonts.ready;
        await Promise.all([...ctx.main.querySelectorAll("#worksheet-preview img")].map(image=>image.decode()));
        if(!controller.signal.aborted)window.print();
      }catch{ctx.toast("Não foi possível carregar as imagens da atividade. Tente imprimir novamente.");}
      finally{printing=false;if(!controller.signal.aborted)draw();}
    }
  },{signal:controller.signal});
  fetch("/assets/data/strokes.json",{signal:controller.signal}).then(response=>{if(!response.ok)throw new Error("Modelos indisponíveis");return response.json();}).then(data=>{
    if(controller.signal.aborted)return;strokes=data.characters;draw();
  }).catch(()=>{if(!controller.signal.aborted)ctx.main.querySelector("#worksheet-status").textContent="Não foi possível carregar os traços. Reabra a página para tentar novamente; palavras e frases continuam disponíveis.";});
  drawSelection();draw();
  return ()=>controller.abort();
}

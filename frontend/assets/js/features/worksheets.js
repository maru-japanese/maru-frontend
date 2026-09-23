import { KANA, KANA_ROWS } from "/shared/content.js";
import { BEGINNER_KANJI, SENTENCES } from "/shared/catalog.js";
import { VOCABULARY, VOCABULARY_GROUPS } from "/shared/vocabulary.js";
import { pageHeading, esc, icon, routeLink } from "../core/ui.js";

const chunks = (items, size) => Array.from({length:Math.ceil(items.length/size)},(_,i)=>items.slice(i*size,(i+1)*size));
const blankBox = '<div class="paper-box"></div>';
const footer = (page, total) => `<footer class="paper-footer"><span>maru. · Japonês, passo a passo<br>Traços: KanjiVG · Ulrich Apel e colaboradores · CC BY-SA 3.0</span><span>${page} / ${total}</span></footer>`;
const header = title => `<header class="paper-header"><strong>maru.</strong><span>UM POUQUINHO, TODO DIA.<br>${title}</span></header><div class="paper-name"><span>Nome: __________________________________</span><span>Data: ____ / ____ / ______</span></div>`;
const repeatPage = () => header("Página de repetição") + '<div class="paper-repeat-grid" aria-label="Quadrados vazios para praticar">' + blankBox.repeat(81) + '</div>';
const strokeSVG = (char, paths = []) => `<svg viewBox="-4 -4 117 117" role="img" aria-label="Ordem dos traços de ${char}">${paths.map(d=>`<path d="${esc(d)}"/>`).join("")}</svg>`;
const kanaSlots = (row, script) => {
  const items = KANA.filter(item=>item.script===script && item.row===row.id);
  const positions = row.id==="ya" ? [0,2,4] : row.id==="wa" ? [0,4] : row.id==="n" ? [0] : [0,1,2,3,4];
  const slots = Array(5).fill(null);
  positions.forEach((position,index)=>{slots[position]=items[index];});
  return slots;
};
const kanaSheet = (row, script, selected, strokes) => {
  const slots = kanaSlots(row,script);
  if(!slots.some(item=>item && selected.has(item.char)))return null;
  const name = script==="hiragana" ? "Hiragana" : "Katakana";
  const rowName = row.id==="a" ? "vogais" : row.id==="n" ? "N" : row.id.toUpperCase();
  return header(name) + `<h2>${name} · ${rowName}</h2><p class="paper-instructions">Leia as posições da direita para a esquerda. Observe o primeiro modelo, cubra o segundo e escreva nos quadrados vazios.</p>` +
    `<div class="paper-kana-grid" data-kana-row="${row.id}" data-script="${script}" aria-label="Fileira ${rowName}, da direita para a esquerda">${slots.map((item,index)=>{
      const chosen = item && selected.has(item.char);
      if(!chosen)return `<div class="paper-kana-slot paper-kana-gap" data-print-slot="${index}" aria-hidden="true"></div>`;
      const reading = item.romaji==="wo" ? "wo/o" : item.romaji;
      return `<section class="paper-kana-slot" data-print-slot="${index}" data-print-char="${item.char}"><div class="paper-kana-label"><strong lang="ja">${item.char}</strong><span>${reading}</span></div><div class="paper-kana-practice"><div class="paper-box model">${strokeSVG(item.char,strokes?.[item.char])}</div><div class="paper-box ghost">${strokeSVG(item.char,strokes?.[item.char])}</div>${blankBox.repeat(3)}</div></section>`;
    }).join("")}</div>`;
};

export function renderWorksheets(ctx) {
  const controller = new AbortController();
  let kind = "characters", script = "hiragana", group = "food", batch = 0, answers = true, models = true;
  let scope = "recommended", repeatPages = 1;
  let selected = new Set(KANA.filter(item=>item.script==="hiragana").slice(0,20).map(item=>item.char));
  let strokes = null, printing = false;
  const characterList = () => script === "all" ? [...KANA, ...BEGINNER_KANJI] : script === "kanji" ? BEGINNER_KANJI : KANA.filter(item=>item.script===script);
  ctx.main.innerHTML = `<div class="worksheets-page">${pageHeading("LEVE O APRENDIZADO PARA O PAPEL", "Seu caderno, pronto para imprimir.", "Escolha a atividade, confira a folha e imprima em A4. Você também pode salvar em PDF na janela de impressão.",routeLink("writing","Abrir caderno digital " + icon("pen"),"btn btn-ghost"))}<div class="no-print"><div class="panel worksheet-toolbar">
    <div><label class="input-label" for="worksheet-kind">Atividade</label><select class="text-input" id="worksheet-kind"><option value="characters">Traços e caracteres</option><option value="words">Escrever palavras</option><option value="sentences">Formar frases no papel</option></select></div>
    <div id="worksheet-script-control"><label class="input-label" for="worksheet-script">Escrita</label><select class="text-input" id="worksheet-script"><option value="hiragana">Hiragana</option><option value="katakana">Katakana</option><option value="kanji">Primeiros kanji</option><option value="all">Todos os caracteres</option></select></div>
    <div id="worksheet-scope-control"><label class="input-label" for="worksheet-scope">Quantidade</label><select class="text-input" id="worksheet-scope"><option value="one">1 caractere</option><option value="recommended" selected>20 caracteres · recomendado</option><option value="all">Todos</option><option value="custom">Escolher livremente</option></select></div>
    <div id="worksheet-group-control" hidden><label class="input-label" for="worksheet-group">Tema</label><select class="text-input" id="worksheet-group">${VOCABULARY_GROUPS.filter(([id])=>id!=="all").map(([id,label])=>`<option value="${id}" ${id===group?"selected":""}>${label}</option>`).join("")}</select></div>
    <div id="worksheet-batch-control" hidden><label class="input-label" for="worksheet-batch">Situações</label><select class="text-input" id="worksheet-batch">${chunks(SENTENCES,5).map((items,i)=>`<option value="${i}">${i*5+1} a ${i*5+items.length}</option>`).join("")}</select></div>
    <div><label class="input-label" for="worksheet-repeat-pages">Páginas para repetir</label><select class="text-input" id="worksheet-repeat-pages"><option value="0">Nenhuma</option><option value="1" selected>1 página em branco</option><option value="2">2 páginas em branco</option><option value="3">3 páginas em branco</option><option value="5">5 páginas em branco</option><option value="10">10 páginas em branco</option></select></div>
    <div><button class="btn btn-primary" id="print-worksheet" disabled>${icon("pen")} Imprimir / salvar PDF</button></div>
    </div><div class="filter-chips"><label><input id="worksheet-models" type="checkbox" checked> Mostrar modelos para copiar</label><label><input id="worksheet-answers" type="checkbox" checked> Incluir gabarito separado</label></div>
    <div id="worksheet-characters" class="worksheet-selection panel" role="group" aria-label="Caracteres da folha"></div><p class="filter-count" id="worksheet-status" aria-live="polite">Preparando os modelos de traços…</p>
    <aside class="tip-box">${icon("pen")}<p>Recomendamos começar com 20 caracteres, mas você pode escolher só um, mais de 20 ou todos de uma vez. As páginas de repetição têm apenas quadrados vazios para preencher à mão. Na impressão, escolha A4, escala 100% e desative os cabeçalhos do navegador.</p></aside></div><div id="worksheet-preview" class="worksheet-preview"></div></div>`;
  const drawSelection = () => {
    ctx.main.querySelector("#worksheet-characters").innerHTML = characterList().map(item=>`<button class="worksheet-char" data-print-char="${item.char}" aria-pressed="${selected.has(item.char)}" aria-label="${item.char}, ${item.romaji}">${item.char}</button>`).join("");
  };
  function draw() {
    ctx.main.querySelector("#worksheet-script-control").hidden = kind !== "characters";
    ctx.main.querySelector("#worksheet-scope-control").hidden = kind !== "characters";
    ctx.main.querySelector("#worksheet-group-control").hidden = kind !== "words";
    ctx.main.querySelector("#worksheet-batch-control").hidden = kind !== "sentences";
    ctx.main.querySelector("#worksheet-characters").hidden = kind !== "characters";
    ctx.main.querySelector("#worksheet-models").disabled = kind === "characters";
    ctx.main.querySelector("#worksheet-answers").disabled = kind === "characters";
    const preview = ctx.main.querySelector("#worksheet-preview");
    let sheets = [], answerSheets = [];
    if (kind === "characters") {
      const kanaScripts = script==="all" ? ["hiragana","katakana"] : script==="kanji" ? [] : [script];
      const kanaSheets = kanaScripts.flatMap(kanaScript=>KANA_ROWS.map(row=>kanaSheet(row,kanaScript,selected,strokes)).filter(Boolean));
      const kanjiItems = (script==="kanji" || script==="all" ? BEGINNER_KANJI : []).filter(item=>selected.has(item.char));
      const kanjiSheets = chunks(kanjiItems,5).map(page => header("Primeiros kanji") +
        '<h2>Observe. Cubra. Experimente.</h2><p class="paper-instructions">O primeiro quadrado mostra os traços numerados. Nos dois seguintes, cubra o desenho. Nas casas vazias, escreva sozinho. Cada número marca o início de um traço: siga a ordem do modelo.</p>' +
        page.map(item=>`<section class="paper-row"><div class="paper-row-label"><strong>${item.char} · ${item.romaji}</strong><span>${item.meaning || "Leia em voz alta antes de escrever."}</span></div><div class="paper-boxes"><div class="paper-box model">${strokeSVG(item.char,strokes?.[item.char])}</div><div class="paper-box ghost">${strokeSVG(item.char,strokes?.[item.char])}</div><div class="paper-box ghost">${strokeSVG(item.char,strokes?.[item.char])}</div>${blankBox.repeat(6)}</div></section>`).join("") +
        '<div class="paper-checklist"><span>□ Segui a ordem dos traços.</span><span>□ Observei os espaços.</span><span>□ Tentei sem o modelo.</span></div><p class="paper-instructions">Cubra os modelos acima. De quais caracteres você se lembra? Escreva aqui e depois confira.</p><div class="paper-practice-line"></div><div class="paper-practice-line"></div>');
      sheets = [...kanaSheets,...kanjiSheets];
    } else if (kind === "words") {
      const words = VOCABULARY.filter(item=>item.group===group);
      sheets = chunks(words,5).map(page=>header("Palavras · "+VOCABULARY_GROUPS.find(([id])=>id===group)[1])+
        '<h2>Escreva e dê significado.</h2><p class="paper-instructions">'+(models ? "Leia o modelo, copie em kana nas casas vazias e diga o significado. Depois cubra o modelo e tente novamente." : "Leia o significado em português e tente escrever a palavra em kana. Use o gabarito apenas depois de tentar.")+'</p>'+
        page.map(item=>`<section class="paper-row"><div class="paper-row-label"><strong>${item.pt}</strong>${models ? `<span class="paper-word jp" lang="ja">${item.reading}</span><span>${item.romaji}</span>` : ""}</div><div class="paper-boxes">${blankBox.repeat(9)}</div></section>`).join("")+
        '<p class="paper-instructions">Escolha duas palavras e escreva uma frase simples com cada uma.</p><div class="paper-practice-line"></div><div class="paper-practice-line"></div>');
      if(answers) answerSheets = chunks(words,Math.ceil(words.length / Math.ceil(words.length / 10))).map(answerPage => header("Gabarito · palavras")+'<h2>Confira depois de tentar.</h2>'+answerPage.map(item=>`<div class="paper-answer"><strong>${item.pt} → <span lang="ja">${item.jp} (${item.reading})</span> · ${item.romaji}</strong><span lang="ja">${item.sentence}</span><br>${item.translation}</div>`).join(""));
    } else {
      const items = chunks(SENTENCES,5)[batch] || [];
      sheets = [header("Frases · situações "+(batch*5+1)+" a "+(batch*5+items.length))+'<h2>Uma ideia, palavra por palavra.</h2><p class="paper-instructions">'+(models ? "Leia a situação, observe os blocos e escreva a frase na ordem pedida. Os blocos estão separados para você perceber suas funções." : "Escreva em japonês ou kana, seguindo o padrão de cada situação. Tente antes de consultar o gabarito.")+'</p>'+
        items.map((item,i)=>`<section class="paper-question"><strong>${i+1}. ${item.prompt}</strong><p>${item.pattern}</p>${models ? `<p class="jp" lang="ja">${item.tokens.map(t=>t[0]).reverse().join(" ／ ")}</p>` : ""}<div class="paper-practice-line"></div><div class="paper-practice-line"></div></section>`).join("")];
      if(answers) answerSheets = [header("Gabarito · frases")+'<h2>Compare a ordem e as partículas.</h2>'+items.map((item,i)=>`<section class="paper-answer"><strong>${i+1}. <span lang="ja">${item.tokens.map(t=>t[0]).join("")}。</span></strong><p>${item.tokens.map(t=>t[1]).join(" ")}</p><p>${item.hint}</p></section>`).join("")];
    }
    if (sheets.length) sheets.push(...Array.from({length:repeatPages}, repeatPage), ...answerSheets);
    preview.innerHTML = sheets.map((sheet,i)=>`<article class="print-sheet">${sheet}${footer(i+1,sheets.length)}</article>`).join("");
    preview.querySelectorAll(".model svg").forEach(svg=>svg.querySelectorAll("path").forEach((path,i)=>{
      const start=path.getPointAtLength(0), label=document.createElementNS("http://www.w3.org/2000/svg","text");
      label.setAttribute("x",Math.max(3,start.x-5));label.setAttribute("y",Math.max(7,start.y-3));label.textContent=i+1;svg.append(label);
    }));
    const ready = (kind !== "characters" || strokes) && sheets.length > 0;
    ctx.main.querySelector("#print-worksheet").disabled = !ready || printing;
    const count = `${sheets.length} ${sheets.length===1 ? "folha A4 preparada" : "folhas A4 preparadas"}.`;
    const characters = kind==="characters" ? ` ${selected.size} ${selected.size===1 ? "caractere selecionado" : "caracteres selecionados"}.` : "";
    const repetition = repeatPages ? ` ${repeatPages} ${repeatPages===1 ? "página de repetição em branco" : "páginas de repetição em branco"}.` : "";
    ctx.main.querySelector("#worksheet-status").textContent = !sheets.length ? "Selecione pelo menos um caractere." : kind === "characters" && !strokes ? "Preparando os modelos de traços…" : count+characters+repetition;
  }
  ctx.main.addEventListener("change",event=>{
    const {id,value,checked}=event.target;
    if(id==="worksheet-kind")kind=value;
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
      try{await document.fonts.ready;if(!controller.signal.aborted)window.print();}
      finally{printing=false;if(!controller.signal.aborted)draw();}
    }
  },{signal:controller.signal});
  fetch("/assets/data/strokes.json",{signal:controller.signal}).then(response=>{if(!response.ok)throw new Error("Modelos indisponíveis");return response.json();}).then(data=>{
    if(controller.signal.aborted)return;strokes=data.characters;draw();
  }).catch(()=>{if(!controller.signal.aborted)ctx.main.querySelector("#worksheet-status").textContent="Não foi possível carregar os traços. Reabra a página para tentar novamente; palavras e frases continuam disponíveis.";});
  drawSelection();draw();
  return ()=>controller.abort();
}

import { test, expect } from "@playwright/test";
import { LISTENING_EXERCISES, PARTICLE_EXERCISES } from "../../shared/exercises.js";
import { VOCABULARY } from "../../shared/vocabulary.js";
import { KANA, KANA_ROWS } from "../../shared/content.js";
import { BEGINNER_KANJI } from "../../shared/catalog.js";

// Exercise browser playback deterministically without consuming a public API quota.
// The real service is also checked separately against its remote streaming URL.
const testWave=Buffer.alloc(44+48000);
testWave.write("RIFF",0);testWave.writeUInt32LE(testWave.length-8,4);testWave.write("WAVEfmt ",8);testWave.writeUInt32LE(16,16);testWave.writeUInt16LE(1,20);testWave.writeUInt16LE(1,22);testWave.writeUInt32LE(24000,24);testWave.writeUInt32LE(48000,28);testWave.writeUInt16LE(2,32);testWave.writeUInt16LE(16,34);testWave.write("data",36);testWave.writeUInt32LE(48000,40);
for(let i=0;i<24000;i++)testWave.writeInt16LE(Math.round(1500*Math.sin(2*Math.PI*440*i/24000)),44+i*2);
test.beforeEach(async({page})=>{
  await page.route("**/api/audio",route=>route.fulfill({json:{url:"https://audio1.tts.quest/v1/data/abc123/audio.mp3s",expiresAt:Date.now()+600000,attribution:"VOICEVOX:ずんだもん"}}));
  await page.route("https://audio1.tts.quest/**",route=>route.fulfill({contentType:"audio/wav",body:testWave}));
});

async function go(page, route) {
  await page.goto("/#/"+route);
  await expect(page.locator("main h1")).toBeVisible();
}
const snapshot = page => page.evaluate(()=>JSON.parse(localStorage.getItem("maru-learning-v2")));

test("theme switching keeps the active answer, persists and updates both selectors",async({page})=>{
  await go(page,"kana");
  await expect(page.locator("html")).toHaveAttribute("data-theme","dojo");
  await page.locator('[data-kana="start"]').click();
  const prompt=await page.locator(".quiz-character").innerText();
  const option=page.locator('input[name="answer"]').first();
  await option.check();
  await page.locator('.sidebar [data-theme-choice="arcade"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme","arcade");
  await expect(page.locator(".quiz-character")).toHaveText(prompt);
  await expect(option).toBeChecked();
  await expect(page.locator("#arcade-hud")).toBeVisible();
  await expect(page.locator("#save-status")).toHaveText("Progresso salvo");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme","arcade");
  await go(page,"settings");
  await expect(page.locator('.theme-card[data-theme-choice="arcade"]')).toHaveAttribute("aria-pressed","true");
  await page.locator('.theme-card[data-theme-choice="dojo"]').click();
  await expect(page.locator('#arcade-hud')).toBeHidden();
  await expect(page.locator('.sidebar [data-theme-choice="dojo"]')).toHaveAttribute("aria-pressed","true");
});

test("API pronunciation plays with no installed voices, respects speed and stops on toggle",async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(window,"speechSynthesis",{value:undefined,configurable:true});
    const OriginalAudio=window.Audio;
    window.audioEvents=[];
    window.Audio=class extends OriginalAudio{
      constructor(src){super(src);window.lastAudio=this;for(const event of ["playing","ended","error","pause"])this.addEventListener(event,()=>window.audioEvents.push(event));}
    };
  });
  await go(page,"settings");
  await page.locator("#setting-audio-rate").selectOption("0.75");
  const button=page.getByRole("button",{name:"Testar pronúncia japonesa"});
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed","true");
  await expect.poll(()=>page.evaluate(()=>window.lastAudio?.currentTime || 0)).toBeGreaterThan(0);
  expect(await page.evaluate(()=>window.lastAudio.playbackRate)).toBe(.75);
  expect(await page.evaluate(()=>window.lastAudio.currentSrc)).toContain("tts.quest");
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed","false");
  expect(await page.evaluate(()=>window.lastAudio.paused)).toBe(true);
  await button.click();
  await expect.poll(()=>page.evaluate(()=>window.audioEvents.includes("ended")),{timeout:10000}).toBe(true);
  await expect(button).toHaveAttribute("aria-busy","false");
  expect(await page.evaluate(()=>window.audioEvents.includes("error"))).toBe(false);
});

test("listening hides transcription until the answer and records the actual response",async({page})=>{
  await go(page,"exercises");
  await page.locator('[data-start-exercises="listening"]').click();
  const speaker=page.getByRole("button",{name:"Ouvir a pergunta"});
  const speech=await speaker.getAttribute("data-speak");
  const item=LISTENING_EXERCISES.find(item=>item.speech===speech);
  expect(item).toBeTruthy();
  await expect(page.locator(".quiz-character")).toHaveCount(0);
  await speaker.click();
  await expect(speaker).toHaveAttribute("aria-pressed","true");
  await expect(page.locator(".feedback")).toHaveCount(0);
  await page.getByRole("radio",{name:item.answer,exact:false}).check();
  await page.getByRole("button",{name:"Verificar resposta",exact:true}).click();
  await expect(page.locator(".feedback")).toHaveClass(/success/);
  await expect(page.locator(".feedback")).toContainText(item.prompt);
  expect((await snapshot(page)).reviews[item.id].correct).toBe(1);
});

test("particle activities explain the selected model and wrong answers enter the review schedule",async({page})=>{
  await go(page,"exercises");
  await page.locator('[data-start-exercises="particles"]').click();
  const prompt=await page.locator(".quiz-character").innerText();
  // Some prompts have a different requested nuance: match both prompt and context.
  const context=await page.locator(".quiz-stage > .muted").innerText();
  const exact=PARTICLE_EXERCISES.find(item=>item.prompt===prompt && item.context===context);
  const wrong=exact.choices.find(choice=>choice!==exact.answer);
  await page.getByRole("radio",{name:new RegExp("^[1-4] " + wrong + "$")}).check();
  await page.getByRole("button",{name:"Verificar resposta",exact:true}).click();
  await expect(page.locator(".feedback")).toHaveClass(/retry/);
  await expect(page.locator(".feedback")).toContainText(exact.explanation);
  const p=await snapshot(page);
  expect(p.reviews[exact.id].correct).toBe(0);
  expect(p.reviews[exact.id].interval).toBe(0);
  expect(p.reviews[exact.id].due-p.reviews[exact.id].updatedAt).toBe(600000);
});

test("vocabulary and beginner explanations can be searched and reviewed",async({page})=>{
  await go(page,"vocabulary");
  await page.locator("#word-search").fill("água");
  await expect(page.locator(".word-card")).toHaveCount(1);
  await page.locator("[data-add-review]").click();
  expect((await snapshot(page)).reviews[VOCABULARY.find(item=>item.jp==="水").id]).toBeTruthy();
  await go(page,"glossary");
  await page.locator("#glossary-search").fill("mora");
  await expect(page.locator("#concept-mora")).toBeVisible();
  await go(page,"lesson/start-language");
  await page.locator(".concept-help summary").click();
  await expect(page.locator(".concept-help")).toContainText("Substantivo");
});

test("A4 sheets have numbered strokes, separate answers and usable print output in both themes",async({page},testInfo)=>{
  await page.addInitScript(()=>{window.printCalls=0;window.print=()=>window.printCalls++;});
  await go(page,"worksheets");
  await expect(page.locator("#print-worksheet")).toBeEnabled();
  await expect(page.locator("#worksheet-scope")).toHaveValue("recommended");
  await expect(page.locator(".print-sheet")).toHaveCount(5);
  await expect(page.locator(".paper-kana-grid")).toHaveCount(4);
  await expect(page.locator(".paper-kana-slot[data-print-char]")).toHaveCount(20);
  await expect(page.locator(".paper-repeat-grid .paper-box")).toHaveCount(81);
  await expect(page.locator(".paper-repeat-grid svg")).toHaveCount(0);
  expect(await page.locator(".paper-repeat-grid .paper-box").first().evaluate(box=>getComputedStyle(box,"::before").display)).toBe("none");
  expect(await page.locator(".paper-box svg").first().evaluate(svg=>{
    const ink=svg.getBoundingClientRect(), box=svg.parentElement.getBoundingClientRect();
    return ink.left>=box.left && ink.top>=box.top && ink.right<=box.right && ink.bottom<=box.bottom;
  })).toBe(true);
  await expect(page.locator(".model svg text").first()).toHaveText("1");
  await page.locator("#print-worksheet").click();
  await expect.poll(()=>page.evaluate(()=>window.printCalls)).toBe(1);
  await page.locator('.sidebar [data-theme-choice="arcade"]').click();
  await page.emulateMedia({media:"print"});
  await expect(page.locator(".sidebar")).toBeHidden();
  await expect(page.locator(".topbar")).toBeHidden();
  expect(await page.locator(".print-sheet").first().evaluate(element=>getComputedStyle(element).backgroundColor)).toBe("rgb(255, 255, 255)");
  expect(await page.locator(".paper-kana-practice .paper-box, .paper-repeat-grid .paper-box").evaluateAll(boxes=>boxes.map(box=>{
    const {width,height}=box.getBoundingClientRect();return {grid:box.parentElement.className,width,height};
  }).filter(({width,height})=>Math.abs(width-height)>=2).slice(0,5))).toEqual([]);
  expect(await page.locator('[data-kana-row="a"] [data-print-slot="0"]').evaluate(slot=>slot.getBoundingClientRect().left)).toBeGreaterThan(await page.locator('[data-kana-row="a"] [data-print-slot="1"]').evaluate(slot=>slot.getBoundingClientRect().left));
  const pdf=await page.pdf({path:testInfo.outputPath("hiragana-a4.pdf"),preferCSSPageSize:true,printBackground:true});
  expect((pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)||[]).length).toBe(5);
  await page.emulateMedia({media:"screen"});
  await page.locator("#worksheet-scope").selectOption("one");
  await expect(page.locator(".paper-kana-slot[data-print-char]")).toHaveCount(1);
  await page.locator('.worksheet-char[data-print-char="き"]').click();
  await expect(page.locator('.worksheet-char[data-print-char="き"]')).toHaveAttribute("aria-pressed","true");
  await expect(page.locator('.paper-kana-slot[data-print-char="き"]')).toHaveAttribute("data-print-slot","1");
  await page.locator("#worksheet-scope").selectOption("recommended");
  await page.locator(".worksheet-char").nth(20).click();
  await expect(page.locator("#worksheet-scope")).toHaveValue("custom");
  await expect(page.locator('.worksheet-char[aria-pressed="true"]')).toHaveCount(21);
  await expect(page.locator(".print-sheet")).toHaveCount(6);
  await page.locator("#worksheet-script").selectOption("hiragana");
  await page.locator("#worksheet-scope").selectOption("all");
  for(const [row,chars] of [["ya",["や","","ゆ","","よ"]],["wa",["わ","","","","を"]],["n",["ん","","","",""]]]){
    expect(await page.locator(`[data-kana-row="${row}"] .paper-kana-slot`).evaluateAll(slots=>slots.map(slot=>slot.dataset.printChar || ""))).toEqual(chars);
  }
  await expect(page.locator('[data-print-char="を"] .paper-kana-label')).toContainText("wo/o");
  await page.locator("#worksheet-script").selectOption("all");
  await page.locator("#worksheet-scope").selectOption("all");
  await expect(page.locator('.worksheet-char[aria-pressed="true"]')).toHaveCount(KANA.length+BEGINNER_KANJI.length);
  for(const script of ["hiragana","katakana"]){
    expect(await page.locator(`.paper-kana-grid[data-script="${script}"]`).evaluateAll(grids=>grids.map(grid=>grid.dataset.kanaRow))).toEqual(KANA_ROWS.map(row=>row.id));
  }
  const fullSheetCount=KANA_ROWS.length*2+Math.ceil(BEGINNER_KANJI.length/5)+1;
  await expect(page.locator(".print-sheet")).toHaveCount(fullSheetCount);
  await page.emulateMedia({media:"print"});
  expect(await page.locator(".paper-boxes .paper-box").evaluateAll(boxes=>boxes.every(box=>{
    const {width,height}=box.getBoundingClientRect();return Math.abs(width-height)<2;
  }))).toBe(true);
  const completePdf=await page.pdf({preferCSSPageSize:true,printBackground:true});
  expect((completePdf.toString("latin1").match(/\/Type\s*\/Page\b/g)||[]).length).toBe(fullSheetCount);
  await page.emulateMedia({media:"screen"});
  await page.locator("#worksheet-kind").selectOption("sentences");
  await expect(page.locator(".print-sheet")).toHaveCount(3);
  await expect(page.locator(".print-sheet").nth(1).locator(".paper-repeat-grid .paper-box")).toHaveCount(81);
  await expect(page.locator(".print-sheet").last()).toContainText("Gabarito");
  await page.locator("#worksheet-repeat-pages").selectOption("0");
  await expect(page.locator(".paper-repeat-grid")).toHaveCount(0);
  await expect(page.locator(".print-sheet")).toHaveCount(2);
  await expect(page.locator(".print-sheet").last()).toContainText("Gabarito");
  await page.locator("#worksheet-answers").uncheck();
  await expect(page.locator(".print-sheet")).toHaveCount(1);
  await page.locator("#worksheet-kind").selectOption("words");
  await page.locator("#worksheet-models").uncheck();
  await expect(page.locator(".paper-word")).toHaveCount(0);
  await page.locator("#worksheet-answers").check();
  await expect(page.locator(".print-sheet").last()).toContainText("Gabarito");
});

test("separate browsers keep their own preferences and server profile",async({page,browser})=>{
  await go(page,"settings");
  await page.locator('.theme-card[data-theme-choice="arcade"]').click();
  await expect(page.locator("#save-status")).toHaveText("Progresso salvo");
  const first=await page.evaluate(()=>localStorage.getItem("maru-profile-id"));
  const other=await browser.newContext();
  try{
    const second=await other.newPage();
    await second.goto(page.url());
    await expect(second.locator("main h1")).toBeVisible();
    await expect(second.locator("html")).toHaveAttribute("data-theme","dojo");
    expect(await second.evaluate(()=>localStorage.getItem("maru-profile-id")) ).not.toBe(first);
  }finally{await other.close();}
});

test("new screens and arcade layouts fit desktop, tablet and small phones",async({page})=>{
  test.setTimeout(90000);
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  for(const theme of ["dojo","arcade"]){
    await go(page,"settings");await page.locator('.theme-card[data-theme-choice="'+theme+'"]').click();
    for(const width of [1440,768,390,320]){
      await page.setViewportSize({width,height:900});
      const routes=theme==="arcade"?["home","journey","kana","kanji","writing","sentences","particles","expressions","library","review","settings","lesson/welcome","vocabulary","exercises","worksheets","glossary"]:["vocabulary","exercises","worksheets","glossary","settings"];
      for(const route of routes){
        await go(page,route);
        await expect(page.locator("body"),theme+" colors at "+width).toHaveCSS("background-color",theme==="arcade"?"rgb(5, 7, 19)":"rgb(248, 247, 243)");
        expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),theme+" "+route+" at "+width).toBe(false);
      }
    }
    await page.setViewportSize({width:1440,height:1000});
  }
  expect(errors).toEqual([]);
});

test("voice API failures explain the interruption and leave the button usable",async({page})=>{
  await page.route("**/api/audio",route=>route.fulfill({status:429,json:{error:"A API de voz pediu um intervalo. Tente novamente em 10 segundos.",retryAfter:10}}));
  await go(page,"settings");
  const button=page.getByRole("button",{name:"Testar pronúncia japonesa"});
  await button.click();
  await expect(page.locator("#toast")).toContainText("10 segundos");
  await expect(button).toHaveAttribute("aria-busy","false");
  await expect(button).toBeEnabled();
});

test("KanjiAPI readings load on expansion and remain usable if the provider is offline",async({page})=>{
  let calls=0;
  await page.route("https://kanjiapi.dev/v1/kanji/**",route=>{calls++;return route.fulfill({json:{kanji:"水",stroke_count:4,kun_readings:["みず"],on_readings:["スイ"],meanings:["water"]}});});
  await go(page,"kanji");
  const card=page.locator('[data-kanji="水"]');
  await card.locator("summary").click();
  await expect(card.locator(".kanji-api-details")).toContainText("スイ");
  await expect(card.locator(".kanji-api-details")).toContainText("4 traços");
  expect(calls).toBe(1);
  await page.reload();await card.locator("summary").click();
  await expect(card.locator(".kanji-api-details")).toContainText("スイ");
  expect(calls).toBe(1);
  await page.route("https://kanjiapi.dev/v1/kanji/**",route=>route.abort());
  const fire=page.locator('[data-kanji="火"]');await fire.locator("summary").click();
  await expect(fire.locator(".kanji-api-details")).toContainText("Consulta salva da KanjiAPI");
  await expect(fire.locator(".kanji-api-details")).toContainText("4 traços");
});

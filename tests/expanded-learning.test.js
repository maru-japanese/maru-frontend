import assert from "node:assert/strict";
import test from "node:test";
import { pronunciationCatalog, getPronunciation } from "../shared/pronunciation.js";
import { audioKey } from "../shared/audioText.js";
import { VOCABULARY } from "../shared/vocabulary.js";
import { GLOSSARY, conceptsIn } from "../shared/glossary.js";
import { EXERCISE_GROUPS } from "../shared/exercises.js";
import { EXPRESSIONS, SENTENCES } from "../shared/catalog.js";
import { normalizeSnapshot, mergeSnapshots, recordReview, completeLesson } from "../shared/progress.js";
import { playerLevel, ACHIEVEMENTS, dailyMissions } from "../shared/gamification.js";
import { checkGuidedSentence } from "../shared/sentenceCheck.js";
import { PICTURE_WORDS, PICTURE_BANK_ORDER, PRINT_DIALOGUES } from "../shared/printActivities.js";
import { readFileSync, readdirSync } from "node:fs";

test("visual and audio preferences migrate safely and survive a newer local snapshot", () => {
  const legacy = normalizeSnapshot({ xp: {total: 42} });
  assert.equal(legacy.preferences.theme,"dojo");
  assert.equal(legacy.preferences.audioRate,1);
  assert.equal(legacy.preferences.soundEffects,true);
  assert.equal(legacy.stats.writingSessions,0);
  const invalid = normalizeSnapshot({preferences:{theme:"unknown",audioRate:-1}});
  assert.equal(invalid.preferences.theme,"dojo");
  assert.equal(normalizeSnapshot({preferences:{theme:"heisei"}}).preferences.theme,"dojo");
  assert.equal(invalid.preferences.audioRate,1);
  const local = normalizeSnapshot({updatedAt:200,preferences:{theme:"arcade",audioRate:.75,soundEffects:false},stats:{writingSessions:3}});
  const merged = mergeSnapshots(local,{updatedAt:100,preferences:{theme:"dojo"}});
  assert.equal(merged.preferences.theme,"arcade");
  assert.equal(merged.preferences.audioRate,.75);
  assert.equal(merged.preferences.soundEffects,false);
  assert.equal(merged.stats.writingSessions,3);
});

test("levels, missions and achievements reflect recorded actions, including wrong attempts", () => {
  const p=normalizeSnapshot();
  assert.deepEqual(ACHIEVEMENTS.filter(item=>item.test(p)),[]);
  assert.equal(playerLevel(0).level,1);
  assert.equal(playerLevel(49).level,1);
  assert.equal(playerLevel(50).level,2);
  assert.equal(playerLevel(50).earned,0);
  assert.equal(playerLevel(200).level,3);
  for(let i=0;i<5;i++)recordReview(p,"listen-word-"+i,i!==0);
  assert.equal(ACHIEVEMENTS.find(item=>item.id==="ears").test(p),false);
  recordReview(p,"listen-word-0",true);
  assert.equal(ACHIEVEMENTS.find(item=>item.id==="ears").test(p),true);
  completeLesson(p,"welcome",3);
  const missions=dailyMissions(p);
  assert.equal(missions[0].current,5);
  assert.equal(missions[1].current,1);
  assert.equal(missions[2].current,5);
});

test("every authored exercise has one answer, distinct choices and a teaching explanation", () => {
  const items=EXERCISE_GROUPS.flatMap(group=>group.items);
  assert.equal(new Set(items.map(item=>item.id)).size,items.length);
  assert.ok(VOCABULARY.length>=60);
  assert.equal(EXPRESSIONS.length,50);
  assert.equal(SENTENCES.length,32);
  for(const item of items){
    assert.ok(item.prompt && item.answer && item.speech && item.explanation,item.id);
    if(item.choices){
      assert.equal(item.choices.filter(choice=>choice===item.answer).length,1,item.id);
      assert.equal(new Set(item.choices).size,4,item.id);
    }
  }
  assert.ok(GLOSSARY.length>=25);
  assert.ok(conceptsIn("A partícula marca o objeto.").some(item=>item.id==="particle"));
  assert.ok(!conceptsIn("O superverbo inventado").some(item=>item.id==="verb"));
});

test("expanded sentence models accept the kana reading and reject wrong particles or tense", () => {
  assert.equal(checkGuidedSentence("home-study","いえでにほんごをべんきょうします").correct,true);
  assert.equal(checkGuidedSentence("cat-here","ここにねこがいます").correct,true);
  assert.equal(checkGuidedSentence("ate","きのうパンをたべました").correct,true);
  assert.equal(checkGuidedSentence("past-negative","きのうほんをよみませんでした").correct,true);
  assert.equal(checkGuidedSentence("cat-here","ここで猫がいます").correct,false);
  assert.equal(checkGuidedSentence("ate","昨日パンを食べます").correct,false);
});

test("all study pronunciations have context-appropriate text for the voice API", () => {
  const entries=pronunciationCatalog();
  assert.ok(entries.length>=680);
  assert.equal(new Set(entries.map(item=>item.key)).size,entries.length);
  assert.equal(getPronunciation("水").spoken,"みず");
  assert.equal(getPronunciation("日").spoken,"ひ");
  assert.equal(getPronunciation("を").spoken,"お");
  for(const item of EXERCISE_GROUPS.flatMap(group=>group.items))assert.ok(getPronunciation(item.speech),item.id);
  assert.equal(audioKey("こんにちは。"),audioKey("こんにちは"));
  assert.equal(getPronunciation("texto livre não autorizado"),undefined);
});

test("printable picture and dialogue activities have complete local content", () => {
  assert.equal(PICTURE_WORDS.length,6);
  assert.deepEqual([...PICTURE_BANK_ORDER].sort((a,b)=>a-b),[0,1,2,3,4,5]);
  for(const item of PICTURE_WORDS){
    assert.ok(VOCABULARY.some(word=>word.id===item.wordId),item.wordId);
    const image = readFileSync(new URL(`../frontend/assets/img/irasutoya-${item.id}.png`,import.meta.url));
    assert.equal(image.subarray(1,4).toString(),"PNG");
    assert.ok(image.readUInt32BE(16)>=250 && image.readUInt32BE(20)>=250,"Imagem legível na impressão");
  }
  assert.ok(PRINT_DIALOGUES.length>=3);
  for(const dialogue of PRINT_DIALOGUES){
    assert.ok(dialogue.title && dialogue.setting);
    assert.ok(dialogue.turns.some(turn=>turn.answer && turn.cue));
    assert.ok(dialogue.turns.every(turn=>turn.speaker && (turn.text || turn.answer)));
    assert.ok(dialogue.questions.every(question=>question.prompt && question.answer));
  }
});

test("every Irasutoya illustration has a registered source", () => {
  const directory = new URL("../frontend/assets/img/",import.meta.url);
  const images = readdirSync(directory).filter(name=>name.startsWith("irasutoya-") && /\.(png|jpe?g|webp)$/.test(name));
  const inventory = readFileSync(new URL("../frontend/assets/img/IRASUTOYA.md",import.meta.url),"utf8");
  assert.ok(images.length>0);
  for(const name of images)assert.ok(inventory.includes(name),`Ilustração sem fonte registrada: ${name}`);
});

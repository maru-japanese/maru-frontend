import assert from "node:assert/strict";
import test from "node:test";
import { furiganaHTML, furiganaSegments } from "../shared/furigana.js";
import { LESSONS } from "../shared/curriculum.js";
import { VOCABULARY } from "../shared/vocabulary.js";
import { PARTICLES, EXPRESSIONS, SENTENCES } from "../shared/catalog.js";
import { PRINT_DIALOGUES } from "../shared/printActivities.js";
import { PARTICLE_EXERCISES, DIALOGUE_EXERCISES, IMAGE_MATCH_EXERCISES, LISTENING_EXERCISES } from "../shared/exercises.js";

const KANJI = /[一-鿿]/;

test("furigana wraps only kanji runs, even with repeated or self-echoing anchors", () => {
  assert.equal(furiganaHTML("水を飲みます。", "みずをのみます。"), "<ruby>水<rt>みず</rt></ruby>を<ruby>飲<rt>の</rt></ruby>みます。");
  assert.equal(furiganaHTML("電車で行きます。", "でんしゃでいきます。"), "<ruby>電車<rt>でんしゃ</rt></ruby>で<ruby>行<rt>い</rt></ruby>きます。");
  assert.equal(furiganaHTML("先生の先生です。", "せんせいのせんせいです。"), "<ruby>先生<rt>せんせい</rt></ruby>の<ruby>先生<rt>せんせい</rt></ruby>です。");
  assert.equal(furiganaHTML("山川さんは山に行きます。", "やまかわさんはやまにいきます。"), "<ruby>山川<rt>やまかわ</rt></ruby>さんは<ruby>山<rt>やま</rt></ruby>に<ruby>行<rt>い</rt></ruby>きます。");
});

test("furigana leaves pure-kana text untouched and escapes unsafe characters", () => {
  assert.equal(furiganaHTML("ねこ", "ねこ"), "ねこ");
  assert.equal(furiganaHTML("ねこ", ""), "ねこ");
  assert.equal(furiganaHTML("<水>", "<みず>", s => s.replace(/[<>]/g, c => ({ "<": "&lt;", ">": "&gt;" }[c]))), "&lt;<ruby>水<rt>みず</rt></ruby>&gt;");
});

test("furigana falls back to plain text when the reading cannot be aligned", () => {
  assert.equal(furiganaSegments("水を飲みます。", "totally unrelated"), null);
  assert.equal(furiganaHTML("水を飲みます。", "totally unrelated"), "水を飲みます。");
});

test("every kanji-containing lesson example has a reading that aligns correctly", () => {
  for (const lesson of LESSONS) {
    for (const section of lesson.sections) {
      for (const example of section.examples || []) {
        if (!KANJI.test(example.jp)) continue;
        assert.ok(furiganaSegments(example.jp, example.reading), `${lesson.id}: "${example.jp}" has no valid reading ("${example.reading}")`);
      }
    }
  }
});

test("every kanji-containing piece of Japanese text across the site has a reading that aligns correctly", () => {
  const bad = [];
  const check = (label, jp, reading) => { if (jp && KANJI.test(jp) && !furiganaSegments(jp, reading)) bad.push(`${label}: "${jp}" has no valid reading (${JSON.stringify(reading)})`); };
  for (const word of VOCABULARY) { check("vocab-term:" + word.id, word.jp, word.reading); check("vocab-sentence:" + word.id, word.sentence, word.sentenceReading); }
  for (const particle of PARTICLES) check("particle:" + particle.char, particle.jp, particle.reading);
  for (const expression of EXPRESSIONS) check("expression:" + expression.id, expression.jp, expression.reading);
  for (const sentence of SENTENCES) for (const token of sentence.tokens) check("sentence-token:" + sentence.id, token[0], token[3]);
  for (const dialogue of PRINT_DIALOGUES) for (const turn of dialogue.turns) { check("dialogue-text:" + dialogue.id, turn.text, turn.reading); check("dialogue-answer:" + dialogue.id, turn.answer, turn.answerReading); }
  for (const item of PARTICLE_EXERCISES) check("particle-exercise:" + item.id, item.prompt, item.reading);
  for (const item of DIALOGUE_EXERCISES) check("dialogue-exercise:" + item.id, item.answer, item.answerReading);
  for (const item of IMAGE_MATCH_EXERCISES) check("image-exercise:" + item.id, item.prompt, item.reading);
  for (const item of LISTENING_EXERCISES) check("listening-exercise:" + item.id, item.prompt, item.reading);
  assert.deepEqual(bad, []);
});

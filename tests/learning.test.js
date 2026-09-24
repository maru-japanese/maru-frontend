import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { MODULES, LESSONS, getLesson } from "../shared/curriculum.js";
import { KANA } from "../shared/content.js";
import { ALL_KANA, BEGINNER_KANJI, SENTENCES } from "../shared/catalog.js";
import { normalizeSnapshot, mergeSnapshots, completeLesson, recordReview, scheduleReview, currentStreak, localDay, dueReviews } from "../shared/progress.js";
import { checkGuidedSentence } from "../shared/sentenceCheck.js";
import { kanaToRomaji, isTypedAnswerCorrect } from "../shared/romaji.js";

test("the curriculum has complete, addressable lessons and answer explanations", () => {
  assert.equal(MODULES.length, 8);
  assert.equal(LESSONS.length, 40);
  assert.equal(new Set(LESSONS.map(item => item.id)).size, LESSONS.length);
  assert.equal(getLesson("welcome").moduleId, "start");
  for (const lesson of LESSONS) {
    assert.ok(lesson.sections.length >= 2);
    assert.equal(lesson.quiz.length, 3);
    for (const question of lesson.quiz) {
      assert.ok(question.choices[question.answer]);
      assert.ok(question.explanation.length > 10);
      assert.equal(new Set(question.choices).size, question.choices.length);
    }
  }
});

test("kana separates the 46 basics, 25 marked forms and 33 combinations per script", () => {
  for (const script of ["hiragana", "katakana"]) {
    assert.equal(KANA.filter(item => item.script === script && item.group === "seion").length, 46);
    assert.equal(KANA.filter(item => item.script === script && item.group !== "seion").length, 25);
    assert.equal(ALL_KANA.filter(item => item.script === script && item.group === "combined").length, 33);
  }
  assert.equal(new Set(ALL_KANA.map(item => item.id)).size, ALL_KANA.length);
});

test("all notebook characters have ordered local stroke models", () => {
  const strokes = JSON.parse(readFileSync(new URL("../frontend/assets/data/strokes.json", import.meta.url))).characters;
  for (const item of [...KANA, ...BEGINNER_KANJI]) {
    assert.ok(strokes[item.char]?.length > 0, "Missing model: " + item.char);
    assert.ok(strokes[item.char].every(path => path.startsWith("M")));
  }
  assert.equal(strokes["あ"].length, 3);
  assert.equal(strokes["十"].length, 2);
  assert.equal(strokes["山"].length, 3);
});

test("lesson completion awards experience and activity once", () => {
  const p = normalizeSnapshot();
  assert.equal(completeLesson(p, "welcome", 3, Date.now()), true);
  assert.equal(completeLesson(p, "welcome", 3, Date.now()), false);
  assert.equal(p.xp.total, 30);
  assert.equal(p.activity[localDay()], 1);
});

test("incorrect attempts reset the interval, correct attempts space out reviews", () => {
  const now = Date.now();
  const p = normalizeSnapshot();
  recordReview(p, "h-a-0", false, now);
  assert.equal(p.reviews["h-a-0"].due, now + 600000);
  assert.equal(p.kanaStats["h-a-0"].wrong, 1);
  assert.deepEqual(dueReviews(p, now), []);
  assert.deepEqual(dueReviews(p, now + 600000), ["h-a-0"]);
  recordReview(p, "h-a-0", true, now + 600000);
  assert.equal(p.reviews["h-a-0"].interval, 1);
  recordReview(p, "h-a-0", true, now + 1200000);
  assert.equal(p.reviews["h-a-0"].interval, 2);
  assert.equal(scheduleReview(p.reviews["h-a-0"], false, now).interval, 0);
  assert.equal(scheduleReview({ ...p.reviews["h-a-0"], interval: 40 }, true, now).interval, 60);
});

test("streak permits one weekly rest day and expires after a longer gap", () => {
  const p = normalizeSnapshot();
  const now = new Date(2026, 8, 5, 0, 5);
  const yesterday = new Date(2026, 8, 4, 23, 55);
  p.streak = { count: 3, lastDate: localDay(yesterday) };
  assert.equal(currentStreak(p, now), 3);
  assert.equal(currentStreak(p, new Date(2026, 8, 6, 0, 5)), 3);
  assert.equal(currentStreak(p, new Date(2026, 8, 7, 0, 5)), 0);
});

test("migration retains legacy progress and normalizes new fields", () => {
  const p = normalizeSnapshot({ xp: { total: 100 }, progress: { n5v1: { reps: 2, due: 100, interval: 3 } }, kanaStats: { "h-a-0": { attempts: 4, wrong: 1, streak: 2 } } });
  assert.equal(p.version, 2);
  assert.equal(p.xp.total, 100);
  assert.equal(p.progress.n5v1.interval, 3);
  assert.equal(p.kanaStats["h-a-0"].attempts, 4);
  assert.equal(p.reviews["h-a-0"].attempts, 4);
  assert.equal(p.reviews.n5v1.interval, 3);
  assert.deepEqual(p.lessons, {});
  assert.equal(p.preferences.dailyGoal, 5);
  assert.equal(normalizeSnapshot({ xp: { total: -5 }, preferences: { dailyGoal: 999 } }).xp.total, 0);
});

test("merging keeps newer offline review records and the union of completed lessons", () => {
  const local = normalizeSnapshot({ updatedAt: 200, lessons: { welcome: { completedAt: 100 } }, reviews: { test: { updatedAt: 200, due: 300, attempts: 3 } }, preferences: { romaji: false } });
  const remote = normalizeSnapshot({ updatedAt: 100, lessons: { sounds: { completedAt: 80 } }, reviews: { test: { updatedAt: 100, due: 200, attempts: 1 } } });
  const merged = mergeSnapshots(local, remote);
  assert.equal(merged.reviews.test.attempts, 3);
  assert.equal(Object.keys(merged.lessons).length, 2);
  assert.equal(merged.preferences.romaji, false);
});

test("all guided sentence models work in Japanese and romanized form", () => {
  for (const item of SENTENCES) {
    assert.equal(checkGuidedSentence(item.id, item.tokens.map(token => token[0]).join("")).correct, true, item.id);
    assert.equal(checkGuidedSentence(item.id, item.tokens.map(token => token[1]).join(" ")).correct, true, item.id);
  }
  assert.equal(checkGuidedSentence("identity", "わたしはがくせいです").correct, true);
  assert.equal(checkGuidedSentence("identity", "わたしを学生です").correct, false);
  assert.equal(checkGuidedSentence("water", "banana を water").correct, false);
  assert.equal(checkGuidedSentence("school", "gakkou ni ikimasu").correct, true);
  assert.equal(checkGuidedSentence("missing", "x").status, "unknown");
});

test("romanization preserves geminated digraphs and long vowels", () => {
  assert.equal(kanaToRomaji("ざっし"), "zasshi");
  assert.equal(kanaToRomaji("まっちゃ"), "matcha");
  assert.equal(kanaToRomaji("コーヒー"), "koohii");
  assert.equal(kanaToRomaji("パーティー"), "paatii");
  assert.equal(isTypedAnswerCorrect("gakkō", { term: "学校", reading: "がっこう" }), true);
  assert.equal(isTypedAnswerCorrect("gakko", { term: "学校", reading: "がっこう" }), false);
  assert.equal(isTypedAnswerCorrect("si", { term: "し", reading: "し" }), true);
});
